use std::time::Duration;

use solana_client::rpc_client::RpcClient;
use solana_sdk::{pubkey::Pubkey, signature::Keypair, signer::Signer, transaction::Transaction};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use tokio::time::sleep;

use crate::{log, PoolKeys, NATIVE_MINT};

pub async fn ensure_ata_created(
    connection: &RpcClient,
    user_pubkey: &Pubkey,
    pool_keys: &PoolKeys, // PoolKeys should be a struct containing baseMint and quoteMint Pubkeys
    _u_kp: &Keypair,
) -> Result<Pubkey, Box<dyn std::error::Error>> {
    let mut token_ata: Option<Pubkey> = None;

    // Loop until the ATA is found or created
    while token_ata.is_none() {
        if pool_keys.base_mint.to_string() == NATIVE_MINT {
            if let temp_token_ata = get_associated_token_address(user_pubkey, &pool_keys.quote_mint)
            {
                match connection.get_token_account_balance(&temp_token_ata) {
                    Ok(_data) => {
                        // Token balance successfully retrieved
                        token_ata = Some(temp_token_ata);
                        log!(format!("Token balance: {:?}", pool_keys.quote_mint), "info");
                    }
                    Err(_error) => {
                        // Use token_ata directly since it is already a Pubkey
                        let create_ata_ix = create_associated_token_account(
                            &_u_kp.pubkey(),
                            &_u_kp.pubkey(),
                            &pool_keys.quote_mint, // Corrected: token_ata is already a Pubkey
                            &spl_token::ID,
                        );

                        let recent_blockhash = connection.get_latest_blockhash().unwrap();
                        let transaction = Transaction::new_signed_with_payer(
                            &[create_ata_ix],
                            Some(&_u_kp.pubkey()),
                            &[&_u_kp],
                            recent_blockhash,
                        );

                        match connection.send_and_confirm_transaction(&transaction) {
                            Ok(_sig) => {
                                log!(format!("ATA Created: {:#?}", token_ata), "info");
                            }
                            Err(e) => {
                                log!(format!("Error creating ATA: {:?}", e), "error");
                                sleep(Duration::from_secs(1)).await;
                            }
                        }
                    }
                }
            } else {
                log!("Failed to get associated token address.", "error");
            }
        } else {
            if let temp_token_ata = get_associated_token_address(user_pubkey, &pool_keys.base_mint)
            {
                match connection.get_token_account_balance(&temp_token_ata) {
                    Ok(_data) => {
                        // Token balance successfully retrieved
                        token_ata = Some(temp_token_ata);
                        log!(
                            format!("Token Created of : {:?}", pool_keys.base_mint),
                            "info"
                        );
                    }
                    Err(_error) => {
                        // Use token_ata directly since it is already a Pubkey
                        let create_ata_ix = create_associated_token_account(
                            &_u_kp.pubkey(),
                            &_u_kp.pubkey(),
                            &pool_keys.base_mint, // Corrected: token_ata is already a Pubkey
                            &spl_token::ID,
                        );

                        let recent_blockhash = connection.get_latest_blockhash().unwrap();
                        let transaction = Transaction::new_signed_with_payer(
                            &[create_ata_ix],
                            Some(&_u_kp.pubkey()),
                            &[&_u_kp],
                            recent_blockhash,
                        );

                        match connection.send_and_confirm_transaction(&transaction) {
                            Ok(_sig) => {
                                log!(format!("ATA Created: {:#?}", token_ata), "info");
                            }
                            Err(e) => {
                                log!(format!("Error creating ATA: {:?}", e), "error");
                                sleep(Duration::from_secs(1)).await;
                            }
                        }
                    }
                }
            } else {
                log!("Failed to get associated token address.", "error");
            }
        }
    }

    // Return the token ATA address
    token_ata.ok_or_else(|| "Failed to create or find ATA".into())
}
