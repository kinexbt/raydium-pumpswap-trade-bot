use std::collections::HashMap;

use anyhow::Result;
use raydium_trade_bot::{
    get_sol_price, load_black_list, load_enermy_list, load_env_file, load_pool_info, log,
    TxGrpcStreamManager,
};
use solana_sdk::{commitment_config::CommitmentLevel, signer::Signer};
use yellowstone_grpc_proto::geyser::{SubscribeRequest, SubscribeRequestFilterTransactions};

#[tokio::main]
async fn main() -> Result<()> {
    log!(
        format!("\n\n ================== Raydium Sniper ================== \n"),
        "info"
    );

    let (payer, rpc, grpc, token, _, _, _, _) = load_env_file();
    log!(format!("✅ Load .env Successfully"), "info");
    let pool_info_list = load_pool_info();
    log!(format!("✅ Load pool_info Successfully"), "info");
    let black_list: Vec<String> = load_black_list();
    log!(format!("✅ Load black_list Successfully"), "info");
    let enermy_list: Vec<String> = load_enermy_list();
    log!(format!("✅ Load enermy_list Successfully"), "info");

    // let token_list = load_token_list();
    log!(format!("✅ Load token_list Successfully"), "info");

    let sol_price: f64 = get_sol_price().await.unwrap_or(None).unwrap_or(0.0);
    log!(
        format!("✅ Load Solana Price Successfully : {}", sol_price),
        "info"
    );

    log!(format!("RPC: {}", rpc), "info");
    log!(format!("GRPC: {}", grpc), "info");
    log!(format!("Payer: {}", payer.pubkey()), "info");

    log!(format!("Token & Pool List: {:#?}", pool_info_list), "info");
    log!(format!("Black List: {:#?}", black_list), "info");
    log!(format!("Enermy List: {:#?}", enermy_list), "info");

    // ✅ Flatten all values into a single Vec<String>

    let manager =
        TxGrpcStreamManager::new(grpc.as_ref(), rpc.as_ref(), token.as_ref(), sol_price).await?;

    let mut manager_lock = manager.lock().await;

    let request: SubscribeRequest = SubscribeRequest {
        transactions: HashMap::from_iter(vec![(
            "transactions".to_string(),
            SubscribeRequestFilterTransactions {
                vote: Some(false),
                failed: Some(false),
                signature: None,
                account_include: pool_info_list,
                account_exclude: black_list,
                account_required: vec![],
            },
        )]),
        commitment: Some(CommitmentLevel::Processed as i32),
        ..Default::default()
    };

    log!(
        format!("✅ Starting subscription for PumpSwap & Raydium"),
        "info"
    );

    // Start the subscription
    let result = manager_lock.connect(request, enermy_list).await;
    if let Err(e) = &result {
        log!(format!("🔴 Subscription error: {:?}", e), "error");
    }
    result?;

    Ok(())
}
