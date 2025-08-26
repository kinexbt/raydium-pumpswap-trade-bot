use yellowstone_grpc_proto::prelude::TokenBalance;

use crate::{log, NATIVE_MINT};
pub fn get_price_impact(
    pre_token_balance: &Vec<TokenBalance>,
    post_token_balance: &Vec<TokenBalance>,
    owner: &str,
    sol_price: f64,
) -> (f64, f64, f64, String, f64 , f64 , f64) {
    let pre_native_ui_amount = pre_token_balance
        .iter()
        .find(|token_info| token_info.mint == NATIVE_MINT && token_info.owner == owner)
        .and_then(|token_info| token_info.ui_token_amount.as_ref().map(|ui| ui.ui_amount))
        .unwrap_or(0.0);

    let post_native_ui_amount = post_token_balance
        .iter()
        .find(|token_info| token_info.mint == NATIVE_MINT && token_info.owner == owner)
        .and_then(|token_info| token_info.ui_token_amount.as_ref().map(|ui| ui.ui_amount))
        .unwrap_or(0.0);

    let pre_token_ui_amount = pre_token_balance
        .iter()
        .find(|token_info| token_info.mint != NATIVE_MINT && token_info.owner == owner)
        .and_then(|token_info| token_info.ui_token_amount.as_ref().map(|ui| ui.ui_amount))
        .unwrap_or(0.0);

    let post_token_ui_amount = post_token_balance
        .iter()
        .find(|token_info| token_info.mint != NATIVE_MINT && token_info.owner == owner)
        .and_then(|token_info| token_info.ui_token_amount.as_ref().map(|ui| ui.ui_amount))
        .unwrap_or(0.0);

    let token_mint = post_token_balance
        .iter()
        .find(|token_info| token_info.mint != NATIVE_MINT && token_info.owner == owner)
        .map(|token_info| token_info.mint.clone())
        .unwrap_or("None".to_string()); // Ensure a valid fallback

    let pre_token_usd_price = pre_native_ui_amount * sol_price / pre_token_ui_amount;
    let post_token_usd_price = post_native_ui_amount * sol_price / post_token_ui_amount;
    let usd_price_change = post_token_usd_price - pre_token_usd_price;
    let price_change = (post_native_ui_amount / post_token_ui_amount
        - pre_native_ui_amount / pre_token_ui_amount)
        * 100.0
        / (pre_native_ui_amount / pre_token_ui_amount);

    log!(
        format!(
            "\t\tToken Mint Addr \t{}\n\t\tPre Token USD Price \t$ {}\n\t\tPost Token USD Price \t$ {}\n\t\tPrice Change By Swap \t$ {}\n\t\tPrice Change Percent \t{} %\n\t\tCurrent Liquidity \t$ {}",
            token_mint, pre_token_usd_price,post_token_usd_price,usd_price_change,price_change,2.0 * post_native_ui_amount * sol_price
        ),
        "info"
    );

    return (
        price_change,
        2.0 * post_native_ui_amount * sol_price,
        pre_native_ui_amount - post_native_ui_amount,
        token_mint,
        post_native_ui_amount / post_token_ui_amount,
        post_native_ui_amount,
        post_token_ui_amount
    );
}
