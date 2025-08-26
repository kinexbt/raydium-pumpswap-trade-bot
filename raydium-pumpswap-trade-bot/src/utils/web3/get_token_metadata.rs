use mpl_token_metadata::accounts::Metadata;
use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;

pub async fn get_onchain_metadata(
    rpc_client: &RpcClient,
    mint: &Pubkey,
) -> Result<Option<Metadata>, Box<dyn std::error::Error>> {
    let metadata_pubkey = get_metadata_pubkey(mint);
    match rpc_client.get_account_data(&metadata_pubkey) {
        Ok(data) => {
            let metadata = Metadata::from_bytes(&data).unwrap();
            Ok(Some(metadata))
        }
        Err(_) => Ok(None),
    }
}

fn get_metadata_pubkey(mint: &Pubkey) -> Pubkey {
    let spl_metadata_pro = Pubkey::from_str_const(&spl_token_metadata::id().to_string());
    let metadata_seeds = &[
        "metadata".as_bytes(),
        spl_metadata_pro.as_ref(),
        mint.as_ref(),
    ];
    Pubkey::find_program_address(metadata_seeds, &spl_metadata_pro).0
}
