use crate::{RayAMMSwapBaseInParams, RAY_AMM_AUTH, RAY_AMM_ID};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};
use spl_associated_token_account::get_associated_token_address;

pub fn build_amm_swap_base_in(amm_swap_base_in_param: RayAMMSwapBaseInParams) -> Instruction {
    let user_token_source_mint = amm_swap_base_in_param.input_mint;
    let user_token_destination_mint = amm_swap_base_in_param.output_mint;
    let amm_program_id = Pubkey::from_str_const(RAY_AMM_ID);
    let amm_pool = amm_swap_base_in_param.pool_id;
    let amm_authority = Pubkey::from_str_const(RAY_AMM_AUTH);

    let user_token_source =
        get_associated_token_address(&amm_swap_base_in_param.payer, &user_token_source_mint);
    let user_token_destination =
        get_associated_token_address(&amm_swap_base_in_param.payer, &user_token_destination_mint);

    let mut data = Vec::new();
    data.extend_from_slice(&9_u8.to_le_bytes());
    data.extend_from_slice(&amm_swap_base_in_param.amount_in.to_le_bytes());
    data.extend_from_slice(&amm_swap_base_in_param.minimum_amount_out.to_le_bytes());

    Instruction {
        program_id: amm_program_id,
        accounts: vec![
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new(amm_pool, false),
            AccountMeta::new_readonly(amm_authority, false),
            AccountMeta::new(amm_pool, false),
            AccountMeta::new(amm_pool, false),
            AccountMeta::new(amm_swap_base_in_param.coin_vault, false),
            AccountMeta::new(amm_swap_base_in_param.pc_vault, false),
            AccountMeta::new_readonly(amm_pool, false),
            AccountMeta::new(amm_pool, false),
            AccountMeta::new(amm_pool, false),
            AccountMeta::new(amm_pool, false),
            AccountMeta::new(amm_pool, false),
            AccountMeta::new(amm_pool, false),
            AccountMeta::new(amm_pool, false),
            AccountMeta::new_readonly(amm_pool, false),
            AccountMeta::new(user_token_source, false),
            AccountMeta::new(user_token_destination, false),
            AccountMeta::new_readonly(amm_swap_base_in_param.payer, true),
        ],
        data,
    }
}
