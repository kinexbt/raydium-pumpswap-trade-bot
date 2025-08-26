use bigdecimal::BigDecimal;

pub fn calc_min_amount_out(
    amount: BigDecimal,
    current_price: BigDecimal,
    slippage: BigDecimal,
    currency_out_decimals: u32,
) -> BigDecimal {
    let slippage_factor = BigDecimal::from(1) - (slippage / BigDecimal::from(100));
    let amount_out_without_slip = &amount / &current_price;
    let min_amount_out = &amount_out_without_slip * &slippage_factor;

    // Convert to integer unit of output token
    let min_pow = min_amount_out * BigDecimal::from(10_u64.pow(currency_out_decimals));
    min_pow.with_prec(0) // Rounds to integer
}
