use reqwest::Client;
use serde_json::json;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    hash::Hash, instruction::Instruction, native_token::sol_to_lamports, pubkey::Pubkey,
    signature::Keypair, signer::Signer, system_instruction, transaction::Transaction,
};
use std::{str::FromStr, sync::Arc};
use thiserror::Error;

use crate::{get_race_ix, log, BLOXROUTE_MIN_TIP, BLOX_TIP};

#[derive(Debug)]
pub enum BloXRegion {
    UK,
    NY,
    LA,
    Germany,
    Amsterdam,
    Tokyo,
}

impl BloXRegion {
    fn endpoint(&self) -> &'static str {
        match self {
            BloXRegion::UK => "https://uk.solana.dex.blxrbdn.com",
            BloXRegion::NY => "https://ny.solana.dex.blxrbdn.com",
            BloXRegion::LA => "https://la.solana.dex.blxrbdn.com",
            BloXRegion::Germany => "https://germany.solana.dex.blxrbdn.com",
            BloXRegion::Amsterdam => "https://amsterdam.solana.dex.blxrbdn.com",
            BloXRegion::Tokyo => "https://tokyo.solana.dex.blxrbdn.com",
        }
    }
}

#[derive(Debug, Error)]
pub enum BloXError {
    #[error("HTTP request failed: {0}")]
    ReqwestError(#[from] reqwest::Error),

    #[error("BloX API returned an error: {0}")]
    ApiError(String),
}

pub async fn submit_blox_tx(
    transaction_content: &str,
    auth_header: &str,
    region: BloXRegion,
    front_running_protection: bool,
    use_staked_rpcs: bool,
    sniping: bool,
) -> Result<serde_json::Value, BloXError> {
    let client = Client::new();
    let endpoint = format!("{}/api/v2/submit", region.endpoint());

    let payload = json!({
        "transaction": {
            "content": transaction_content,
        },
        "frontRunningProtection": front_running_protection,
        "skipPreFlight": true,
        "useStakedRPCs": use_staked_rpcs,
        "sniping": sniping,
        "fastBestEffort" : true
    });

    let response = client
        .post(&endpoint)
        .header("Authorization", auth_header)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;

    if let Some(error) = json.get("error") {
        return Err(BloXError::ApiError(error.to_string()));
    }

    Ok(json)
}

pub async fn submit_blox_paladin_tx(
    transaction_content: &str,
    auth_header: &str,
    region: BloXRegion,
) -> Result<serde_json::Value, BloXError> {
    let client = Client::new();
    let endpoint = format!("{}/api/v2/submit-paladin", region.endpoint());

    let payload = json!({
        "transaction": {
            "content": transaction_content,
        }
    });

    let response = client
        .post(&endpoint)
        .header("Authorization", auth_header)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;

    if let Some(error) = json.get("error") {
        return Err(BloXError::ApiError(error.to_string()));
    }

    Ok(json)
}

pub async fn build_and_submit_blox(
    payer: &Arc<Keypair>,
    buy_ix: &Instruction,
    tip_amount: f64,
    auth_header: &str,
    blockhash: &str,
    region: BloXRegion,
    client: Arc<RpcClient>,
    timestamp: u64,
) -> () {
    log!(format!("[ BloXRoute ] {:#?}", region), "info");
    let mut _ixs: Vec<Instruction> = vec![];
    let modify_compute_units =
        solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_price(30000);

    _ixs.insert(0, modify_compute_units);

    let race_ix = get_race_ix(payer.pubkey(), timestamp);
    _ixs.insert(1, race_ix);

    _ixs.insert(2, buy_ix.clone());
    let tip_fee_addr = Pubkey::from_str_const(BLOX_TIP[0]);

    let tip: f64;

    if tip_amount < BLOXROUTE_MIN_TIP {
        tip = BLOXROUTE_MIN_TIP
    } else {
        tip = tip_amount
    }

    let tip_ix = system_instruction::transfer(&payer.pubkey(), &tip_fee_addr, sol_to_lamports(tip));

    _ixs.insert(3, tip_ix);

    let txn = Transaction::new_signed_with_payer(
        &_ixs,
        Some(&payer.pubkey()),
        &[&payer.as_ref()],
        Hash::from_str(&blockhash).expect("msg"),
    );
    let serialized_tx = bincode::serialize(&txn).expect("Failed to serialize transaction");

    let encoded_tx = &bs64::encode(&serialized_tx);

    match submit_blox_tx(&encoded_tx, auth_header, region, false, true, false).await {
        Ok(sig) => {
            log!(format!("[BloXRoute Confirm] {} ", sig), "success");
        }
        Err(e) => {
            log!(format!("[BloXRoute Error] {}", e), "error");
        }
    }
}
