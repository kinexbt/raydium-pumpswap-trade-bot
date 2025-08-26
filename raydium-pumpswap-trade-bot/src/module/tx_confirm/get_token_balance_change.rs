use solana_transaction_status::{
    EncodedConfirmedTransactionWithStatusMeta, EncodedTransaction, UiInstruction, UiMessage,
    UiParsedInstruction,
};

use crate::{
    display_and_save_ui_balance_change, get_pre_post_ui_token_balance, log, PUMP_SWAP_ID,
    RAY_AMM_AUTH, RAY_AMM_ID,
};

pub fn get_ui_token_balance_change(transaction_meta: &EncodedConfirmedTransactionWithStatusMeta , is_buy : bool) {
    let encoded_transaction: &EncodedTransaction = &transaction_meta.transaction.transaction;

    if let EncodedTransaction::Json(transaction_message) = encoded_transaction {
        if let UiMessage::Parsed(message) = &transaction_message.message {
            for (_, instruction) in message.instructions.iter().enumerate() {
                if let UiInstruction::Parsed(ui_parsed_ix) = instruction {
                    if let UiParsedInstruction::PartiallyDecoded(partially_decoded_ix) =
                        ui_parsed_ix
                    {
                        if let Some(meta) = &transaction_meta.transaction.meta {
                            if partially_decoded_ix.program_id == RAY_AMM_ID {
                                let (ray_auth_pre_token_balance, ray_auth_post_token_balance) =
                                    get_pre_post_ui_token_balance(meta, RAY_AMM_AUTH);

                                display_and_save_ui_balance_change(
                                    &transaction_message.signatures[0].as_str(),
                                    partially_decoded_ix.accounts[1].as_str(),
                                    &ray_auth_pre_token_balance,
                                    &ray_auth_post_token_balance,
                                    RAY_AMM_AUTH,
                                    is_buy
                                );
                            } else if partially_decoded_ix.program_id == PUMP_SWAP_ID {
                                let pool_id = &partially_decoded_ix.accounts[0];

                                let (ray_auth_pre_token_balance, ray_auth_post_token_balance) =
                                    get_pre_post_ui_token_balance(meta, pool_id);

                                display_and_save_ui_balance_change(
                                    &transaction_message.signatures[0].as_str(),
                                    pool_id,
                                    &ray_auth_pre_token_balance,
                                    &ray_auth_post_token_balance,
                                    pool_id,
                                    is_buy
                                );
                            }
                        }
                    }
                }
            }
        } else {
            log!("No transaction message found.", "error");
        }
    }
}
