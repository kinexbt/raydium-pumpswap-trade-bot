use dotenvy::dotenv;
use solana_sdk::signature::Keypair;
use std::{env, fs};

pub fn load_key() -> Keypair {
    dotenv().ok(); // Load .env file

    let private_key = env::var("PRIVATE_KEY").expect("PRIVATE_KEY must be set");

    let payer = Keypair::from_base58_string(private_key.as_str());

    payer
}

pub fn load_env_file() -> (Keypair, String, String, String, bool, bool, bool, bool) {
    dotenv().ok(); // Load .env file

    let private_key = env::var("PRIVATE_KEY").expect("PRIVATE_KEY must be set");
    let rpc_endpoint = env::var("RPC_ENDPOINT").expect("RPC_ENDPOINT must be set");
    let grpc_endpoint = env::var("GRPC_ENDPOINT").expect("GRPC_ENDPOINT must be set");
    let grpc_token = env::var("GRPC_TOKEN").expect("GRPC_TOKEN must be set");
    let on_debug = env::var("ON_DEBUG").expect("ON_DEBUG must be set") == "true";
    let show_buy = env::var("SHOW_BUY").expect("SHOW_BUY must be set") == "true";
    let show_sell = env::var("SHOW_SELL").expect("SHOW_SELL must be set") == "true";
    let is_racing = env::var("IS_RACING").expect("IS_RACING must be set") == "true";

    let payer = Keypair::from_base58_string(private_key.as_str());

    (
        payer,
        rpc_endpoint,
        grpc_endpoint,
        grpc_token,
        show_buy,
        show_sell,
        on_debug,
        is_racing,
    )
}

pub fn load_pool_addrs() -> Vec<String> {
    dotenv().ok(); // Load .env file
    let pool_addrs_dir = env::var("POOL_ADDR_DIR").expect("POOL_ADDR_DIR must be set");
    let file_content = fs::read_to_string(pool_addrs_dir).expect("Failed to read file");

    // Parse the JSON into a Vec<String>
    let keys: Vec<String> = serde_json::from_str(&file_content).expect("Failed to parse JSON");

    keys
}

pub fn load_enermy_list() -> Vec<String> {
    dotenv().ok(); // Load .env file
    let enermy_list_dir = env::var("ENERMY_LIST_DIR").expect("ENERMY_LIST_DIR must be set");
    let file_content = fs::read_to_string(enermy_list_dir).expect("Failed to read file");

    // Parse the JSON into a Vec<String>
    let keys: Vec<String> = serde_json::from_str(&file_content).expect("Failed to parse JSON");

    keys
}

pub fn load_black_list() -> Vec<String> {
    dotenv().ok(); // Load .env file
    let black_list_dir = env::var("BLACK_LIST_DIR").expect("black_LIST_DIR must be set");
    let file_content = fs::read_to_string(black_list_dir).expect("Failed to read file");

    // Parse the JSON into a Vec<String>
    let keys: Vec<String> = serde_json::from_str(&file_content).expect("Failed to parse JSON");

    keys
}

pub fn load_pool_info() -> Vec<String> {
    let pool_info_dir = env::var("POOL_ADDR_DIR").expect("POOL_ADDR_DIR must be set");

    let file_content = fs::read_to_string(pool_info_dir).expect("Failed to read file");

    let keys: Vec<String> = serde_json::from_str(&file_content).expect("Failed to parse JSON");

    keys
}

pub fn load_max_sol_amount() -> f64 {
    dotenv().ok(); // Load .env file

    let env_max_amount: f64 = env::var("MAX_AMOUNT")
        .expect("MAX_AMOUNT must be set")
        .parse()
        .expect("MAX_AMOUNT must be a valid number");

    env_max_amount
}

