use std::sync::Arc;

use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    hash::Hash, instruction::Instruction, signature::Keypair, signer::Signer,
    transaction::Transaction,
};

use crate::{get_race_ix, get_token_balance_change_from_tx, log};

pub async fn build_and_submit_general<'a>(
    payer: &'a Arc<Keypair>,
    buy_ix: &Instruction,
    blockhash: Hash,
    client: Arc<RpcClient>,
    timestamp: u64,
    is_buy : bool
) {
    log!(format!("[ RPC Confirm Building Tx ] "), "info");
    let mut _ixs: Vec<Instruction> = vec![];
    let modify_compute_units =
        solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_price(30000);

    _ixs.insert(0, modify_compute_units);

    let race_ix = get_race_ix(payer.pubkey(), timestamp);
    _ixs.insert(1, race_ix);

    _ixs.insert(2, buy_ix.clone());

    let txn = Transaction::new_signed_with_payer(
        &_ixs,
        Some(&payer.pubkey()),
        &[&payer.as_ref()],
        blockhash,
    );

    log!(format!("[ RPC Confirm Submiting Tx ] "), "info");

    match client.send_transaction(&txn).await {
        Ok(signature) => {
            log!(format!("[RPC Confirm] {} ", signature), "success");

            get_token_balance_change_from_tx(client, signature, is_buy).await;
        }
        Err(err) => {
            log!(format!("[RPC Error] : {:?}", err), "error");
        }
    }
}
