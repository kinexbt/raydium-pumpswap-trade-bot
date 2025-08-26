use std::{str::FromStr, sync::Arc};

use crate::{
    get_race_ix, get_token_balance_change_from_tx, log, JsonRpcResponse, RayAMMSwapBaseInParams,
    NOZOMI_MIN_TIP, NOZOMI_TIP,
};
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

#[derive(Debug)]
pub enum NozomiRegion {
    USEast,
    AMS,
    FRA,
}

impl NozomiRegion {
    fn url(&self) -> &'static str {
        match self {
            NozomiRegion::USEast => "http://nozomi-preview-pit.temporal.xyz/?c=",
            NozomiRegion::AMS => "http://nozomi-preview-ams.temporal.xyz/?c=",
            NozomiRegion::FRA => "http://fra1.nozomi.temporal.xyz/?c=",
        }
    }
}

pub async fn submit_nozomi_tx(
    transaction_content: &str,
    region: NozomiRegion,
    auth_key: &str,
) -> anyhow::Result<JsonRpcResponse> {
    let client = Client::new();
    let url = format!("{}{}", region.url(), auth_key);

    let payload = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sendTransaction",
        "params": [transaction_content, {"encoding": "base64"}]
    });

    let response = client.post(url).json(&payload).send().await?;

    let response_text = response.text().await?;

    let data: JsonRpcResponse = serde_json::from_str(response_text.as_str())?;

    Ok(data)
}

pub async fn build_and_submit_nozomi<'a>(
    payer: &'a Arc<Keypair>,
    buy_ix: &Instruction,
    tip_amount: f64,
    auth_header: &str,
    blockhash: Hash,
    region: NozomiRegion,
    client: Arc<RpcClient>,
    timestamp: u64,
    is_buy: bool,
) -> () {
    log!(format!("[ Nozomi Building Tx ] {:#?}", region), "info");
    let mut _ixs: Vec<Instruction> = vec![];
    let modify_compute_units =
        solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_price(30000);

    _ixs.insert(0, modify_compute_units);

    let race_ix = get_race_ix(payer.pubkey(), timestamp);
    _ixs.insert(1, race_ix);

    _ixs.insert(2, buy_ix.clone());
    let tip_fee_addr = Pubkey::from_str_const(NOZOMI_TIP[0]);

    let tip: f64;

    if tip_amount < NOZOMI_MIN_TIP {
        tip = NOZOMI_MIN_TIP
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

    let data: Vec<NozomiRegion> = vec![NozomiRegion::AMS, NozomiRegion::FRA, NozomiRegion::USEast];

    log!(format!("[ Nozomi Submiting Tx ] {:#?}", region), "info");
    stream::iter(data)
        .for_each_concurrent(None, |region| {
            let client = client.clone();
            async move {
                match submit_nozomi_tx(&encoded_tx, region, auth_header).await {
                    Ok(sig) => {
                        log!(format!("[Nozomi Confirm] {} ", sig.result), "success");
                        if let Ok(signature) = sig.result.parse::<Signature>() {
                            get_token_balance_change_from_tx(client, signature, is_buy).await;
                        } else {
                            log!(format!("Invalid signature string: {}", sig.result), "error");
                        }
                    }
                    Err(e) => {
                        log!(format!("[Nozomi Error] {}", e), "error");
                    }
                }
            }
        })
        .await;
}

pub async fn build_and_submit_pure_nozomi<'a>(
    payer: &'a Arc<Keypair>,
    buy_ix: &Instruction,
    tip_amount: f64,
    auth_header: &str,
    blockhash: Hash,
    client: Arc<RpcClient>,
    is_buy: bool,
) -> () {
    log!(format!("[ Nozomi Building Tx ]"), "info");
    let mut _ixs: Vec<Instruction> = vec![];
    let modify_compute_units =
        solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_price(30000);

    _ixs.insert(0, modify_compute_units);

    _ixs.insert(1, buy_ix.clone());
    let tip_fee_addr = Pubkey::from_str_const(NOZOMI_TIP[0]);

    let tip: f64;

    if tip_amount < NOZOMI_MIN_TIP {
        tip = NOZOMI_MIN_TIP
    } else {
        tip = tip_amount
    }

    let tip_ix = system_instruction::transfer(&payer.pubkey(), &tip_fee_addr, sol_to_lamports(tip));

    _ixs.insert(2, tip_ix);

    let txn = Transaction::new_signed_with_payer(
        &_ixs,
        Some(&payer.pubkey()),
        &[&payer.as_ref()],
        blockhash,
    );
    let serialized_tx = bincode::serialize(&txn).expect("Failed to serialize transaction");

    let encoded_tx = &bs64::encode(&serialized_tx);

    log!(format!("[ Nozomi Submiting Tx ]"), "info");
    match submit_nozomi_tx(&encoded_tx, NozomiRegion::AMS, auth_header).await {
        Ok(sig) => {
            log!(format!("[Nozomi Confirm] {} ", sig.result), "success");

            if let Ok(signature) = sig.result.parse::<Signature>() {
                get_token_balance_change_from_tx(client, signature, is_buy).await;
            } else {
                log!(format!("Invalid signature string: {}", sig.result), "error");
            }
        }
        Err(e) => {
            log!(format!("[Nozomi Error] {}", e), "error");
        }
    }
}
