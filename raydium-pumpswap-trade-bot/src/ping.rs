use std::{env, str::FromStr};

use raydium_trade_bot::load_env_file;
use tokio::time::Instant;
use yellowstone_grpc_client::{ClientTlsConfig, GeyserGrpcClient};

#[tokio::main]
async fn main() {
    /* Initial Settings */
    let (_, rpc, grpc, token, _, _, _, _) = load_env_file();

    let yellowstone_grpc_http = grpc;
    let yellowstone_grpc_token = token;

    // Get command line arguments
    let args: Vec<String> = env::args().collect();

    // Check if an argument is provided
    println!("Running ping test...");
    let _ = ping_test(
        yellowstone_grpc_http.clone(),
        yellowstone_grpc_token.clone(),
    )
    .await;
}

pub async fn ping_test(
    yellowstone_grpc_http: String,
    yellowstone_grpc_token: String,
) -> Result<(), String> {
    // INITIAL SETTING FOR SUBSCIBE
    // -----------------------------------------------------------------------------------------------------------------------------
    let mut client = GeyserGrpcClient::build_from_shared(yellowstone_grpc_http)
        .map_err(|e| format!("Failed to build client: {}", e))?
        .x_token::<String>(Some(yellowstone_grpc_token))
        .map_err(|e| format!("Failed to set x_token: {}", e))?
        .tls_config(ClientTlsConfig::new().with_native_roots())
        .map_err(|e| format!("Failed to set tls config: {}", e))?
        .connect()
        .await
        .map_err(|e| format!("Failed to connect: {}", e))?;

    // PING CHECK
    // -----------------
    for i in 0..1000 {
        let start_time = Instant::now();
        match client.ping(i).await {
            Ok(res) => {
                println!("Pong Response: {} => {:?}", res.count, start_time.elapsed());
            }
            Err(err) => {
                println!("Error in Ping Test: {:#?}", err);
            }
        };
    }
    Ok(())
}

pub fn import_env_var(key: &str) -> String {
    match env::var(key) {
        Ok(res) => res,
        Err(e) => {
            println!("{}", format!("{}: {}", e, key));
            loop {}
        }
    }
}
