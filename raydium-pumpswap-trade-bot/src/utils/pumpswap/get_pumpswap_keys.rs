use solana_sdk::pubkey::Pubkey;
use yellowstone_grpc_proto::geyser::SubscribeUpdateTransactionInfo;

use crate::PUMP_SWAP_ID;

pub fn get_pumpswap_keys(transaction: &SubscribeUpdateTransactionInfo) -> Vec<Pubkey> {
    let mut extracted_keys: Vec<Pubkey> = Vec::new();

    if let Some(transaction_message) = &transaction.transaction {
        if let Some(message) = &transaction_message.message {
            for instruction in &message.instructions {
                if let Some(program_key) = message
                    .account_keys
                    .get(instruction.program_id_index as usize)
                {
                    if let Ok(pubkey) = Pubkey::try_from(program_key.as_slice()) {
                        if pubkey.to_string() == PUMP_SWAP_ID {
                            // Found a relevant transaction, now collect the account keys
                            for &account_idx in &instruction.accounts {
                                if let Some(key) = message.account_keys.get(account_idx as usize) {
                                    if let Ok(pubkey) = Pubkey::try_from(key.as_slice()) {
                                        extracted_keys.push(pubkey);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    extracted_keys
}
