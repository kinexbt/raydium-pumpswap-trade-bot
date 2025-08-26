use std::{str::FromStr, sync::Arc};

use reqwest::Client;
use serde_json::json;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    hash::Hash, instruction::Instruction, native_token::sol_to_lamports, pubkey::Pubkey,
    signature::Keypair, signer::Signer, system_instruction, transaction::Transaction,
};
use thiserror::Error;

use crate::{get_race_ix, log, ZSLOT_MIN_TIP, ZSLOT_TIP};

#[derive(Debug)]
pub enum ZeroSlotRegion {
    Frankfurt,
    NewYork,
    AMS,
}

impl ZeroSlotRegion {
    fn endpoint(&self) -> &'static str {
        match self {
            ZeroSlotRegion::NewYork => "https://ny.0slot.trade?api-key=",
            ZeroSlotRegion::Frankfurt => "https://de.0slot.trade?api-key=",
            ZeroSlotRegion::AMS => "https://ams.0slot.trade?api-key=",
        }
    }
}

#[derive(Debug, Error)]
pub enum ZeroSlotError {
    #[error("HTTP request failed: {0}")]
    ReqwestError(#[from] reqwest::Error),

    #[error("ZeroSlot API returned an error: {0}")]
    ApiError(String),
}

pub async fn submit_zslot_transaction(
    transaction_content: &str,
    auth_header: &str,
    region: ZeroSlotRegion,
    front_running_protection: bool,
) -> Result<String, ZeroSlotError> {
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
        Err(ZeroSlotError::ApiError(
            "Signature not found in response".to_string(),
        ))
    }
}

pub async fn build_and_submit_zslot<'a>(
    payer: &'a Arc<Keypair>,
    buy_ix: &Instruction,
    tip_amount: f64,
    auth_header: &str,
    blockhash: &'a str,
    region: ZeroSlotRegion,
    client: Arc<RpcClient>,
    timestamp: u64,
) -> () {
    log!(format!("[ ZeroSlot ] {:#?}", region), "info");
    let mut _ixs: Vec<Instruction> = vec![];
    let modify_compute_units =
        solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_price(30000);

    _ixs.insert(0, modify_compute_units);

    let race_ix = get_race_ix(payer.pubkey(), timestamp);
    _ixs.insert(1, race_ix);

    _ixs.insert(2, buy_ix.clone());
    let tip_fee_addr = Pubkey::from_str_const(ZSLOT_TIP[0]);

    let tip: f64;

    if tip_amount < ZSLOT_MIN_TIP {
        tip = ZSLOT_MIN_TIP
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

    match submit_zslot_transaction(&encoded_tx, auth_header, region, false).await {
        Ok(sig) => {
            log!(format!("[ZeroSlot Confirm] {} ", sig), "success");
        }
        Err(e) => {
            log!(format!("[ZeroSlot Error] {}", e), "error");
        }
    }
}
