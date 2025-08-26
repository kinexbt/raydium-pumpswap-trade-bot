use pyth_hermes_client::{EncodingType, PythClient};
use reqwest::Url;

pub async fn get_sol_price() -> Result<Option<f64>, Box<dyn std::error::Error>> {
    let url = Url::parse("https://hermes.pyth.network")?;

    let client = PythClient::new(url); // Ensure this is async

    let price_ids =
        vec!["0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d".to_string()];

    let price_update = client
        .latest_price_update(price_ids, Some(EncodingType::Base64), Some(true))
        .await?;

    if let Some(price_updates) = price_update.parsed {
        if let Some(update) = price_updates.first() {
            let price = update.price.price as f64 * 10f64.powi(update.price.expo);
            return Ok(Some(price));
        }
    }

    Ok(None)
}
