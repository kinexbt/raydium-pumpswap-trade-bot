use std::collections::HashMap;

pub const SYSTEM_PRO: &str = "11111111111111111111111111111111";
pub const NATIVE_MINT: &str = "So11111111111111111111111111111111111111112";
pub const ASSOCIATED_TOKEN_PRO: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
pub const TOKEN_PRO: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

pub const RAY_AMM_ID: &str = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
pub const PUMP_SWAP_ID: &str = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
pub const RACE_PRO: &str = "AQepcEVNGFvjbfMfJVJe5h6RcnSUCudishPYVJWqJWvf";

pub const RAY_AMM_AUTH: &str = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1";

pub const NOZOMI_TIP: [&str; 17] = [
    "TEMPaMeCRFAS9EKF53Jd6KpHxgL47uWLcpFArU1Fanq",
    "noz3jAjPiHuBPqiSPkkugaJDkJscPuRhYnSpbi8UvC4",
    "noz3str9KXfpKknefHji8L1mPgimezaiUyCHYMDv1GE",
    "noz6uoYCDijhu1V7cutCpwxNiSovEwLdRHPwmgCGDNo",
    "noz9EPNcT7WH6Sou3sr3GGjHQYVkN3DNirpbvDkv9YJ",
    "nozc5yT15LazbLTFVZzoNZCwjh3yUtW86LoUyqsBu4L",
    "nozFrhfnNGoyqwVuwPAW4aaGqempx4PU6g6D9CJMv7Z",
    "nozievPk7HyK1Rqy1MPJwVQ7qQg2QoJGyP71oeDwbsu",
    "noznbgwYnBLDHu8wcQVCEw6kDrXkPdKkydGJGNXGvL7",
    "nozNVWs5N8mgzuD3qigrCG2UoKxZttxzZ85pvAQVrbP",
    "nozpEGbwx4BcGp6pvEdAh1JoC2CQGZdU6HbNP1v2p6P",
    "nozrhjhkCr3zXT3BiT4WCodYCUFeQvcdUkM7MqhKqge",
    "nozrwQtWhEdrA6W8dkbt9gnUaMs52PdAv5byipnadq3",
    "nozUacTVWub3cL4mJmGCYjKZTnE9RbdY5AP46iQgbPJ",
    "nozWCyTPppJjRuw2fpzDhhWbW355fzosWSzrrMYB1Qk",
    "nozWNju6dY353eMkMqURqwQEoM3SFgEKC6psLCSfUne",
    "nozxNBgWohjR75vdspfxR5H9ceC7XXH99xpxhVGt3Bb",
];

pub const NEXT_FEE: [&str; 16] = [
    "NextbLoCkVtMGcV47JzewQdvBpLqT9TxQFozQkN98pE",
    "NexTbLoCkWykbLuB1NkjXgFWkX9oAtcoagQegygXXA2",
    "NeXTBLoCKs9F1y5PJS9CKrFNNLU1keHW71rfh7KgA1X",
    "NexTBLockJYZ7QD7p2byrUa6df8ndV2WSd8GkbWqfbb",
    "neXtBLock1LeC67jYd1QdAa32kbVeubsfPNTJC1V5At",
    "nEXTBLockYgngeRmRrjDV31mGSekVPqZoMGhQEZtPVG",
    "NEXTbLoCkB51HpLBLojQfpyVAMorm3zzKg7w9NFdqid",
    "nextBLoCkPMgmG8ZgJtABeScP35qLa2AMCNKntAP7Xc",
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
];

pub const JITO_TIP: [&str; 8] = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
];

pub const BLOX_TIP: [&str; 4] = [
    "HWEoBxYs7ssKuudEjzjmpfJVX7Dvi7wescFsVx2L5yoY",
    "95cfoy472fcQHaw4tPGBTKpn6ZQnfEPfBgDQx6gcRmRg",
    "3UQUKjhMKaY2S6bjcQD6yHB7utcZt5bfarRCmctpRtUd",
    "FogxVNs6Mm2w9rnGL1vkARSwJxvLE8mujTv3LK8RnUhF",
];

