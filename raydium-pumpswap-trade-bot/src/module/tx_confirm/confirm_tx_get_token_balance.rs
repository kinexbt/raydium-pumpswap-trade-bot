use std::{sync::Arc, time::Duration};

use solana_client::{nonblocking::rpc_client::RpcClient, rpc_config::RpcTransactionConfig};
use solana_sdk::{commitment_config::CommitmentConfig, signature::Signature};
use solana_transaction_status::UiTransactionEncoding;
use tokio::time::sleep;

use crate::log;

use super::get_ui_token_balance_change;

pub async fn get_token_balance_change_from_tx(
    client: Arc<RpcClient>,
    sig: Signature,
    is_buy: bool,
) {
    let config = RpcTransactionConfig {
        encoding: Some(UiTransactionEncoding::JsonParsed),
        commitment: Some(CommitmentConfig::confirmed()),
        max_supported_transaction_version: Some(0),
    };

    loop {
        // Check if the transaction is confirmed
        match client.get_signature_status(&sig).await {
            Ok(Some(status)) => {
                match client.get_transaction_with_config(&sig, config).await {
                    Ok(parsed_tx) => {
                        get_ui_token_balance_change(&parsed_tx, is_buy);
                        break; // Exit loop after successful fetch
                    }
                    Err(e) => {
                        sleep(Duration::from_millis(2000)).await;
                    }
                }
            }
            Ok(None) => {
                // This case happens if the signature is not found, likely not confirmed yet
                sleep(Duration::from_millis(2000)).await;
            }
            Err(e) => {
                log!("Error getting signature status", "error");
                break;
            }
        }
    }
}
