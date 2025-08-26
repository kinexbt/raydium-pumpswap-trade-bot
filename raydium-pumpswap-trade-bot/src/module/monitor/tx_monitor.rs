use {
    crate::{
        get_sol_price, load_auth_key, load_dump_setting, load_env_file, load_filter_setting,
        load_is_submit_tx, load_key, load_max_sol_amount, log, swap_handler,
    },
    anyhow::Result,
    bs58,
    futures::{sink::SinkExt, stream::StreamExt},
    hex,
    log::error,
    solana_client::nonblocking::rpc_client::RpcClient,
    solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey},
    std::{sync::Arc, time::Duration},
    tokio::sync::{mpsc, Mutex},
    tonic::{metadata::errors::InvalidMetadataValue, transport::Endpoint},
    tonic_health::pb::health_client::HealthClient,
    yellowstone_grpc_client::{GeyserGrpcClient, InterceptorXToken},
    yellowstone_grpc_proto::{
        geyser::{
            geyser_client::GeyserClient, subscribe_update::UpdateOneof, SubscribeRequest,
            SubscribeUpdateTransaction,
        },
        prelude::SubscribeRequestPing,
    },
};
/// Manager for handling gRPC stream connections and transaction updates
pub struct TxGrpcStreamManager {
    client: GeyserGrpcClient<InterceptorXToken>,
    nonblocking_client: Arc<RpcClient>,
    is_connected: bool,
    reconnect_attempts: u32,
    max_reconnect_attempts: u32,
    reconnect_interval: Duration,
    sol_price: Arc<Mutex<f64>>,
}

impl TxGrpcStreamManager {
    /// Creates a new TxGrpcStreamManager instance
    ///
    /// # Arguments
    /// * `endpoint` - The gRPC endpoint URL
    /// * `x_token` - Authentication token for the endpoint
    pub async fn new(
        endpoint: &str,
        rpc_endpoint: &str,
        x_token: &str,
        sol_price: f64,
    ) -> Result<Arc<Mutex<TxGrpcStreamManager>>> {
        let interceptor = InterceptorXToken {
            x_token: Some(
                x_token
                    .parse()
                    .map_err(|e: InvalidMetadataValue| anyhow::Error::from(e))?,
            ),
            x_request_snapshot: true,
        };

        let channel = Endpoint::from_shared(endpoint.to_string())?
            .connect_timeout(Duration::from_secs(10))
            .timeout(Duration::from_secs(10))
            .connect()
            .await
            .map_err(anyhow::Error::from)?;

        let client = GeyserGrpcClient::new(
            HealthClient::with_interceptor(channel.clone(), interceptor.clone()),
            GeyserClient::with_interceptor(channel, interceptor),
        );
        let nonblocking_client = Arc::new(RpcClient::new_with_commitment(
            rpc_endpoint.to_string(),
            CommitmentConfig::processed(),
        ));

        Ok(Arc::new(Mutex::new(TxGrpcStreamManager {
            client,
            nonblocking_client,
            is_connected: false,
            reconnect_attempts: 0,
            max_reconnect_attempts: 10,
            reconnect_interval: Duration::from_secs(5),
            sol_price: Arc::new(Mutex::new(sol_price)), // Initialize sol_price with Arc<Mutex<>>
        })))
    }

