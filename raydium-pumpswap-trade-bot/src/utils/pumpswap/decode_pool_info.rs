use crate::PumpswapPool;

pub fn decode_pumpswap_pool_info(data: Vec<u8>) -> PumpswapPool {
    let offset = 8;

    let pool_bump = data[offset];
    let index = u16::from_le_bytes([data[offset + 1], data[offset + 2]]);
    let creator = bs58::encode(&data[offset + 3..offset + 35]).into_string();
    let base_mint = bs58::encode(&data[offset + 35..offset + 67]).into_string();
    let quote_mint = bs58::encode(&data[offset + 67..offset + 99]).into_string();
    let lp_mint = bs58::encode(&data[offset + 99..offset + 131]).into_string();
    let pool_base_token_account = bs58::encode(&data[offset + 131..offset + 163]).into_string();
    let pool_quote_token_account = bs58::encode(&data[offset + 163..offset + 195]).into_string();
    let lp_supply = u64::from_le_bytes(data[offset + 195..offset + 203].try_into().unwrap());

    // Pool struct
    let pool = PumpswapPool {
        pool_bump,
        index,
        creator,
        base_mint,
        quote_mint,
        lp_mint,
        pool_base_token_account,
        pool_quote_token_account,
        lp_supply,
    };

    pool
}
