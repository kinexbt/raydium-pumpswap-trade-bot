use borsh::BorshDeserialize;
use colored::Colorize;
use raydium_trade_bot::{
    decode_pumpswap_pool_info, ensure_ata_created, get_onchain_metadata, load_env_file,
    load_pool_info, log, save_token_info, save_token_trade_info, BuyHistoryInfo,
    LiquidityStateLayoutV4, PoolKeys, TokenListInfos, NATIVE_MINT, PUMP_SWAP_ID,
};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey, signer::Signer};
use spl_associated_token_account::get_associated_token_address;

#[tokio::main]
async fn main() {
    log!(
        format!("\n\n ================== Raydium Sniper [ Pre-Run ] ================== \n"),
        "info"
    );

    let (payer, rpc, _, _, _, _, _, _) = load_env_file();
    let client = RpcClient::new_with_commitment(rpc.to_string(), CommitmentConfig::confirmed());

    log!(
        format!("My Address : {}", payer.pubkey().to_string()),
        "info"
    );

    let wrap_sol_ata_addr =
        get_associated_token_address(&payer.pubkey(), &Pubkey::from_str_const(NATIVE_MINT));

    match client.get_token_account_balance(&wrap_sol_ata_addr) {
        Ok(_) => {
            log!(format!("Wrap SOL Ata exists."), "info")
        }
        Err(_) => {
            log!(format!("No existing Wrap SOL Ata. Exiting..."), "error");
            return;
        }
    }

    let pool_infos = load_pool_info();

    log!(format!("Loaded Pool Keys : {:#?}", pool_infos), "info");

    let pool_pubkeys: Vec<Pubkey> = pool_infos
        .iter()
        .map(|pool_addr| Pubkey::from_str_const(pool_addr))
        .collect();

    for pool_key in &pool_pubkeys {
        match client.get_account(pool_key) {
            Ok(data) => {
                if data.owner.to_string() == PUMP_SWAP_ID {
                    let info = decode_pumpswap_pool_info(data.data.clone());
                    let dex = "PUMPSWAP";
                    let id_bs64 = pool_key;
                    let base_vault_b64 = info.pool_base_token_account;
                    let quote_vault_b64 = info.pool_quote_token_account;
                    let base_mint = info.base_mint;
                    let quote_mint = info.quote_mint;

                    let token_mint: String;
                    if base_mint == NATIVE_MINT {
                        token_mint = quote_mint.clone()
                    } else {
                        token_mint = base_mint.clone()
                    }

                    let token_mint_key = &Pubkey::from_str_const(token_mint.as_str());
                    let metadata = get_onchain_metadata(&client, token_mint_key).await.unwrap();

                    let symbol = metadata.unwrap().symbol;
                    let clean_symbol = symbol.trim_end_matches('\0');

                    let pool_keys = PoolKeys {
                        base_mint: Pubkey::from_str_const(base_mint.clone().as_ref()),
                        quote_mint: Pubkey::from_str_const(quote_mint.clone().as_ref()),
                    };

                    match ensure_ata_created(&client, &payer.pubkey(), &pool_keys, &payer).await {
                        Ok(ata) => {
                            let token_info = TokenListInfos {
                                id_bs64: id_bs64.to_string(),
                                base_vault_b64: base_vault_b64.clone(),
                                quote_vault_b64: quote_vault_b64.clone(),
                                base_mint: base_mint.clone(),
                                quote_mint: quote_mint.clone(),
                                clean_symbol: clean_symbol.to_string(),
                                ata: ata.to_string(),
                                dex: dex.to_string(),
                            };

                            let buy_history_info = BuyHistoryInfo {
                                pool_id: id_bs64.to_string(),
                                base_mint: base_mint.to_string(),
                                base_vault: base_vault_b64,
                                quote_mint: quote_mint.to_string(),
                                quote_vault: quote_vault_b64,
                                symbol: clean_symbol.to_string(),
                                token_ata: ata.to_string(),
                                total_ui_amount_in: 0.0,
                                total_amount_in: 0,
                                total_ui_token_amount_out: 0.0,
                                total_token_amount_out: 0,
                                take_profit: 5,
                                transactions: vec![],
                                dex: dex.to_string(),
                            };

                            log!(
                                format!("Token Info saved in file : {:#?}", token_info),
                                "result"
                            );

                            save_token_trade_info(&buy_history_info, &id_bs64.to_string());
                            save_token_info(&token_info, &id_bs64.to_string());
                        }
                        Err(_error) => {}
                    };
                } else {
                    match LiquidityStateLayoutV4::deserialize(&mut data.data.as_slice()) {
                        Ok(info) => {
                            let dex = "RAYDIUM_AMM";
                            let id_bs64 = pool_key;
                            let base_vault_b64 = info.base_vault;
                            let quote_vault_b64 = info.quote_vault;
                            let base_mint = info.base_mint;
                            let quote_mint = info.quote_mint;

                            let token_mint: String;
                            if info.base_mint.to_string() == NATIVE_MINT {
                                token_mint = info.quote_mint.to_string()
                            } else {
                                token_mint = info.base_mint.to_string()
                            }

                            let token_mint_key = &Pubkey::from_str_const(token_mint.as_str());
                            let metadata =
                                get_onchain_metadata(&client, token_mint_key).await.unwrap();

                            let symbol = metadata.unwrap().symbol;
                            let clean_symbol = symbol.trim_end_matches('\0');

                            let pool_keys = PoolKeys {
                                base_mint: base_mint,
                                quote_mint: quote_mint,
                            };

                            match ensure_ata_created(&client, &payer.pubkey(), &pool_keys, &payer)
                                .await
                            {
                                Ok(ata) => {
                                    let token_info = TokenListInfos {
                                        id_bs64: id_bs64.to_string(),
                                        base_vault_b64: base_vault_b64.to_string(),
                                        quote_vault_b64: quote_vault_b64.to_string(),
                                        base_mint: info.base_mint.to_string(),
                                        quote_mint: info.quote_mint.to_string(),
                                        clean_symbol: clean_symbol.to_string(),
                                        ata: ata.to_string(),
                                        dex: dex.to_string(),
                                    };

                                    let buy_history_info = BuyHistoryInfo {
                                        pool_id: id_bs64.to_string(),
                                        base_mint: base_mint.to_string(),
                                        base_vault: base_vault_b64.to_string(),
                                        quote_mint: quote_mint.to_string(),
                                        quote_vault: quote_vault_b64.to_string(),
                                        symbol: clean_symbol.to_string(),
                                        token_ata: ata.to_string(),
                                        total_ui_amount_in: 0.0,
                                        total_amount_in: 0,
                                        total_ui_token_amount_out: 0.0,
                                        total_token_amount_out: 0,
                                        take_profit: 5,
                                        transactions: vec![],
                                        dex: dex.to_string(),
                                    };

                                    log!(
                                        format!("Token Info saved in file : {:#?}", token_info),
                                        "result"
                                    );

                                    save_token_trade_info(&buy_history_info, &id_bs64.to_string());
                                    save_token_info(&token_info, &id_bs64.to_string());
                                }
                                Err(_error) => {}
                            };
                        }
                        Err(e) => {
                            log!(format!("Failed to deserialize pool info: {:?}", e), "error")
                        }
                    }
                }
            }
            Err(error) => log!(format!("Error fetching pool account: {:?}", error), "error"),
        };
    }
}
