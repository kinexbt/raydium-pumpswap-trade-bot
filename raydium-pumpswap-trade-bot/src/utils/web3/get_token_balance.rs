use solana_transaction_status::{
    option_serializer::OptionSerializer, UiTransactionStatusMeta, UiTransactionTokenBalance,
};
use yellowstone_grpc_proto::prelude::{TokenBalance, TransactionStatusMeta};

use crate::{init_token_trade_total_info, log, update_token_buy_info, update_token_trade_total_info};

pub fn get_pre_post_token_balance(
    meta: &TransactionStatusMeta,
    pool_addr: &str,
) -> (Vec<TokenBalance>, Vec<TokenBalance>) {
    let ray_auth_pre_token_balance: Vec<TokenBalance> = meta
        .pre_token_balances
        .iter()
        .filter(|token_balance| token_balance.owner == pool_addr)
        .cloned()
        .collect();
    let ray_auth_post_token_balance: Vec<TokenBalance> = meta
        .post_token_balances
        .iter()
        .filter(|token_balance| token_balance.owner == pool_addr)
        .cloned()
        .collect();

    (ray_auth_pre_token_balance, ray_auth_post_token_balance)
}

pub fn get_pre_post_ui_token_balance(
    meta: &UiTransactionStatusMeta,
    pool_addr: &str,
) -> (
    Vec<UiTransactionTokenBalance>,
    Vec<UiTransactionTokenBalance>,
) {
    let pool_addr_string = pool_addr.to_string(); // Convert &str to String

    let ray_auth_pre_token_balance: Vec<UiTransactionTokenBalance> = match &meta.pre_token_balances
    {
        OptionSerializer::Some(pre_balances) => pre_balances
            .iter()
            .filter(|token_balance| {
                // Match on OptionSerializer::Some for owner field
                match &token_balance.owner {
                    OptionSerializer::Some(owner) => owner == &pool_addr_string,
                    _ => false, // Handle None or Skip cases
                }
            })
            .cloned()
            .collect(),
        OptionSerializer::None => Vec::new(),
        OptionSerializer::Skip => Vec::new(),
    };

    let ray_auth_post_token_balance: Vec<UiTransactionTokenBalance> =
        match &meta.post_token_balances {
            OptionSerializer::Some(post_balances) => post_balances
                .iter()
                .filter(|token_balance| match &token_balance.owner {
                    OptionSerializer::Some(owner) => owner == &pool_addr_string,
                    _ => false,
                })
                .cloned()
                .collect(),
            OptionSerializer::None => Vec::new(),
            OptionSerializer::Skip => Vec::new(),
        };

    (ray_auth_pre_token_balance, ray_auth_post_token_balance)
}

pub fn display_balance_change(
    meta: &TransactionStatusMeta,
    ray_auth_pre_token_balance: &[TokenBalance],
    ray_auth_post_token_balance: &[TokenBalance],
    owner: &str,
) {
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
        let pre_token_owner = &ray_auth_pre_token_balance[i].owner;
        let post_token_amount = ray_auth_post_token_balance[i]
            .ui_token_amount
            .as_ref()
            .map(|amt| amt.ui_amount)
            .unwrap_or(0.0);
        let token_mint = &ray_auth_post_token_balance[i].mint;

        if pre_token_amount != post_token_amount && pre_token_owner == owner {
            log!(
                format!(
                    "\tToken [ {} ]\t{} -> \t{}\t(Δ{})",
                    token_mint,
                    post_token_amount,
                    pre_token_amount,
                    (pre_token_amount as f64) - (post_token_amount as f64)
                ),
                "info"
            );
        }
    }
}
pub fn display_and_save_ui_balance_change(
    signature: &str,
    pool: &str,
    ray_auth_pre_token_balance: &[UiTransactionTokenBalance],
    ray_auth_post_token_balance: &[UiTransactionTokenBalance],
    owner: &str,
    is_buy : bool
) {
    let min_len = ray_auth_pre_token_balance
        .len()
        .min(ray_auth_post_token_balance.len());

    // Initialize totals
    let mut total_amount_in: u64 = 0;
    let mut total_ui_amount_in: f64 = 0.0;
    let mut total_token_amount_out: u64 = 0;
    let mut total_ui_token_amount_out: f64 = 0.0;

    for i in 0..min_len {
        let pre_token_amount_str = &ray_auth_pre_token_balance[i]
            .ui_token_amount
            .ui_amount_string;
        let post_token_amount_str = &ray_auth_post_token_balance[i]
            .ui_token_amount
            .ui_amount_string;

        let pre_token_amount_decimal = &ray_auth_pre_token_balance[i].ui_token_amount.amount;
        let post_token_amount_decimal = &ray_auth_post_token_balance[i].ui_token_amount.amount;

        let pre_token_amount = pre_token_amount_str.parse::<f64>().unwrap_or(0.0);
        let post_token_amount = post_token_amount_str.parse::<f64>().unwrap_or(0.0);

        let pre_token_amount_dec: u64 = pre_token_amount_decimal.parse::<u64>().unwrap_or(0);
        let post_token_amount_dec: u64 = post_token_amount_decimal.parse::<u64>().unwrap_or(0);

        let pre_token_owner = &ray_auth_pre_token_balance[i].owner;
        let token_mint = &ray_auth_post_token_balance[i].mint;

        let pre_token_owner_matches = match pre_token_owner {
            OptionSerializer::Some(owner_str) => owner_str == owner,
            OptionSerializer::None | OptionSerializer::Skip => false,
        };

        if pre_token_amount != post_token_amount && pre_token_owner_matches {
            let raw_diff =
                (pre_token_amount_dec as i64 - post_token_amount_dec as i64).abs() as u64;
            let ui_diff = (post_token_amount - pre_token_amount).abs();
            let is_in = post_token_amount_dec as i64 - pre_token_amount_dec as i64 > 0;

            log!(
                format!(
                    "\tToken [ {} ]\t{} -> \t{}\t(Δ{})",
                    token_mint,
                    post_token_amount,
                    pre_token_amount,
                    pre_token_amount - post_token_amount
                ),
                "update"
            );

            if is_buy {
                update_token_buy_info(signature, pool, raw_diff, ui_diff, is_in);
            }

            // Update totals
            if is_in {
                total_amount_in += raw_diff;
                total_ui_amount_in += ui_diff;
            } else {
                total_token_amount_out += raw_diff;
                total_ui_token_amount_out += ui_diff;
            }
        } else if !pre_token_owner_matches {
            log!(
                format!(
                    "Owner mismatch for token mint: {}. Expected owner: {}",
                    token_mint, owner
                ),
                "warn"
            );
        }
    }

    if is_buy {
        update_token_trade_total_info(
            pool,
            total_amount_in,
            total_ui_amount_in,
            total_token_amount_out,
            total_ui_token_amount_out,
        );
    } else {
        init_token_trade_total_info(pool);
    }
    // Optional: log or use totals here
    log!(
        format!(
            "Totals - In: {} ({} UI), Out: {} ({} UI)",
            total_amount_in, total_ui_amount_in, total_token_amount_out, total_ui_token_amount_out
        ),
        "info"
    );
}
