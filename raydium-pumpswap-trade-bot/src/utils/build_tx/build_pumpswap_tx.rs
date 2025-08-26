use crate::{
    PumpSwapBuyParams, PumpSwapSellParams, ASSOCIATED_TOKEN_PRO, PUMPSWAP_FEE, PUMP_SWAP_ID,
    SYSTEM_PRO, TOKEN_PRO,
};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};
use spl_associated_token_account::get_associated_token_address;

const PUMPSWAP_PROGRAM_ID: Pubkey = Pubkey::from_str_const(PUMP_SWAP_ID);
const SYSTEMP_PROGRAM_ID: Pubkey = Pubkey::from_str_const(SYSTEM_PRO);
const ASSOCIATED_TOKEN_PROGRAM_ID: Pubkey = Pubkey::from_str_const(ASSOCIATED_TOKEN_PRO);

pub fn build_pumpswap_buy(pumpswap_buy_param: PumpSwapBuyParams) -> Instruction {
    let (global_config, _) =
        Pubkey::find_program_address(&["global_config".as_bytes()], &PUMPSWAP_PROGRAM_ID);
    let user_base_token_account =
        get_associated_token_address(&pumpswap_buy_param.payer, &pumpswap_buy_param.base_mint);
    let user_quote_token_account =
        get_associated_token_address(&pumpswap_buy_param.payer, &pumpswap_buy_param.quote_mint);
    let pool_base_token_account =
        get_associated_token_address(&pumpswap_buy_param.pool_id, &pumpswap_buy_param.base_mint);
    let pool_quote_token_account =
        get_associated_token_address(&pumpswap_buy_param.pool_id, &pumpswap_buy_param.quote_mint);
    let protocol_fee_recipient = Pubkey::from_str_const(PUMPSWAP_FEE[0]);
    let protocol_fee_recipient_token_account =
        get_associated_token_address(&protocol_fee_recipient, &pumpswap_buy_param.quote_mint);
    let (event_authority, _) =
        Pubkey::find_program_address(&["__event_authority".as_bytes()], &PUMPSWAP_PROGRAM_ID);

    let discriminator = vec![102, 6, 61, 18, 1, 218, 235, 234]; // "buy" instruction discriminator
    let mut data = discriminator;

    data.extend_from_slice(&pumpswap_buy_param.base_amount_out.to_le_bytes());
    data.extend_from_slice(&pumpswap_buy_param.max_quote_amount_in.to_le_bytes());

    Instruction {
        program_id: PUMPSWAP_PROGRAM_ID,
        accounts: vec![
            AccountMeta::new_readonly(pumpswap_buy_param.pool_id, false),
            AccountMeta::new(pumpswap_buy_param.payer, true), // writable & signer
            AccountMeta::new_readonly(global_config, false),
            AccountMeta::new_readonly(pumpswap_buy_param.base_mint, false),
            AccountMeta::new_readonly(pumpswap_buy_param.quote_mint, false),
            AccountMeta::new(user_base_token_account, false),
            AccountMeta::new(user_quote_token_account, false), // writable
            AccountMeta::new(pool_base_token_account, false),  // writable
            AccountMeta::new(pool_quote_token_account, false), // writable
            AccountMeta::new_readonly(protocol_fee_recipient, false),
            AccountMeta::new(protocol_fee_recipient_token_account, false), // writable
            AccountMeta::new_readonly(pumpswap_buy_param.base_token_program, false),
            AccountMeta::new_readonly(pumpswap_buy_param.quote_token_program, false),
            AccountMeta::new_readonly(SYSTEMP_PROGRAM_ID, false),
            AccountMeta::new_readonly(ASSOCIATED_TOKEN_PROGRAM_ID, false),
            AccountMeta::new_readonly(event_authority, false),
            AccountMeta::new_readonly(PUMPSWAP_PROGRAM_ID, false),
        ],
        data,
    }
}

pub fn build_pumpswap_sell(pumpswap_sell_param: PumpSwapSellParams) -> Instruction {
    let (global_config, _) =
        Pubkey::find_program_address(&["global_config".as_bytes()], &PUMPSWAP_PROGRAM_ID);
    let user_base_token_account =
        get_associated_token_address(&pumpswap_sell_param.payer, &pumpswap_sell_param.base_mint);
    let user_quote_token_account =
        get_associated_token_address(&pumpswap_sell_param.payer, &pumpswap_sell_param.quote_mint);
    let pool_base_token_account =
        get_associated_token_address(&pumpswap_sell_param.pool_id, &pumpswap_sell_param.base_mint);
    let pool_quote_token_account = get_associated_token_address(
        &pumpswap_sell_param.pool_id,
        &pumpswap_sell_param.quote_mint,
    );
    let protocol_fee_recipient = Pubkey::from_str_const(PUMPSWAP_FEE[0]);
    let protocol_fee_recipient_token_account =
        get_associated_token_address(&protocol_fee_recipient, &pumpswap_sell_param.quote_mint);
    let (event_authority, _) =
        Pubkey::find_program_address(&["__event_authority".as_bytes()], &PUMPSWAP_PROGRAM_ID);

    let discriminator = vec![51, 230, 133, 164, 1, 127, 131, 173]; // "sell" instruction discriminator
    let mut data = discriminator;

    data.extend_from_slice(&pumpswap_sell_param.base_amount_in.to_le_bytes());
    data.extend_from_slice(&pumpswap_sell_param.min_quote_amount_out.to_le_bytes());

    Instruction {
        program_id: PUMPSWAP_PROGRAM_ID,
        accounts: vec![
            AccountMeta::new_readonly(pumpswap_sell_param.pool_id, false),
            AccountMeta::new(pumpswap_sell_param.payer, true), // writable & signer
            AccountMeta::new_readonly(global_config, false),
            AccountMeta::new_readonly(pumpswap_sell_param.base_mint, false),
            AccountMeta::new_readonly(pumpswap_sell_param.quote_mint, false),
            AccountMeta::new(user_base_token_account, false),
            AccountMeta::new(user_quote_token_account, false), // writable
            AccountMeta::new(pool_base_token_account, false),  // writable
            AccountMeta::new(pool_quote_token_account, false), // writable
            AccountMeta::new_readonly(protocol_fee_recipient, false),
            AccountMeta::new(protocol_fee_recipient_token_account, false), // writable
            AccountMeta::new_readonly(pumpswap_sell_param.base_token_program, false),
            AccountMeta::new_readonly(pumpswap_sell_param.quote_token_program, false),
            AccountMeta::new_readonly(SYSTEMP_PROGRAM_ID, false),
            AccountMeta::new_readonly(ASSOCIATED_TOKEN_PROGRAM_ID, false),
            AccountMeta::new_readonly(event_authority, false),
            AccountMeta::new_readonly(PUMPSWAP_PROGRAM_ID, false),
        ],
        data,
    }
}