    /// Establishes connection and handles the subscription stream
    ///
    /// # Arguments
    /// * `request` - The subscription request containing transaction filters and other parameters
    pub async fn connect(
        &mut self,
        request: SubscribeRequest,
        enermy_list: Vec<String>,
    ) -> Result<()> {
        let (_, _, _, _, show_buy, show_sell, on_debug, is_racing) = load_env_file();
        let signer_key = load_key();
        let (
            env_max_amount,
            env_amount_in_factor_low,
            env_amount_in_factor_median,
            env_amount_in_factor_high,
            env_tip_min,
            env_tip_factor_low,
            env_tip_factor_median,
            env_tip_factor_high,
            env_tip_factor_ultra,
        ) = load_dump_setting();

        let (env_acceptable_liquidity, take_profit_pcnt) = load_filter_setting();
        let max_sol_amount = load_max_sol_amount();
        let is_submit_tx = load_is_submit_tx();
        let (next_key, nozomi_key, blox_auth_header, zero_slot_key) = load_auth_key();

        let sol_price_clone = Arc::clone(&self.sol_price);

        let request = request.clone();
        let (mut subscribe_tx, mut stream) = self
            .client
            .subscribe_with_request(Some(request.clone()))
            .await?;

        self.is_connected = true;
        self.reconnect_attempts = 0;

        // Create a channel for sending ping requests
        let (ping_sender, mut ping_receiver) = mpsc::channel(10);

        // Add client-initiated ping mechanism
        let ping_handle = tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(30));
            loop {
                interval.tick().await;
                if let Err(e) = ping_sender.send(()).await {
                    log!(format!("Failed to send ping singal : {:#?}", e), "error");
                    error!("Failed to send ping signal: {:?}", e);
                    break;
                }
            }
        });

        let _ = tokio::spawn(async move {
            loop {
                let new_price = get_sol_price().await.unwrap_or(None).unwrap_or(0.0);
                let mut price = sol_price_clone.lock().await;
                *price = new_price;
            }
        });

        // Process both stream messages and ping requests
        loop {
            tokio::select! {
                Some(message) = stream.next() => {
                    match message {
                        Ok(msg) => {
                            match msg.update_oneof {
                                Some(UpdateOneof::Transaction(transaction)) => {
                                    let nonblocking_client = self.nonblocking_client.clone();

                                    let sol_price = *self.sol_price.lock().await; // Extract the f64 value safely

                                    let singer_string = signer_key.to_base58_string();
                                    let next_key_clone = next_key.clone();
                                    let nozomi_key_clone = nozomi_key.clone();
                                    let blox_auth_header_clone = blox_auth_header.clone();
                                    let zero_slot_key_clone = zero_slot_key.clone();
                                    let enermy_list_clone = enermy_list.clone();

                                    let _ = tokio::spawn(async move {
                                        let _ = swap_handler(
                                            nonblocking_client,
                                            enermy_list_clone,
                                            &transaction,
                                            singer_string,
                                            &next_key_clone,
                                            &nozomi_key_clone,
                                            &blox_auth_header_clone,
                                            &zero_slot_key_clone,
                                            sol_price,
                                            show_buy,
                                            show_sell,
                                            env_max_amount,
                                            env_amount_in_factor_low,
                                            env_amount_in_factor_median,
                                            env_amount_in_factor_high,
                                            env_tip_min,
                                            env_tip_factor_low,
                                            env_tip_factor_median,
                                            env_tip_factor_high,
                                            env_tip_factor_ultra,
                                            max_sol_amount,
                                            is_submit_tx,
                                            on_debug,
                                            is_racing,
                                            env_acceptable_liquidity,
                                            take_profit_pcnt
                                        ).await;
                                    });
                                }
                                Some(UpdateOneof::Ping(_)) => {
                                    subscribe_tx
                                        .send(SubscribeRequest {
                                            ping: Some(SubscribeRequestPing { id: 1 }),
                                            ..Default::default()
                                        })
                                        .await?;
                                }
                                Some(UpdateOneof::Pong(_)) => {} // Ignore pong responses
                                _ => {
                                    log!(format!("Other update received: {:?}", msg) , "info");
                                }
                            }
                        }
                        Err(err) => {
                            log!(format!("Error: {:?}", err), "error");
                            error!("Error: {:?}", err);
                            self.is_connected = false;
                            ping_handle.abort(); // Cleanup ping task
                            Box::pin(self.reconnect(request.clone() , enermy_list)).await?;
                            return Ok(());
                        }
                    }
                }
                Some(_) = ping_receiver.recv() => {
                    // Send ping when requested by the ping task
                    if let Err(e) = subscribe_tx
                        .send(SubscribeRequest {
                            ping: Some(SubscribeRequestPing { id: 1 }),
                            ..Default::default()
                        })
                        .await
                    {
                        log!(format!("Failed to send ping: {:?}", e), "error");
                        error!("Failed to send ping: {:?}", e);
                        break;
                    }
                }
                else => break,
            }
        }

        ping_handle.abort(); // Cleanup ping task
        Ok(())
    }

    /// Attempts to reconnect when the connection is lost
    ///
    /// # Arguments
    /// * `request` - The original subscription request to reestablish the connection
    async fn reconnect(
        &mut self,
        request: SubscribeRequest,
        enermy_list: Vec<String>,
    ) -> Result<()> {
        if self.reconnect_attempts >= self.max_reconnect_attempts {
            log!("Max reconnection attempts reached", "error");
            return Ok(());
        }

        self.reconnect_attempts += 1;
        log!(
            format!("Reconnecting... Attempt {}", self.reconnect_attempts),
            "info"
        );

        let backoff = self.reconnect_interval * std::cmp::min(self.reconnect_attempts, 5);
        tokio::time::sleep(backoff).await;

        Box::pin(self.connect(request, enermy_list)).await
    }
}
