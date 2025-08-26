use std::{
    collections::HashMap,
    fs::{self, File},
    io::Write,
};

use crate::{log, BuyHistoryInfo, BuyTxHistory, TokenListInfos};

pub fn save_to_json(data: &HashMap<String, Vec<String>>, filename: &str) {
    let json_string = serde_json::to_string_pretty(data).expect("Failed to serialize JSON");

    let mut file = File::create(filename).expect("Failed to create file");
    file.write_all(json_string.as_bytes())
        .expect("Failed to write to file");
}

pub fn save_token_info(data: &TokenListInfos, token_mint_addr: &str) {
    let file_path = format!("src/assets/infos/recorded_ids/{}.json", token_mint_addr);
    let json_string = serde_json::to_string_pretty(data).expect("Failed to serialize JSON");

    let mut file = File::create(file_path).expect("Failed to create file");
    file.write_all(json_string.as_bytes())
        .expect("Failed to write to file");
}

pub fn load_token_info(
    token_mint_addr: &str,
) -> Result<TokenListInfos, Box<dyn std::error::Error>> {
    let file_path = format!("src/assets/infos/recorded_ids/{}.json", token_mint_addr);
    let file_content = fs::read_to_string(&file_path)?;
    let token: TokenListInfos = serde_json::from_str(&file_content)?;

    Ok(token)
}

pub fn save_token_trade_info(data: &BuyHistoryInfo, pool_addr: &str) {
    let file_path = format!("src/assets/infos/trade_history/{}.json", pool_addr);
    let json_string = serde_json::to_string_pretty(data).expect("Failed to serialize JSON");

    let mut file = File::create(file_path).expect("Failed to create file");
    file.write_all(json_string.as_bytes())
        .expect("Failed to write to file");
}

pub fn load_token_trade_info(
    pool_addr: &str,
) -> Result<BuyHistoryInfo, Box<dyn std::error::Error>> {
    let file_path = format!("src/assets/infos/trade_history/{}.json", pool_addr);
    let file_content = fs::read_to_string(&file_path)?;
    let token: BuyHistoryInfo = serde_json::from_str(&file_content)?;

    Ok(token)
}

pub fn update_token_buy_info(
    tx_hash: &str,
    pool_addr: &str,
    amount: u64,
    ui_amount: f64,
    is_in: bool,
) {
    let file_path = format!("src/assets/infos/trade_history/{}.json", pool_addr);
    let mut data = load_token_trade_info(&pool_addr).unwrap();

    let mut found = false;

    for tx in &mut data.transactions {
        if tx.signature == tx_hash {
            if is_in {
                tx.amount_in = amount;
                tx.ui_amount_in = ui_amount;
            } else {
                tx.amount_out = amount;
                tx.ui_amount_out = ui_amount;
            }
            found = true;
            break;
        }
    }

    if !found {
        let new_tx = if is_in {
            BuyTxHistory {
                signature: tx_hash.to_string(),
                amount_in: amount,
                ui_amount_in: ui_amount,
                amount_out: 0,
                ui_amount_out: 0.0,
            }
        } else {
            BuyTxHistory {
                signature: tx_hash.to_string(),
                amount_in: 0,
                ui_amount_in: 0.0,
                amount_out: amount,
                ui_amount_out: ui_amount,
            }
        };
        data.transactions.push(new_tx);
    }

    let json_string = serde_json::to_string_pretty(&data).expect("Failed to serialize TradeInfo");
    let mut file = File::create(&file_path).expect("Failed to create trade history file");
    file.write_all(json_string.as_bytes())
        .expect("Failed to write trade history");
}

pub fn update_token_trade_total_info(
    pool_addr: &str,
    total_amount_in: u64,
    total_ui_amount_in: f64,
    total_token_amount_out: u64,
    total_ui_token_amount_out: f64,
) {
    let file_path = format!("src/assets/infos/trade_history/{}.json", pool_addr);
    let mut data = load_token_trade_info(&pool_addr).unwrap();

    data.total_amount_in += total_amount_in;
    data.total_ui_amount_in += total_ui_amount_in;
    data.total_token_amount_out += total_token_amount_out;
    data.total_ui_token_amount_out += total_ui_token_amount_out;

    let json_string = serde_json::to_string_pretty(&data).expect("Failed to serialize TradeInfo");
    let mut file = File::create(&file_path).expect("Failed to create trade history file");
    file.write_all(json_string.as_bytes())
        .expect("Failed to write trade history");
}

pub fn init_token_trade_total_info(pool_addr: &str) {
    let file_path = format!("src/assets/infos/trade_history/{}.json", pool_addr);
    let mut data = load_token_trade_info(&pool_addr).unwrap();

    data.total_amount_in = 0;
    data.total_ui_amount_in = 0.0;
    data.total_token_amount_out = 0;
    data.total_ui_token_amount_out = 0.0;

    data.transactions = vec![];

    let json_string = serde_json::to_string_pretty(&data).expect("Failed to serialize TradeInfo");
    let mut file = File::create(&file_path).expect("Failed to create trade history file");
    file.write_all(json_string.as_bytes())
        .expect("Failed to write trade history");
}

pub fn calc_pnl(
    pool_addr: &str,
    pool_ui_amount_in: f64,
    pool_ui_token_amount_out: f64,
) -> (f64, u64 , u64) {
    let data = load_token_trade_info(&pool_addr).unwrap();

    let expect_out =
        (pool_ui_amount_in / pool_ui_token_amount_out * 1.0025) * data.total_ui_token_amount_out;

    let pnl = (expect_out - data.total_ui_amount_in) * 100.0 / data.total_ui_amount_in;
    log!(
        format!(
            "Inventory Token Amount {}, Inventory Sol Amount {}, Expect Out {}, PnL {} %",
            data.total_ui_token_amount_out, data.total_ui_amount_in, expect_out, pnl
        ),
        "info"
    );

    (pnl, data.total_token_amount_out , data.total_token_amount_out)
}
