use crate::log;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::signature::Signature;

pub async fn confirm_transaction(client: &RpcClient, signature: &Signature, gateway: &str) {
    let timeout_secs = 30;
    let start_time = std::time::Instant::now();

    while start_time.elapsed().as_secs() < timeout_secs {
        match client.get_signature_status(signature).await {
            Ok(Some(result)) => {
                if result.is_ok() {
                    log!(
                        format!("Transaction confirmed! ✅ [ {} ]", gateway),
                        "success"
                    );
                    return;
                } else {
                    log!(format!("[ {}❌ ]: {:?}", gateway, result), "error");
                    return;
                }
            }
            Ok(None) => {}
            Err(err) => {
                log!(
                    format!(
                        "Error checking transaction status [ {} ]: {:?}",
                        gateway, err
                    ),
                    "error"
                );
                return;
            }
        }
        tokio::time::sleep(std::time::Duration::from_secs(2)).await;
    }

    log!(
        format!("Transaction confirmation timeout. ⏳ [ {} ] ", gateway),
        "error"
    );
}
