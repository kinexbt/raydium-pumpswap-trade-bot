use std::sync::Arc;

use super::*;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{hash::Hash, instruction::Instruction, signature::Keypair};

pub async fn multi_submit(
    client: Arc<RpcClient>,
    payer: Arc<Keypair>,
    buy_ix: Instruction,
    tip_amount: f64,
    blockhash: Hash,
    timestamp: u64,
    next_key: &str,
    nozomi_key: &str,
    blox_auth_header: &str,
    zero_slot_key: &str,
    is_buy : bool
) -> anyhow::Result<Vec<String>> {
    let client_general = client.clone();
    let blockhash_general = blockhash.clone();
    let buy_ix_general = buy_ix.clone();
    let payer_general = Arc::clone(&payer);
    // Spawn each task concurrently
    let general_handle = tokio::spawn(async move {
        build_and_submit_general(
            &payer_general,
            &buy_ix_general,
            blockhash_general,
            client_general,
            timestamp,
            is_buy
        )
        .await;
    });

    let client_jito = client.clone();
    let blockhash_jito = blockhash.clone();
    let buy_ix_jito = buy_ix.clone();
    let payer_jito = Arc::clone(&payer);
    let jito_handle = tokio::spawn(async move {
        build_and_submit_jito(
            &payer_jito,
            &buy_ix_jito,
            tip_amount,
            blockhash_jito,
            client_jito,
            timestamp,
            is_buy
        )
        .await;
    });

    let client_next = client.clone();
    let blockhash_next = blockhash.clone();
    let buy_ix_next = buy_ix.clone();
    let payer_next = Arc::clone(&payer);
    let next_key = next_key.to_string().clone();
    let next_handle = tokio::spawn(async move {
        build_and_submit_next(
            &payer_next,
            &buy_ix_next,
            tip_amount,
            &next_key,
            blockhash_next,
            NextBlockRegion::Frankfurt,
            client_next,
            timestamp,
            is_buy
        )
        .await;
    });

    let client_nozomi = client.clone();
    let blockhash_nozomi = blockhash.clone();
    let buy_ix_nozomi = buy_ix.clone();
    let payer_nozomi = Arc::clone(&payer);
    let nozomi_key = nozomi_key.to_string().clone();
    let nozomi_handle = tokio::spawn(async move {
        build_and_submit_nozomi(
            &payer_nozomi,
            &buy_ix_nozomi,
            tip_amount,
            &nozomi_key,
            blockhash_nozomi,
            NozomiRegion::AMS,
            client_nozomi,
            timestamp,
            is_buy
        )
        .await;
    });

    // let blockhash_zslot = blockhash.clone();
    // let buy_ix_zslot = buy_ix.clone();
    // let payer_zslot = Arc::clone(&payer);
    // let zslot_handle = tokio::spawn(async move {
    //     build_and_submit_zslot(
    //         &payer_zslot,
    //         &buy_ix_zslot,
    //         tip_amount,
    //         &zero_slot_key,
    //         blockhash_zslot,
    //         ZeroSlotRegion::AMS,
    //         timestamp,
    //     )
    //     .await;
    // });

    // let blockhash_blox = blockhash.clone();
    // let buy_ix_blox = buy_ix.clone();
    // let payer_blox = Arc::clone(&payer);
    // let blox_handle = tokio::spawn(async move {
    //     build_and_submit_blox(
    //         &payer_blox,
    //         &buy_ix_blox,
    //         tip_amount,
    //         &blox_auth_header,
    //         blockhash_blox,
    //         BloXRegion::Amsterdam,
    //         timestamp,
    //     )
    //     .await;
    // });

    // Await the completion of all tasks
    let (_, _, _, _) = match tokio::try_join!(
        general_handle,
        next_handle,
        // zslot_handle,
        jito_handle,
        nozomi_handle,
        // blox_handle
    ) {
        Ok((
            general_result,
            next_result,
            // zslot_result,
            jito_result,
            nozomi_result,
            // blox_result,
        )) => {
            let general_result = general_result;
            let next_result = next_result;
            // let zslot_result = zslot_result;
            let jito_result = jito_result;
            let nozomi_result = nozomi_result;
            // let blox_result = blox_result;
            (
                general_result,
                next_result,
                // zslot_result,
                jito_result,
                nozomi_result,
                // blox_result,
            )
        }
        Err(err) => {
            return Err(anyhow::anyhow!(format!("{}", err)));
        }
    };

    Ok(Vec::<String>::new())
}