pub const ZSLOT_TIP: [&str; 16] = [
    "Eb2KpSC8uMt9GmzyAEm5Eb1AAAgTjRaXWFjKyFXHZxF3",
    "FCjUJZ1qozm1e8romw216qyfQMaaWKxWsuySnumVCCNe",
    "ENxTEjSQ1YabmUpXAdCgevnHQ9MHdLv8tzFiuiYJqa13",
    "6rYLG55Q9RpsPGvqdPNJs4z5WTxJVatMB8zV3WJhs5EK",
    "Cix2bHfqPcKcM233mzxbLk14kSggUUiz2A87fJtGivXr",
    "4HiwLEP2Bzqj3hM2ENxJuzhcPCdsafwiet3oGkMkuQY4",
    "TpdxgNJBWZRL8UXF5mrEsyWxDWx9HQexA9P1eTWQ42p",
    "6fQaVhYZA4w3MBSXjJ81Vf6W1EDYeUPXpgVQ6UQyU1Av",
    "7toBU3inhmrARGngC7z6SjyP85HgGMmCTEwGNRAcYnEK",
    "8mR3wB1nh4D6J9RUCugxUpc6ya8w38LPxZ3ZjcBhgzws",
    "6SiVU5WEwqfFapRuYCndomztEwDjvS5xgtEof3PLEGm9",
    "D8f3WkQu6dCF33cZxuAsrKHrGsqGP2yvAHf8mX6RXnwf",
    "GQPFicsy3P3NXxB5piJohoxACqTvWE9fKpLgdsMduoHE",
    "Ey2JEr8hDkgN8qKJGrLf2yFjRhW7rab99HVxwi5rcvJE",
    "4iUgjMT8q2hNZnLuhpqZ1QtiV8deFPy2ajvvjEpKKgsS",
    "3Rz8uD83QsU8wKvZbgWAPvCNDU6Fy8TSZTMcPm3RB6zt",
];

pub const PUMPSWAP_FEE: [&str; 8] = [
    "FWsW1xNtWscwNmKv6wVsU1iTzRN6wmmk3MjxRP5tT7hz",
    "G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP",
    "7hTckgnGnLQR6sdH7YkqFTAA7VwTfYFaZ6EhEsU3saCX",
    "9rPYyANsfQZw3DnDmKE3YCQF5E8oD89UXoHn9JFEhJUz",
    "7VtfL8fvgNfhz17qKRMjzQEXgbdpnHHHQRh54R9jP2RJ",
    "AVmoTthdrX6tKt4nDjco2D775W2YK3sDhxPcMmzUAmTY",
    "62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV",
    "JCRGumoE9Qi5BBgULTgdgTLjSgkCMSbF62ZZfGs84JeU",
];

pub const PROGRAM_ID: [(&str, &str); 25] = [
    ("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "Jupiter Aggregator v6"),
    ("JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB", "Jupiter Aggregator v4"),
    ("DCA265Vj8a9CEuX1eb1LWRnDT7uK6q1xMipnNyatn23M", "Jupiter DCA"),
    ("j1o2qRpjcyUwEvwtcfhEQefh773ZgjxcVRry7LDqg5X", "Jupiter Limit Order V2"),
    ("CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", "Raydium Concentrated Liquidity"),
    ("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", "Raydium CPMM"),
    ("5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h", "Raydium Liquidity Pool AMM"),
    ("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", "Raydium Liquidity Pool V4"),
    ("27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv", "Raydium Liquidity Pool V3"),
    ("RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr", "Raydium Liquidity Pool V2"),
    ("routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS", "Raydium AMM Routing"),
    ("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", "Orca Whirlpool"),
    ("9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP", "Orca Swap V2"),
    ("DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1", "Orca Swap V1"),
    ("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", "Meteora DLMM Program"),
    ("Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", "Meteora Pools Program"),
    ("PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY", "Phoenix"),
    ("2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c", "Lifinity Swap V2"),
    ("EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gjeoi8dy3S", "Lifinity Swap"),
    ("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ", "Saber Stable Swap"),
    ("DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB", "Saber Decimal Wrapper"),
    ("HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt", "Invariant Swap"),
    ("stkitrT1Uoy18Dk1fTrgPw8W6MVzoCfYoAFT4MLsmhq", "Sanctum Router"),
    ("5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx", "Sanctum S Controller"),
    ("opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb", "Openbook V2"),
];