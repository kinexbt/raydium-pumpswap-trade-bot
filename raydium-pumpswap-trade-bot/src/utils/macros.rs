use std::fs::OpenOptions;
use std::io::Write;

use chrono::Local;

pub fn log_to_file(message: &str) {
    let filename = format!(
        "src/assets/logs/log_{}.txt",
        Local::now().format("%Y-%m-%d_%H")
    );

    let mut file = OpenOptions::new()
        .append(true)
        .create(true)
        .open(filename)
        .expect("Failed to open log file");

    writeln!(file, "{}", message).expect("Failed to write to log file");
}

/**
 * info
 * error
 * update
 * result
 * enermy
 * success
 */
#[macro_export]
macro_rules! log {
    ($msg:expr, $level:expr) => {{
        use chrono::Local;
        use colored::Colorize;

        let now = Local::now();
        let formatted_time = now.format("%Y-%m-%d %H:%M:%S").to_string();
        let millis = format!("{:03}", now.timestamp_subsec_millis()); // Always 3 digits
        let micros = format!("{:03}", now.timestamp_subsec_micros() % 1000); // Always 3 digits

        let timestamp = format!("{}.{} {}", formatted_time, millis, micros);

        let (level_str, level_display) = match $level {
            "info" => ("[ ℹ️ INFO ]", "[ INFO ]".green()),
            "error" => ("[ 🔴 ERROR ]", "[ ERROR ]".red()),
            "update" => ("[ ♻️ UPDATE ]", "[ UPDATE ]".bright_yellow()),
            "result" => ("[ 📈 RESULT ]", "[ RESULT ]".bright_magenta()),
            "success" => ("[ 🟢 SUCCESS ]", "[ SUCCESS ]".magenta()),
            "enermy" => ("[ 🟢 ENERMY ]", "[ ENERMY ]".purple()),
            _ => ("[ ❓ UNKNOWN ]", "[ UNKNOWN ]".white()), // Fallback case
        };

        let log_msg = format!("{} {} {}", timestamp.cyan(), level_display, $msg);
        let file_msg = format!("{} {} {}", timestamp, level_str, $msg);

        println!("{}", log_msg);
        $crate::macros::log_to_file(&file_msg); // Ensure $crate resolves correctly
    }};
}

#[macro_export]
macro_rules! scan {
    ($signature:expr, $level:expr) => {{
        let level_str = match $level {
            "solscan" => format!("https://solscan.io/tx/{}", $signature),
            "solana_fm" => format!("https://solana.fm/tx/{}", $signature),
            "solana_exp" => format!("https://explorer.solana.com/tx/{}", $signature),
            "solanabeach" => format!("https://solanabeach.io/transaction/{}", $signature),
            "xray" => format!("https://orb.helius.dev/tx/{}", $signature),
            _ => format!("Invalid level: {}", $signature), // Fallback case
        };

        level_str
    }};
}
