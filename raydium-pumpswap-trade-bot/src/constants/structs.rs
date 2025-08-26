use borsh::{BorshDeserialize, BorshSerialize};
use bytemuck::checked::try_from_bytes;
use bytemuck::{Pod, Zeroable};
use solana_sdk::pubkey::Pubkey;
use std::marker::Copy;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SwapBaseIn {
    pub discriminator: u8,
    pub amount_in: u64,
    pub minimum_amount_out: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SwapBaseOut {
    pub discriminator: u8,
    pub max_amount_in: u64,
    pub amount_out: u64,
}

pub struct RayAMMSwapBaseInParams {
    pub amount_in: u64,
    pub minimum_amount_out: u64,
    pub pool_id: Pubkey,
    pub coin_vault: Pubkey,
    pub pc_vault: Pubkey,
    pub input_mint: Pubkey,
    pub output_mint: Pubkey,
    pub payer: Pubkey,
}

pub struct PumpSwapBuyParams {
    pub base_amount_out: u64,
    pub max_quote_amount_in: u64,
    pub pool_id: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub base_token_program: Pubkey,
    pub quote_token_program: Pubkey,
    pub payer: Pubkey,
}

pub struct PumpSwapSellParams {
    pub base_amount_in: u64,
    pub min_quote_amount_out: u64,
    pub pool_id: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub base_token_program: Pubkey,
    pub quote_token_program: Pubkey,
    pub payer: Pubkey,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PumpswapPool {
    pub pool_bump: u8,                    // The pool bump byte (offset 8)
    pub index: u16,                       // The index of the pool (offset 9, 2 bytes)
    pub creator: String,                  // The creator public key (offset 11, 32 bytes)
    pub base_mint: String,                // The base mint public key (offset 35, 32 bytes)
    pub quote_mint: String,               // The quote mint public key (offset 67, 32 bytes)
    pub lp_mint: String,                  // The LP mint public key (offset 99, 32 bytes)
    pub pool_base_token_account: String,  // The base token account (offset 131, 32 bytes)
    pub pool_quote_token_account: String, // The quote token account (offset 163, 32 bytes)
    pub lp_supply: u64,                   // The LP supply (offset 195, 8 bytes)
}

// Define a pub struct to hold pool information
#[derive(Debug)]
pub struct PoolInfo {
    pub id: String,
    pub market_id: String,
    pub base_vault: Pubkey,
    pub coin_vault: Pubkey,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Fees {
    pub trade_fee_numerator: u64,
    pub trade_fee_denominator: u64,
    pub pnl_numerator: u64,
    pub pnl_denominator: u64,
    pub swap_fee_numerator: u64,
    pub swap_fee_denominator: u64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct OutputData {
    pub base_need_take_pnl: u64,
    pub quote_need_take_pnl: u64,
    pub quote_total_pnl: u64,
    pub base_total_pnl: u64,
    pub pool_open_time: u64,
    pub punish_pc_amount: u64,
    pub punish_coin_amount: u64,
    pub orderbook_to_init_time: u64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct U128 {
    pub lo: u64,
    pub hi: u64,
}

impl U128 {
    pub fn to_u128(&self) -> u128 {
        ((self.hi as u128) << 64) | (self.lo as u128)
    }

    pub fn from_u128(value: u128) -> Self {
        Self {
            lo: value as u64,
            hi: (value >> 64) as u64,
        }
    }
}

#[repr(C)]
#[derive(Debug, BorshDeserialize, BorshSerialize)]
pub struct LiquidityStateLayoutV4 {
    pub status: u64,
    pub nonce: u64,
    pub max_order: u64,
    pub depth: u64,
    pub base_decimal: u64,
    pub quote_decimal: u64,
    pub state: u64,
    pub reset_flag: u64,
    pub min_size: u64,
    pub vol_max_cut_ratio: u64,
    pub amount_wave_ratio: u64,
    pub base_lot_size: u64,
    pub quote_lot_size: u64,
    pub min_price_multiplier: u64,
    pub max_price_multiplier: u64,
    pub system_decimal_value: u64,
    pub min_separate_numerator: u64,
    pub min_separate_denominator: u64,
    pub trade_fee_numerator: u64,
    pub trade_fee_denominator: u64,
    pub pnl_numerator: u64,
    pub pnl_denominator: u64,
    pub swap_fee_numerator: u64,
    pub swap_fee_denominator: u64,
    pub base_need_take_pnl: u64,
    pub quote_need_take_pnl: u64,
    pub quote_total_pnl: u64,
    pub base_total_pnl: u64,
    pub pool_open_time: u64,
    pub punish_pc_amount: u64,
    pub punish_coin_amount: u64,
    pub orderbook_to_init_time: u64,
    pub swap_base_in_amount: u128,
    pub swap_quote_out_amount: u128,
    pub swap_base2quote_fee: u64,
    pub swap_quote_in_amount: u128,
    pub swap_base_out_amount: u128,
    pub swap_quote2base_fee: u64,
    // AMM vault
    pub base_vault: Pubkey,
    pub quote_vault: Pubkey,
    // Mint
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub lp_mint: Pubkey,
    // Market
    pub open_orders: Pubkey,
    pub market_id: Pubkey,
    pub market_program_id: Pubkey,
    pub target_orders: Pubkey,
    pub withdraw_queue: Pubkey,
    pub lp_vault: Pubkey,
    pub owner: Pubkey,
    // True circulating supply without lockup
    pub lp_reserve: u64,
    pub padding: [u64; 3],
}

pub struct PoolKeys {
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TokenListInfos {
    pub id_bs64: String,
    pub base_vault_b64: String,
    pub quote_vault_b64: String,
    pub base_mint: String,
    pub quote_mint: String,
    pub clean_symbol: String,
    pub ata: String,
    pub dex: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    pub id: u32,
    pub result: String,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct BuyTxHistory {
    pub signature: String,
    pub amount_in: u64,
    pub ui_amount_in: f64,
    pub amount_out: u64,
    pub ui_amount_out: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BuyHistoryInfo {
    pub pool_id: String,
    pub base_mint: String,
    pub quote_mint: String,
    pub base_vault: String,
    pub quote_vault: String,
    pub token_ata: String,
    pub symbol: String,
    pub total_amount_in: u64,
    pub total_ui_amount_in: f64,
    pub total_token_amount_out: u64,
    pub total_ui_token_amount_out: f64,
    pub take_profit: u8,
    pub transactions: Vec<BuyTxHistory>,
    pub dex : String,
}

