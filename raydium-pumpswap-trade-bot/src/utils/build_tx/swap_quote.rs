use crate::RAYDIUM_AMM_FEE_PCT;

pub fn get_swap_base_in_quote(
    pc_vault_mint: &str,
    user_input_mint: &str,
    coin_vault_amount: u64,
    pc_vault_amount: u64,
    amount_in: u64,
) -> u64 {
    let min_amount_out;
    if pc_vault_mint == user_input_mint {
        min_amount_out = (1.0 - RAYDIUM_AMM_FEE_PCT)
            * (coin_vault_amount as f64 / (pc_vault_amount + amount_in) as f64)
            * amount_in as f64
    } else {
        min_amount_out = (1.0 - RAYDIUM_AMM_FEE_PCT)
            * (pc_vault_amount as f64 / (coin_vault_amount + amount_in) as f64)
            * amount_in as f64
    }

    min_amount_out as u64
}
