use bigdecimal::{BigDecimal, FromPrimitive};

use crate::calc_min_amount_out;

pub fn slippage_setup(
    pool_price_int: u64,
    variation: f64,
    amount_recalc: BigDecimal,
    current_price_recalc: BigDecimal,
    token_decimals: u32,
) -> (BigDecimal, f64) {
    let env_slippage_low = 0.01;
    let env_slippage_median = 0.05;
    let env_slippage_high = 0.1;

    let mut tx_slippage = (variation.abs() * env_slippage_low).round();

    if variation <= -40.0 && pool_price_int >= 200_000 {
        tx_slippage = (variation.abs() * env_slippage_high).round();
        if pool_price_int >= 500_000 {
            tx_slippage = (variation.abs() * env_slippage_high).round();
        }
    } else if variation <= -30.0 && pool_price_int >= 200_000 {
        tx_slippage = (variation.abs() * env_slippage_high).round();
        if pool_price_int >= 500_000 {
            tx_slippage = (variation.abs() * env_slippage_high).round();
        }
    } else if variation <= -25.0 && pool_price_int >= 200_000 {
        tx_slippage = (variation.abs() * env_slippage_median).round();
        if pool_price_int >= 500_000 {
            tx_slippage = (variation.abs() * env_slippage_high).round();
        }
    } else if variation <= -18.0 && pool_price_int >= 200_000 {
        tx_slippage = (variation.abs() * env_slippage_median).round();
        if pool_price_int >= 800_000 {
            tx_slippage = (variation.abs() * env_slippage_high).round();
        }
    } else if variation <= -15.0 && pool_price_int >= 200_000 {
        tx_slippage = (variation.abs() * env_slippage_low).round();
        if pool_price_int >= 800_000 {
            tx_slippage = (variation.abs() * env_slippage_high).round();
        }
    } else if variation <= -12.0 && pool_price_int >= 200_000 {
        tx_slippage = (variation.abs() * env_slippage_low).round();
        if pool_price_int >= 2_000_000 {
            tx_slippage = (variation.abs() * env_slippage_median).round();
        }
    } else if variation <= -10.0 && pool_price_int >= 200_000 {
        tx_slippage = (variation.abs() * env_slippage_low).round();
        if pool_price_int >= 5_000_000 {
            tx_slippage = (variation.abs() * env_slippage_median).round();
        }
    } else if variation <= -8.0 && pool_price_int >= 200_000 {
        tx_slippage = (variation.abs() * env_slippage_low).round();
        if pool_price_int >= 5_000_000 {
            tx_slippage = (variation.abs() * env_slippage_median).round();
        }
    }

    let info_min_amount_out = calc_min_amount_out(
        amount_recalc,
        current_price_recalc,
        BigDecimal::from_f64(tx_slippage).unwrap(),
        token_decimals,
    );
    (info_min_amount_out, tx_slippage)
}
