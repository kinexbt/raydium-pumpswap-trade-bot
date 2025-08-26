use std::str::FromStr;

use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_program,
};

use crate::RACE_PRO;

pub fn get_race_ix(payer: Pubkey, timestamp: u64) -> Instruction {
    // Program ID of the smart contract
    let program_id = Pubkey::from_str(RACE_PRO).expect("Invalid program ID");

    // Compute PDA for race_id
    let seed = b"race-identity-seed";
    let (race_id_pda, _) = Pubkey::find_program_address(&[seed, payer.as_ref()], &program_id);

    // Create the `race` instruction
    let instruction_discriminator: [u8; 8] = [25, 195, 19, 166, 162, 87, 210, 253]; // From JSON metadata

    let mut data = Vec::new();
    data.extend_from_slice(&instruction_discriminator); // Append the instruction discriminator
    data.extend_from_slice(&timestamp.to_le_bytes()); // Append the timestamp argument

    let instruction = Instruction::new_with_bytes(
        program_id,
        &data,
        vec![
            AccountMeta::new(race_id_pda, false), // race_id (PDA) - writable
            AccountMeta::new(payer, true),        // payer - writable & signer
            AccountMeta::new_readonly(system_program::ID, false), // system_program - readonly
        ],
    );

    instruction
}
