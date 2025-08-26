use std::sync::Arc;

use crate::*;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    hash::Hash, native_token::sol_to_lamports, pubkey::Pubkey, signature::Keypair, signer::Signer,
};
use yellowstone_grpc_proto::geyser::SubscribeUpdateTransaction;

pub async fn swap_handler(
    non_blocking_client: Arc<RpcClient>,
    enermy_list: Vec<String>,
    transaction_update: &SubscribeUpdateTransaction,
    signer_key: String,
    next_key: &str,
    nozomi_key: &str,
    blox_auth_header: &str,
    zero_slot_key: &str,
    sol_price: f64,
    show_buy: bool,
    show_sell: bool,
    env_max_amount: f64,
    env_amount_in_factor_low: f64,
    env_amount_in_factor_median: f64,
    env_amount_in_factor_high: f64,
    env_tip_min: f64,
    env_tip_factor_low: f64,
    env_tip_factor_median: f64,
    env_tip_factor_high: f64,
    env_tip_factor_ultra: f64,
    max_sol_amount: f64,
    is_submit_tx: bool,
    on_debug: bool,
    is_racing: bool,
    env_acceptable_liquidity: u64,
    take_profit_pcnt: f64,
) {
    if let Some(transaction) = &transaction_update.transaction {
        if let Some(transaction_message) = &transaction.transaction {
            if let Some(message) = &transaction_message.message {
                let mut is_enermy: bool = false;
                let mut enermy_key: String = "".to_string();

                if let Some(first_key) = message.account_keys.first() {
                    if let Ok(pubkey) = Pubkey::try_from(first_key.as_slice()) {
                        // Check if pubkey is in enermy_list
                        if enermy_list.contains(&pubkey.to_string()) {
                            is_enermy = true;
                            enermy_key = pubkey.to_string();
                        } else {
                            is_enermy = false;
                            enermy_key = "".to_string();
                        }
                    }
                }

                for (_, instruction) in message.instructions.iter().enumerate() {
                    match message
                        .account_keys
                        .get(instruction.program_id_index as usize)
                    {
                        Some(program_key) => {
                            if let Ok(pubkey) = Pubkey::try_from(program_key.as_slice()) {
                                if pubkey.to_string() == RAY_AMM_ID {
                                    if !(instruction.data[0] == 9 || instruction.data[0] == 11) {
                                        return;
                                    }

                                    if is_enermy {
                                        log!("Enermy Raydium Trading Detected ... ", "enermy");
                                        log!(format!("Enermy Address : {}", enermy_key), "enermy");
                                    } else {
                                        log!("Raydium Trading Detected ... ", "info");
                                    }

                                    if let Some(meta) = &transaction.meta {
                                        log!(
                                            format!(
                                                "Signature: {}",
                                                scan!(
                                                    bs58::encode(&transaction.signature)
                                                        .into_string(),
                                                    "solscan"
                                                )
                                            ),
                                            "info"
                                        );

                                        let (
                                            ray_auth_pre_token_balance,
                                            ray_auth_post_token_balance,
                                        ) = get_pre_post_token_balance(&meta, RAY_AMM_AUTH);

                                        if on_debug {
                                            log!(format!("Program: {}", pubkey), "info");
                                            display_balance_change(
                                                &meta,
                                                &ray_auth_pre_token_balance,
                                                &ray_auth_post_token_balance,
                                                RAY_AMM_AUTH,
                                            );
                                        }

                                        for i in 0..meta
                                            .pre_token_balances
                                            .len()
                                            .min(ray_auth_post_token_balance.len())
                                        {
                                            let pre_token_amount = ray_auth_pre_token_balance[i]
                                                .ui_token_amount
                                                .as_ref()
                                                .map(|amt| amt.ui_amount)
                                                .unwrap_or(0.0);
                                            let pre_token_owner =
                                                &ray_auth_pre_token_balance[i].owner;
                                            let post_token_amount = ray_auth_post_token_balance[i]
                                                .ui_token_amount
                                                .as_ref()
                                                .map(|amt| amt.ui_amount)
                                                .unwrap_or(0.0);
                                            let token_mint = &ray_auth_post_token_balance[i].mint;

                                            if pre_token_amount != post_token_amount
                                                && pre_token_owner == RAY_AMM_AUTH
                                                && token_mint == NATIVE_MINT
                                            {
                                                //  Proceed Buy Transaction upon massive sell on Raydium
                                                let second_account_idx = instruction.accounts[1];
                                                if let Some(key) = message
                                                    .account_keys
                                                    .get(second_account_idx as usize)
                                                {
                                                    if let Ok(pool_id) =
                                                        Pubkey::try_from(key.as_slice())
                                                    {
                                                        let (coin_vault, pc_vault) =
                                                            get_swap_keys(&pool_id);

                                                        let (
                                                            price_impact_pct,
                                                            current_liquidity,
                                                            sol_amount,
                                                            mint_addr,
                                                            _,
                                                            pool_ui_amount_in,
                                                            pool_ui_token_amount_out,
                                                        ) = get_price_impact(
                                                            &ray_auth_pre_token_balance,
                                                            &ray_auth_post_token_balance,
                                                            RAY_AMM_AUTH,
                                                            sol_price,
                                                        );
                                                        if (post_token_amount as f64)
                                                            - (pre_token_amount as f64)
                                                            > 0.0
                                                        {
                                                            if show_buy {
                                                                log!("\t==> BUY Trade ==", "info");

                                                                let (pnl, sell_token_amount_dec , token_inventory) =
                                                                    calc_pnl(
                                                                        &pool_id.to_string(),
                                                                        pool_ui_amount_in,
                                                                        pool_ui_token_amount_out,
                                                                    );

                                                                if take_profit_pcnt > pnl || token_inventory <= 0 {
                                                                    return;
                                                                }

                                                                if is_submit_tx {
                                                                    let buy_param = RayAMMSwapBaseInParams {
                                                                            amount_in: sell_token_amount_dec,
                                                                            minimum_amount_out: 1_u64,
                                                                            pool_id: pool_id,
                                                                            coin_vault: coin_vault,
                                                                            pc_vault: pc_vault,
                                                                            input_mint: Pubkey::from_str_const(
                                                                                mint_addr.as_str(),
                                                                            ),
                                                                            output_mint: Pubkey::from_str_const(
                                                                                NATIVE_MINT,
                                                                            ),
                                                                            payer: Keypair::from_base58_string(
                                                                                signer_key.as_str(),
                                                                            )
                                                                            .pubkey(),
                                                                        };

                                                                    let buy_ix =
                                                                        build_amm_swap_base_in(
                                                                            buy_param,
                                                                        );

                                                                    let payer_key =
                                                                        Keypair::from_base58_string(
                                                                            signer_key.as_str(),
                                                                        );

                                                                    // Decode from base58
                                                                    let decoded: Vec<u8> =
                                                                        bs58::encode(
                                                                            &transaction.signature,
                                                                        )
                                                                        .into_vec();

                                                                    // Take the first 8 bytes and convert to u64
                                                                    let num = u64::from_le_bytes(
                                                                            decoded[..8].try_into().expect(
                                                                                "Slice with incorrect length",
                                                                            ),
                                                                        );

                                                                    if is_racing {
                                                                        let _ = multi_submit(
                                                                                non_blocking_client.clone(),
                                                                                Arc::new(payer_key),
                                                                                buy_ix,
                                                                                0.0005,
                                                                                Hash::new(
                                                                                    &message.recent_blockhash,
                                                                                ),
                                                                                num,
                                                                                next_key,
                                                                                nozomi_key,
                                                                                blox_auth_header,
                                                                                zero_slot_key,
                                                                                false
                                                                            )
                                                                            .await;
                                                                    } else {
                                                                        build_and_submit_pure_nozomi(
                                                                                &Arc::new(payer_key),
                                                                                &buy_ix,
                                                                                0.0005,
                                                                                &nozomi_key,
                                                                                Hash::new(
                                                                                    &message.recent_blockhash,
                                                                                ),
                                                                                non_blocking_client.clone(),
                                                                                false
                                                                            )
                                                                            .await
                                                                    }
                                                                }
                                                            } else {
                                                                return;
                                                            }
                                                        } else {
                                                            if show_sell {
                                                                log!("\t==> SELL Trade ==", "info");

                                                                let (amount_factor, tip_factor, _) =
                                                                    dump_setup(
                                                                        price_impact_pct,
                                                                        current_liquidity,
                                                                        sol_price,
                                                                        env_max_amount,
                                                                        env_amount_in_factor_low,
                                                                        env_amount_in_factor_median,
                                                                        env_amount_in_factor_high,
                                                                        env_tip_min,
                                                                        env_tip_factor_low,
                                                                        env_tip_factor_median,
                                                                        env_tip_factor_high,
                                                                        env_tip_factor_ultra,
                                                                        on_debug,
                                                                    );
                                                                if amount_factor > 0.0 {
                                                                    let buy_amount =
                                                                        if (amount_factor
                                                                            * sol_amount)
                                                                            / 100.0
                                                                            > max_sol_amount
                                                                        {
                                                                            max_sol_amount
                                                                        } else {
                                                                            (amount_factor
                                                                                * sol_amount)
                                                                                / 100.0
                                                                        };

                                                                    let tip_amount = (buy_amount
                                                                        * tip_factor)
                                                                        / 100.0;

                                                                    log!(
                                                                            format!(
                                                                                "RAY_AMM Buy Sol Amount {} , Tip Sol Amount {}",
                                                                                buy_amount, tip_amount
                                                                            ),
                                                                            "result"
                                                                        );

                                                                    if is_submit_tx {
                                                                        let buy_param = RayAMMSwapBaseInParams {
                                                                                amount_in: sol_to_lamports(buy_amount),
                                                                                minimum_amount_out: 1_u64,
                                                                                pool_id: pool_id,
                                                                                coin_vault: coin_vault,
                                                                                pc_vault: pc_vault,
                                                                                input_mint: Pubkey::from_str_const(
                                                                                    NATIVE_MINT,
                                                                                ),
                                                                                output_mint: Pubkey::from_str_const(
                                                                                    mint_addr.as_str(),
                                                                                ),
                                                                                payer: Keypair::from_base58_string(
                                                                                    signer_key.as_str(),
                                                                                )
                                                                                .pubkey(),
                                                                            };

                                                                        let buy_ix =
                                                                            build_amm_swap_base_in(
                                                                                buy_param,
                                                                            );

                                                                        let payer_key = Keypair::from_base58_string(
                                                                                signer_key.as_str(),
                                                                            );

                                                                        // Decode from base58
                                                                        let decoded: Vec<u8> =
                                                                            bs58::encode(
                                                                                &transaction
                                                                                    .signature,
                                                                            )
                                                                            .into_vec();

                                                                        // Take the first 8 bytes and convert to u64
                                                                        let num = u64::from_le_bytes(
                                                                                decoded[..8].try_into().expect(
                                                                                    "Slice with incorrect length",
                                                                                ),
                                                                            );

                                                                        if is_racing {
                                                                            let _ = multi_submit(
                                                                                    non_blocking_client.clone(),
                                                                                    Arc::new(payer_key),
                                                                                    buy_ix,
                                                                                    tip_amount,
                                                                                    Hash::new(
                                                                                        &message.recent_blockhash,
                                                                                    ),
                                                                                    num,
                                                                                    next_key,
                                                                                    nozomi_key,
                                                                                    blox_auth_header,
                                                                                    zero_slot_key,
                                                                                    true
                                                                                )
                                                                                .await;
                                                                        } else {
                                                                            build_and_submit_pure_nozomi(
                                                                                    &Arc::new(payer_key),
                                                                                    &buy_ix,
                                                                                    tip_amount,
                                                                                    &nozomi_key,
                                                                                    Hash::new(
                                                                                        &message.recent_blockhash,
                                                                                    ),
                                                                                    non_blocking_client.clone(),
                                                                                    true
                                                                                )
                                                                                .await
                                                                        }
                                                                    }
                                                                };
                                                            } else {
                                                                log!(
                                                                    format!(
                                                                        "  Second Account: {}",
                                                                        hex::encode(key)
                                                                    ),
                                                                    "info"
                                                                )
                                                            }
                                                        }
                                                    } else {
                                                        return;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else if pubkey.to_string() == PUMP_SWAP_ID {
                                    if !(instruction.data[0] == 102 || instruction.data[0] == 51) {
                                        return;
                                    }

                                    if is_enermy {
                                        log!("Enermy Pumpswap Trading Detected ... ", "enermy");
                                        log!(format!("Enermy Address : {}", enermy_key), "enermy");
                                    } else {
                                        log!("Pumpswap Trading Detected ... ", "info");
                                    }

                                    let extracted_keys = get_pumpswap_keys(transaction);

                                    if let Some(meta) = &transaction.meta {
                                        log!(
                                            format!(
                                                "Signature: {}",
                                                scan!(
                                                    bs58::encode(&transaction.signature)
                                                        .into_string(),
                                                    "solscan"
                                                )
                                            ),
                                            "info"
                                        );

                                        let (
                                            pumpswap_pool_pre_token_balance,
                                            pumpswap_pool_post_token_balance,
                                        ) = get_pre_post_token_balance(
                                            &meta,
                                            &extracted_keys[0].to_string(),
                                        );

                                        if on_debug {
                                            log!(format!("Program: {}", pubkey), "info");
                                            display_balance_change(
                                                &meta,
                                                &pumpswap_pool_pre_token_balance,
                                                &pumpswap_pool_post_token_balance,
                                                &extracted_keys[0].to_string(),
                                            );
                                        }
                                        for i in 0..meta
                                            .pre_token_balances
                                            .len()
                                            .min(pumpswap_pool_post_token_balance.len())
                                        {
                                            let pre_token_amount = pumpswap_pool_pre_token_balance
                                                [i]
                                                .ui_token_amount
                                                .as_ref()
                                                .map(|amt| amt.ui_amount)
                                                .unwrap_or(0.0);
                                            let pre_token_owner =
                                                &pumpswap_pool_pre_token_balance[i].owner;
                                            let post_token_amount =
                                                pumpswap_pool_post_token_balance[i]
                                                    .ui_token_amount
                                                    .as_ref()
                                                    .map(|amt| amt.ui_amount)
                                                    .unwrap_or(0.0);
                                            let token_mint =
                                                &pumpswap_pool_post_token_balance[i].mint;

                                            if pre_token_amount != post_token_amount
                                                && pre_token_owner == &extracted_keys[0].to_string()
                                                && token_mint == NATIVE_MINT
                                            {
                                                //  Proceed Buy Transaction upon massive sell on Pumpswap
                                                let second_account_idx = instruction.accounts[0];
                                                if let Some(key) = message
                                                    .account_keys
                                                    .get(second_account_idx as usize)
                                                {
                                                    if let Ok(pool_id) =
                                                        Pubkey::try_from(key.as_slice())
                                                    {
                                                        let (
                                                            price_impact_pct,
                                                            current_liquidity,
                                                            sol_amount,
                                                            mint_addr,
                                                            post_token_price_in_sol,
                                                            pool_ui_amount_in,
                                                            pool_ui_token_amount_out,
                                                        ) = get_price_impact(
                                                            &pumpswap_pool_pre_token_balance,
                                                            &pumpswap_pool_post_token_balance,
                                                            &extracted_keys[0].to_string(),
                                                            sol_price,
                                                        );
                                                        if (post_token_amount as f64)
                                                            - (pre_token_amount as f64)
                                                            > 0.0
                                                        {
                                                            if show_buy {
                                                                log!("\t==> BUY Trade ==", "info");

                                                                let (pnl, sell_token_amount_dec , token_inventory) =
                                                                    calc_pnl(
                                                                        &pool_id.to_string(),
                                                                        pool_ui_amount_in,
                                                                        pool_ui_token_amount_out,
                                                                    );

                                                                if take_profit_pcnt > pnl || token_inventory <= 0{
                                                                    return;
                                                                }

                                                                log!(
                                                                    format!(
                                                                        "Sell Token Amount {}",
                                                                        sell_token_amount_dec
                                                                    ),
                                                                    "result"
                                                                );

                                                                if is_submit_tx {
                                                                    let sell_param = PumpSwapSellParams {
                                                                            base_amount_in: sell_token_amount_dec,
                                                                            min_quote_amount_out: 1,
                                                                            pool_id: pool_id,
                                                                            base_mint: Pubkey::from_str_const(
                                                                                mint_addr.as_str(),
                                                                            ),
                                                                            quote_mint: Pubkey::from_str_const(
                                                                                NATIVE_MINT,
                                                                            ),
                                                                            base_token_program: spl_token::ID,
                                                                            quote_token_program: spl_token::ID,
                                                                            payer: Keypair::from_base58_string(
                                                                                signer_key.as_str(),
                                                                            )
                                                                            .pubkey(),
                                                                        };

                                                                    let sell_ix =
                                                                        build_pumpswap_sell(
                                                                            sell_param,
                                                                        );

                                                                    let payer_key =
                                                                        Keypair::from_base58_string(
                                                                            signer_key.as_str(),
                                                                        );

                                                                    // Decode from base58
                                                                    let decoded: Vec<u8> =
                                                                        bs58::encode(
                                                                            &transaction.signature,
                                                                        )
                                                                        .into_vec();

                                                                    // Take the first 8 bytes and convert to u64
                                                                    let num = u64::from_le_bytes(
                                                                            decoded[..8].try_into().expect(
                                                                                "Slice with incorrect length",
                                                                            ),
                                                                        );

                                                                    if is_racing {
                                                                        let _ = multi_submit(
                                                                                non_blocking_client.clone(),
                                                                                Arc::new(payer_key),
                                                                                sell_ix,
                                                                                0.0025,
                                                                                Hash::new(
                                                                                    &message.recent_blockhash,
                                                                                ),
                                                                                num,
                                                                                next_key,
                                                                                nozomi_key,
                                                                                blox_auth_header,
                                                                                zero_slot_key,
                                                                                false
                                                                            )
                                                                            .await;
                                                                    } else {
                                                                        build_and_submit_pure_nozomi(
                                                                                &Arc::new(payer_key),
                                                                                &sell_ix,
                                                                                0.0025,
                                                                                &nozomi_key,
                                                                                Hash::new(
                                                                                    &message.recent_blockhash,
                                                                                ),
                                                                                non_blocking_client.clone(),
                                                                                false
                                                                            )
                                                                            .await
                                                                    }
                                                                }
                                                            } else {
                                                                return;
                                                            }
                                                        } else {
                                                            if show_sell {
                                                                log!("\t==> SELL Trade ==", "info");

                                                                let (amount_factor, tip_factor, _) =
                                                                    dump_setup(
                                                                        price_impact_pct,
                                                                        current_liquidity,
                                                                        sol_price,
                                                                        env_max_amount,
                                                                        env_amount_in_factor_low,
                                                                        env_amount_in_factor_median,
                                                                        env_amount_in_factor_high,
                                                                        env_tip_min,
                                                                        env_tip_factor_low,
                                                                        env_tip_factor_median,
                                                                        env_tip_factor_high,
                                                                        env_tip_factor_ultra,
                                                                        on_debug,
                                                                    );

                                                                if amount_factor > 0.0 {
                                                                    let buy_amount =
                                                                        if (amount_factor
                                                                            * sol_amount)
                                                                            / 100.0
                                                                            > max_sol_amount
                                                                        {
                                                                            max_sol_amount
                                                                        } else {
                                                                            (amount_factor
                                                                                * sol_amount)
                                                                                / 100.0
                                                                        };

                                                                    let tip_amount = (buy_amount
                                                                        * tip_factor)
                                                                        / 100.0;

                                                                    let expected_token_amount =
                                                                        buy_amount / (post_token_price_in_sol);

                                                                    log!(
                                                                        format!(
                                                                            "Buy Sol Amount {} , Tip Sol Amount {}",
                                                                            buy_amount, tip_amount
                                                                        ),
                                                                        "result"
                                                                    );

                                                                    if is_submit_tx {
                                                                        let buy_param = PumpSwapBuyParams {
                                                                            max_quote_amount_in: sol_to_lamports(
                                                                                buy_amount * 1.01,
                                                                            ),
                                                                            base_amount_out: (expected_token_amount
                                                                                * 1_000_000.0
                                                                                / 1.01)
                                                                                as u64,
                                                                            pool_id: pool_id,
                                                                            base_mint: Pubkey::from_str_const(
                                                                                mint_addr.as_str(),
                                                                            ),
                                                                            quote_mint: Pubkey::from_str_const(
                                                                                NATIVE_MINT,
                                                                            ),
                                                                            base_token_program: spl_token::ID,
                                                                            quote_token_program: spl_token::ID,
                                                                            payer: Keypair::from_base58_string(
                                                                                signer_key.as_str(),
                                                                            )
                                                                            .pubkey(),
                                                                        };

                                                                        let buy_ix =
                                                                            build_pumpswap_buy(
                                                                                buy_param,
                                                                            );

                                                                        let payer_key = Keypair::from_base58_string(
                                                                            signer_key.as_str(),
                                                                        );

                                                                        // Decode from base58
                                                                        let decoded: Vec<u8> =
                                                                            bs58::encode(
                                                                                &transaction
                                                                                    .signature,
                                                                            )
                                                                            .into_vec();

                                                                        // Take the first 8 bytes and convert to u64
                                                                        let num = u64::from_le_bytes(
                                                                            decoded[..8].try_into().expect(
                                                                                "Slice with incorrect length",
                                                                            ),
                                                                        );

                                                                        if is_racing {
                                                                            let _ = multi_submit(
                                                                                non_blocking_client.clone(),
                                                                                Arc::new(payer_key),
                                                                                buy_ix,
                                                                                tip_amount,
                                                                                Hash::new(
                                                                                    &message.recent_blockhash,
                                                                                ),
                                                                                num,
                                                                                next_key,
                                                                                nozomi_key,
                                                                                blox_auth_header,
                                                                                zero_slot_key,
                                                                                true
                                                                            )
                                                                            .await;
                                                                        } else {
                                                                            build_and_submit_pure_nozomi(
                                                                                &Arc::new(payer_key),
                                                                                &buy_ix,
                                                                                tip_amount,
                                                                                &nozomi_key,
                                                                                Hash::new(
                                                                                    &message.recent_blockhash,
                                                                                ),
                                                                                non_blocking_client.clone(),
                                                                                true
                                                                            )
                                                                            .await
                                                                        }
                                                                    }
                                                                };
                                                            }
                                                        }
                                                    } else {
                                                        return;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                log!(format!("  Program: {}", hex::encode(program_key)), "info");
                            }
                        }
                        _ => (),
                    }
                }
            }
        }
    }
}
