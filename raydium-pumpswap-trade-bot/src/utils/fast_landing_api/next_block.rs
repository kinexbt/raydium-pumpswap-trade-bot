use std::{str::FromStr, sync::Arc};

use crate::{get_race_ix, get_token_balance_change_from_tx, log, NEXT_BLOCK_MIN_TIP, NEXT_FEE};
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
pub enum NextBlockRegion {
    Frankfurt,
    NewYork,
}

impl NextBlockRegion {
    fn endpoint(&self) -> &'static str {
        match self {
            NextBlockRegion::Frankfurt => "https://fra.nextblock.io/api/v2/submit",
            NextBlockRegion::NewYork => "https://ny.nextblock.io/api/v2/submit",
        }
    }
}

#[derive(Debug, Error)]
pub enum NextBlockError {
    #[error("HTTP request failed: {0}")]
    ReqwestError(#[from] reqwest::Error),

    #[error("NextBlock API returned an error: {0}")]
    ApiError(String),
}

pub async fn submit_next_transaction(
    transaction_content: &str,
    auth_header: &str,
    region: NextBlockRegion,
    front_running_protection: bool,
) -> Result<String, NextBlockError> {
    let client = Client::new();
    let endpoint = region.endpoint();

    let payload = json!({
        "transaction": {
            "content": transaction_content,
        },
        "frontRunningProtection": front_running_protection,
    });

    let response = client
        .post(endpoint)
        .header("Authorization", auth_header)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;

    if let Some(signature) = json.get("signature").and_then(|s| s.as_str()) {
        Ok(signature.to_string())
    } else {
        Err(NextBlockError::ApiError(
            "Signature not found in response".to_string(),
        ))
    }
}

pub async fn build_and_submit_next<'a>(
    payer: &'a Arc<Keypair>,
    buy_ix: &Instruction,
    tip_amount: f64,
    auth_header: &str,
    blockhash: Hash,
    region: NextBlockRegion,
    client: Arc<RpcClient>,
    timestamp: u64,
    is_buy : bool
) -> () {
    log!(format!("[ NextBlock Building Tx ] {:#?}", region), "info");
    let mut _ixs: Vec<Instruction> = vec![];
    let modify_compute_units =
        solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_price(30000);

    _ixs.insert(0, modify_compute_units);

    let race_ix = get_race_ix(payer.pubkey(), timestamp);
    _ixs.insert(1, race_ix);

    _ixs.insert(2, buy_ix.clone());
    let tip_fee_addr = Pubkey::from_str_const(NEXT_FEE[0]);

    let tip: f64;

    if tip_amount < NEXT_BLOCK_MIN_TIP {
        tip = NEXT_BLOCK_MIN_TIP
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

    let data: Vec<NextBlockRegion> = vec![NextBlockRegion::Frankfurt, NextBlockRegion::NewYork];

    log!(format!("[ NextBlock Submiting Tx ] {:#?}", region), "info");

    stream::iter(data)
        .for_each_concurrent(None, |region| {
            let client = client.clone(); // Clone client for async block
            async move {
                match submit_next_transaction(&encoded_tx, auth_header, region, false).await {
                    Ok(sig) => {
                        log!(format!("[NextBlockRegion Confirm] {} ", sig), "success");
                        if let Ok(signature) = sig.parse::<Signature>() {
                            get_token_balance_change_from_tx(client, signature, is_buy).await;
                        } else {
                            log!(format!("Invalid signature string: {}", sig), "error");
                        }
                    }
                    Err(e) => {
                        log!(format!("[NextBlockRegion Error] {}", e), "error");
                    }
                }
            }
        })
        .await;
}