pub fn load_auth_key() -> (String, String, String, String) {
    dotenv().ok(); // Load .env file

    let next_key = env::var("NEXT_BLOCK_KEY").expect("NEXT_BLOCK_KEY must be set");
    let nozomi_key = env::var("NOZOMI_API_KEY").expect("NOZOMI_API_KEY must be set");
    let blox_auth_header = env::var("BLOX_AUTH_HEADER").expect("BLOX_AUTH_HEADER must be set");
    let zero_slot_key = env::var("ZSLOT_API_KEY").expect("ZSLOT_API_KEY must be set");

    (next_key, nozomi_key, blox_auth_header, zero_slot_key)
}

pub fn load_is_submit_tx() -> bool {
    dotenv().ok(); // Load .env file

    let is_submit_tx = env::var("SUBMIT_TX").expect("SUBMIT_TX must be set");

    is_submit_tx == "true"
}

pub fn load_dump_setting() -> (f64, f64, f64, f64, f64, f64, f64, f64, f64) {
    dotenv().ok(); // Load .env file

    let env_max_amount: f64 = env::var("MAX_AMOUNT")
        .expect("MAX_AMOUNT must be set")
        .parse()
        .expect("MAX_AMOUNT must be a valid number");

    let env_amount_in_factor_low: f64 = env::var("AMOUNT_IN_FACTOR_LOW")
        .expect("AMOUNT_IN_FACTOR_LOW must be set")
        .parse()
        .expect("AMOUNT_IN_FACTOR_LOW must be a valid number");

    let env_amount_in_factor_median: f64 = env::var("AMOUNT_IN_FACTOR_MEDIAN")
        .expect("AMOUNT_IN_FACTOR_MEDIAN must be set")
        .parse()
        .expect("AMOUNT_IN_FACTOR_MEDIAN must be a valid number");

    let env_amount_in_factor_high: f64 = env::var("AMOUNT_IN_FACTOR_HIGH")
        .expect("AMOUNT_IN_FACTOR_HIGH must be set")
        .parse()
        .expect("AMOUNT_IN_FACTOR_HIGH must be a valid number");

    let env_tip_min: f64 = env::var("TIP_MIN")
        .expect("TIP_MIN must be set")
        .parse()
        .expect("TIP_MIN must be a valid number");

    let env_tip_factor_low: f64 = env::var("TIP_FACTOR_LOW")
        .expect("TIP_FACTOR_LOW must be set")
        .parse()
        .expect("TIP_FACTOR_LOW must be a valid number");

    let env_tip_factor_median: f64 = env::var("TIP_FACTOR_MEDIAN")
        .expect("TIP_FACTOR_MEDIAN must be set")
        .parse()
        .expect("TIP_FACTOR_MEDIAN must be a valid number");

    let env_tip_factor_high: f64 = env::var("TIP_FACTOR_HIGH")
        .expect("TIP_FACTOR_HIGH must be set")
        .parse()
        .expect("TIP_FACTOR_HIGH must be a valid number");

    let env_tip_factor_ultra: f64 = env::var("TIP_FACTOR_ULTRA")
        .expect("TIP_FACTOR_ULTRA must be set")
        .parse()
        .expect("TIP_FACTOR_ULTRA must be a valid number");

    (
        env_max_amount,
        env_amount_in_factor_low,
        env_amount_in_factor_median,
        env_amount_in_factor_high,
        env_tip_min,
        env_tip_factor_low,
        env_tip_factor_median,
        env_tip_factor_high,
        env_tip_factor_ultra,
    )
}

pub fn load_filter_setting() -> (u64, f64) {
    dotenv().ok();

    let env_acceptable_liquidity: u64 = env::var("ACCEPTABLE_LIQUIDITY")
        .expect("ACCEPTABLE_LIQUIDITY must be set")
        .parse()
        .expect("ACCEPTABLE_LIQUIDITY must be a valid number");

    let take_profit_pcnt: f64 = env::var("TAKE_PROFIT")
        .expect("TAKE_PROFIT must be set")
        .parse()
        .expect("TAKE_PROFIT must be a valid number");

    (env_acceptable_liquidity, take_profit_pcnt)
}
