use std::{env, str::FromStr, sync::Arc};

use raydium_trade_bot::{get_ui_token_balance_change, load_env_file};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{commitment_config::CommitmentConfig, signature::Signature};
use solana_transaction_status::UiTransactionEncoding;

#[tokio::main]
async fn main() {
    /* Initial Settings */
    let (_, rpc, grpc, token, _, _, _, _) = load_env_file();
    let client = Arc::new(RpcClient::new_with_commitment(
        rpc.to_string(),
        CommitmentConfig::processed(),
    ));

    let config = solana_client::rpc_config::RpcTransactionConfig {
        encoding: Some(UiTransactionEncoding::JsonParsed),
        commitment: Some(solana_sdk::commitment_config::CommitmentConfig::confirmed()),
        max_supported_transaction_version: Some(0),
    };

    let sig_str =
        "oqxFtePj8zDwohf4aq3KsS6MRm6wf1wAKSa6khZeXSo8cj17DV5tz9pnEVRN5wTDBht8fmaZyKp9YXaouEyuvJ2";
    let sig = Signature::from_str(sig_str).expect("Invalid signature");

    match client.get_transaction_with_config(&sig, config).await {
        Ok(parsed_tx) => {
            get_ui_token_balance_change(&parsed_tx , false);
        }
        Err(e) => {
            println!("Error: {:#?}", e);
        }
    }
}

// 2iSjQNg9pkWDYmmuisvTqj9J7LjhfYkjFNUbsAj3ZbDUKMvkwSuBpPGtnrGwWqZGXfuFf3a7PAw2C7scZ5oY7qtS
// 5J3Wu8m7FMXXCgTBpyfarvLqgWpJAUupULEjKdWgsqfrRC2vJLVGphejnTa5MnkWdn5HA6U4Qt3d4t9i3wZKPZZs
