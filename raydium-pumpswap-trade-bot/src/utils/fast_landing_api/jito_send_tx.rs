use std::sync::Arc;

use crate::{get_race_ix, get_token_balance_change_from_tx, log, JITO_MIN_TIP, JITO_TIP};
use futures::stream::{self, StreamExt};
use reqwest::Client;
use serde_json::json;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    hash::Hash,
    instruction::Instruction,
    native_token::sol_to_lamports,
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
    system_instruction,
    transaction::Transaction,
};
use thiserror::Error;

#[derive(Debug)]
pub enum JitoRegion {
    Mainnet,
    Amsterdam,
    Frankfurt,
    NY,
    Tokyo,
}

impl JitoRegion {
    fn endpoint(&self) -> &'static str {
        match self {
            JitoRegion::Mainnet => "https://mainnet.block-engine.jito.wtf/api/v1/transactions",
            JitoRegion::Amsterdam => {
                "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/transactions"
            }
            JitoRegion::Frankfurt => {
                "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/transactions"
            }
            JitoRegion::NY => "https://ny.mainnet.block-engine.jito.wtf/api/v1/transactions",
            JitoRegion::Tokyo => "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/transactions",
        }
    }
}

#[derive(Debug, Error)]
pub enum JitoError {
    #[error("HTTP request failed: {0}")]
    ReqwestError(#[from] reqwest::Error),

    #[error("Jito API returned an error: {0}")]
    JitoApiError(String),
}

pub async fn send_tx_using_jito(
    encoded_tx: &str,
    region: &JitoRegion,
) -> Result<serde_json::Value, JitoError> {
    let client = Client::new();
    let rpc_endpoint = region.endpoint();

    let payload = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sendTransaction",
        "params": [encoded_tx , {
            "encoding": "base64"
          }],

    });

    let response = client
        .post(&format!("{}?bundleOnly=false", rpc_endpoint))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;

    if let Some(error) = json.get("error") {
        return Err(JitoError::JitoApiError(error.to_string()));
    }

    Ok(json)
}

pub async fn build_and_submit_jito<'a>(
    payer: &'a Arc<Keypair>,
    buy_ix: &Instruction,
    tip_amount: f64,
    blockhash: Hash,
    client: Arc<RpcClient>,
    timestamp: u64,
    is_buy : bool
) -> () {
    log!(format!("[ Jito Building Tx ]"), "info");

    let mut _ixs: Vec<Instruction> = vec![];
    let modify_compute_units =
        solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_price(30000);

    _ixs.insert(0, modify_compute_units);

    let race_ix = get_race_ix(payer.pubkey(), timestamp);
    _ixs.insert(1, race_ix);

    _ixs.insert(2, buy_ix.clone());
    let tip_fee_addr = Pubkey::from_str_const(JITO_TIP[0]);

    let tip: f64;

    if tip_amount < JITO_MIN_TIP {
        tip = JITO_MIN_TIP
    } else {
        tip = tip_amount
    }

    let tip_ix = system_instruction::transfer(&payer.pubkey(), &tip_fee_addr, sol_to_lamports(tip));

    _ixs.insert(3, tip_ix);

    let txn = Transaction::new_signed_with_payer(
        &_ixs,
        Some(&payer.pubkey()),
        &[&payer.as_ref()],
        blockhash,
    );
    let serialized_tx = bincode::serialize(&txn).expect("Failed to serialize transaction");

    let encoded_tx = &bs64::encode(&serialized_tx);

    let data = [
        JitoRegion::Amsterdam,
        JitoRegion::Frankfurt,
        JitoRegion::Mainnet,
        JitoRegion::NY,
        JitoRegion::Tokyo,
    ];

    log!(format!("[ Jito Submiting Tx ]"), "info");

    stream::iter(&data)
        .for_each_concurrent(10, |each_region| {
            // Clone `client` inside here so each task gets its own reference
            let client = client.clone();
            async move {
                match send_tx_using_jito(&encoded_tx, each_region).await {
                    Ok(sig) => {
                        log!(
                            format!("[JitoRegion Confirm] {} ", sig.get("result").unwrap()),
                            "success"
                        );

                        if let Some(sig_str) = sig.get("result").and_then(|v| v.as_str()) {
                            if let Ok(signature) = sig_str.parse::<Signature>() {
                                get_token_balance_change_from_tx(client, signature, is_buy).await;
                            } else {
                                log!(format!("Invalid signature string: {}", sig_str), "error");
                            }
                        }
                    }
                    Err(e) => {
                        log!(format!("[JitoRegion Error] {}", e), "error");
                    }
                }
            }
        })
        .await;
}
