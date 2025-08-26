use {
    crate::log,
    anyhow::Result,
    futures::{sink::SinkExt, stream::StreamExt},
    hex,
    log::error,
    solana_sdk::pubkey::Pubkey,
    std::{sync::Arc, time::Duration},
    tokio::sync::Mutex,
    tonic::{metadata::errors::InvalidMetadataValue, transport::Endpoint},
    tonic_health::pb::health_client::HealthClient,
    yellowstone_grpc_client::{GeyserGrpcClient, InterceptorXToken},
    yellowstone_grpc_proto::{
        geyser::{geyser_client::GeyserClient, subscribe_update::UpdateOneof, SubscribeRequest},
        prelude::SubscribeRequestPing,
    },
};

/// Manager for handling gRPC stream connections and account updates
pub struct GrpcAccountStreamManager {
    client: GeyserGrpcClient<InterceptorXToken>,
    is_connected: bool,
    reconnect_attempts: u32,
    max_reconnect_attempts: u32,
    reconnect_interval: Duration,
}

impl GrpcAccountStreamManager {
    /// Handles account update messages from the gRPC stream
    /// This function can be customized based on your requirements:
    /// - Store updates in a database
    /// - Trigger specific actions based on account changes
    /// - Filter for specific types of updates
    /// - Transform data into your required format
    ///
    /// # Arguments
    /// * `slot` - The slot number when the update occurred
    /// * `account_info` - The account information containing all update details
    fn handle_account_update(
        &self,
        slot: u64,
        account_info: &yellowstone_grpc_proto::geyser::SubscribeUpdateAccountInfo,
    ) {
        println!(
            "ACCOUNT UPDATE RECEIVED:\nSlot: {}\nPubkey: {}\nLamports: {}\nOwner: {}\nData length: {}\nExecutable: {}\nWrite version: {}\n",
            slot,
            Pubkey::try_from(account_info.pubkey.clone()).expect("valid pubkey"),
            account_info.lamports,
            Pubkey::try_from(account_info.owner.clone()).expect("valid pubkey"),
            account_info.data.len(),
            account_info.executable,
            account_info.write_version
        );
        if !account_info.data.is_empty() {
            println!("Data (hex): {}", hex::encode(&account_info.data));
        }
    }

    /// Creates a new GrpcAccountStreamManager instance
    ///
    /// # Arguments
    /// * `endpoint` - The gRPC endpoint URL
    /// * `x_token` - Authentication token for the endpoint
    pub async fn new(
        endpoint: &str,
        x_token: &str,
    ) -> Result<Arc<Mutex<GrpcAccountStreamManager>>> {
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

        Ok(Arc::new(Mutex::new(GrpcAccountStreamManager {
            client,
            is_connected: false,
            reconnect_attempts: 0,
            max_reconnect_attempts: 10,
            reconnect_interval: Duration::from_secs(5),
        })))
    }

    /// Establishes connection and handles the subscription stream
    ///
    /// # Arguments
    /// * `request` - The subscription request containing account filters and other parameters
    pub async fn connect(&mut self, request: SubscribeRequest) -> Result<()> {
        let request = request.clone();
        let (mut subscribe_tx, mut stream) = self
            .client
            .subscribe_with_request(Some(request.clone()))
            .await?;

        self.is_connected = true;
        self.reconnect_attempts = 0;

        while let Some(message) = stream.next().await {
            match message {
                Ok(msg) => {
                    match msg.update_oneof {
                        Some(UpdateOneof::Account(account)) => {
                            if let Some(account_info) = account.account {
                                self.handle_account_update(account.slot, &account_info);
                            }
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
                            println!("Other update received: {:?}", msg);
                        }
                    }
                }
                Err(err) => {
                    log!(format!("Error: {:?}", err), "error");
                    error!("Error: {:?}", err);
                    self.is_connected = false;
                    Box::pin(self.reconnect(request.clone())).await?;
                    break;
                }
            }
        }

        Ok(())
    }

    /// Attempts to reconnect when the connection is lost
    ///
    /// # Arguments
    /// * `request` - The original subscription request to reestablish the connection
    async fn reconnect(&mut self, request: SubscribeRequest) -> Result<()> {
        if self.reconnect_attempts >= self.max_reconnect_attempts {
            println!("Max reconnection attempts reached");
            return Ok(());
        }

        self.reconnect_attempts += 1;
        println!("Reconnecting... Attempt {}", self.reconnect_attempts);

        let backoff = self.reconnect_interval * std::cmp::min(self.reconnect_attempts, 5);
        tokio::time::sleep(backoff).await;

        Box::pin(self.connect(request)).await
    }
}
