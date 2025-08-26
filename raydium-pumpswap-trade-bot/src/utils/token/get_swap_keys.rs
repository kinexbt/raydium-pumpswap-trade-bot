use crate::{load_token_info, TokenListInfos};
use solana_sdk::pubkey::Pubkey;

pub fn get_swap_keys(pool_id: &Pubkey) -> (Pubkey, Pubkey) {
    let pool_info: TokenListInfos = load_token_info(&pool_id.to_string()).unwrap();

    (
        Pubkey::from_str_const(&pool_info.base_vault_b64),
        Pubkey::from_str_const(&pool_info.quote_vault_b64),
    )
}
