use crate::log;

pub fn dump_setup(
    variation: f64,
    liquidity: f64,
    sol_price: f64,
    env_max_amount: f64,
    env_amount_in_factor_low: f64,
    env_amount_in_factor_median: f64,
    env_amount_in_factor_high: f64,
    env_tip_min: f64,
    env_tip_factor_low: f64,
    env_tip_factor_median: f64,
    env_tip_factor_high: f64,
    env_tip_factor_ultra: f64,
    on_debug: bool,
) -> (f64, f64, f64) {
    let mut amount_in = (liquidity * env_amount_in_factor_low) / sol_price;
    let mut tip = amount_in * env_tip_factor_median;
    let mut slippage = 2.0;

    if variation <= -30.0 && liquidity >= 80_000.0 {
        amount_in = (liquidity * env_amount_in_factor_high) / sol_price;
        tip = amount_in * env_tip_factor_median;
        slippage = 5.0;
        if liquidity > 5_000_000.0 {
            tip = amount_in * env_tip_factor_ultra;
            slippage = 10.0;
        } else if liquidity > 2_000_000.0 {
            tip = amount_in * env_tip_factor_high;
            slippage = 6.0;
        } else {
            slippage = 6.0;
        }
    } else if variation <= -25.0 && liquidity >= 80_000.0 {
        amount_in = (liquidity * env_amount_in_factor_median) / sol_price;
        tip = amount_in * env_tip_factor_median;
        slippage = 3.0;
    } else if variation <= -20.0 && liquidity >= 80_000.0 {
        amount_in = (liquidity * env_amount_in_factor_median) / sol_price;
        tip = amount_in * env_tip_factor_median;
    } else if variation <= -15.0 && liquidity >= 100_000.0 {
        amount_in = (liquidity * env_amount_in_factor_median) / sol_price;
        tip = amount_in * env_tip_factor_median;
        slippage = 2.0;
    } else if variation <= -10.0 && liquidity >= 500_000.0 {
        amount_in = (liquidity * env_amount_in_factor_median) / sol_price;
        tip = amount_in * env_tip_factor_low;
        slippage = 2.0;
    } else if variation <= -8.0 && liquidity >= 800_000.0 {
        amount_in = (liquidity * env_amount_in_factor_low) / sol_price;
        tip = amount_in * env_tip_factor_low;
        slippage = 2.0;
    } else if variation <= -5.0 && liquidity >= 5_000_000.0 {
        amount_in = (liquidity * env_amount_in_factor_low) / sol_price;
        tip = env_tip_min * 4.0;
        slippage = 0.5;
    }

    if amount_in > env_max_amount {
        amount_in = env_max_amount;
        tip = env_tip_min * 4.0;
        slippage = 5.0;
    }

    if on_debug {
        log!(
            format!(
                "( Debug Mode ) AmountIn {} , Tip {} , Slippage {}",
                amount_in, tip, slippage
            ),
            "info"
        )
    }

    (amount_in, tip, slippage)
}
