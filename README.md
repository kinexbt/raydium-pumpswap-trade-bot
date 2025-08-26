# 🚀 Raydium Pumpswap Trading Bot

[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)
[![Solana](https://img.shields.io/badge/Solana-2.2+-purple.svg)](https://solana.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/kinexbt/raydium-pumpswap-trade-bot)

> **⚡ High-Performance Solana Trading Bot for Raydium & PumpSwap DEXs**

A lightning-fast, Rust-powered trading bot designed to execute trades on Solana's most popular decentralized exchanges. Built with performance, reliability, and profitability in mind.

## 🌟 Features

- **🚀 Ultra-Fast Execution**: Built in Rust for maximum performance and minimal latency
- **🎯 Multi-DEX Support**: Simultaneously monitors Raydium and PumpSwap for optimal opportunities
- **⚡ Real-Time Monitoring**: GRPC-based transaction streaming for instant market reaction
- **🛡️ Smart Filtering**: Advanced blacklist and enemy list management
- **💰 Slippage Protection**: Configurable slippage tolerance and price impact analysis
- **📊 Comprehensive Logging**: Detailed transaction logs and performance metrics
- **🔐 Secure**: Private key management and transaction signing
- **📈 Price Oracle Integration**: Real-time price feeds for accurate decision making

## 🏗️ Architecture

```
src/
├── module/
│   ├── filter/          # Trading filters and validation
│   ├── handler/         # Transaction handling logic
│   ├── monitor/         # Account and transaction monitoring
│   └── tx_confirm/      # Transaction confirmation
├── utils/
│   ├── build_tx/        # Transaction building utilities
│   ├── fast_landing_api/ # MEV protection and fast execution
│   ├── pumpswap/        # PumpSwap integration
│   └── token/           # Token utilities and price impact
└── config/              # Configuration management
```

## 🚀 Quick Start

### Prerequisites

- **Rust 1.70+** - [Install Rust](https://rustup.rs/)
- **Solana CLI 2.2+** - [Install Solana](https://docs.solana.com/cli/install-solana-cli-tools)
- **Solana Wallet** with SOL for transaction fees

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kinexbt/raydium-pumpswap-trade-bot.git
   cd raydium-pumpswap-trade-bot
   ```

2. **Install dependencies**
   ```bash
   cargo build --release
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the bot**
   ```bash
   # Start the main trading bot
   make main
   
   # Or use cargo directly
   cargo run --bin main --release
   ```

## ⚙️ Configuration

Create a `.env` file with your configuration:

```env
# Solana RPC and GRPC endpoints
RPC_URL=https://mainnet.helius-rpc.com
GRPC_URL=https://mainnet.rpc.jito.wtf

# Your wallet private key (base58 encoded)
PRIVATE_KEY=your_private_key_here

# Trading parameters
SLIPPAGE_TOLERANCE=0.5
MAX_PRICE_IMPACT=2.0
```

## 🎯 Usage

### Main Trading Bot
```bash
# Start the main trading bot
make main
```

### Pre-start Setup
```bash
# Initialize pools and tokens
make pre
```

### Health Check
```bash
# Check bot connectivity
make ping
```

### Signature Verification
```bash
# Verify transaction signatures
make sig
```

## 🔧 Advanced Configuration

### Pool Configuration
Edit `src/assets/inputs/pool_addr.json` to configure trading pools:

```json
{
  "pools": [
    {
      "address": "pool_address_here",
      "token_a": "token_a_mint",
      "token_b": "token_b_mint",
      "fee": 0.25
    }
  ]
}
```

### Blacklist Management
Configure `src/assets/inputs/black_list.json` to exclude specific addresses:

```json
[
  "address_to_exclude_1",
  "address_to_exclude_2"
]
```

## 📊 Performance Features

- **⚡ Sub-second execution** for time-sensitive trades
- **🔄 Real-time market monitoring** via Solana GRPC streams
- **📈 MEV protection** through multiple RPC endpoints
- **💾 Efficient memory management** for 24/7 operation
- **🔍 Advanced transaction filtering** to avoid unwanted trades

## 🛡️ Security Features

- **🔐 Secure private key handling**
- **🛡️ Transaction validation and verification**
- **🚫 Blacklist and enemy list protection**
- **⚖️ Slippage and price impact safeguards**
- **📝 Comprehensive audit logging**

## 📈 Trading Strategies

The bot implements several advanced trading strategies:

1. **Arbitrage Detection**: Identify price differences between DEXs
2. **MEV Protection**: Fast execution to avoid front-running
3. **Slippage Management**: Dynamic slippage adjustment based on market conditions
4. **Risk Management**: Configurable stop-loss and position sizing

## 🔍 Monitoring & Logs

The bot provides comprehensive logging and monitoring:

- **Real-time transaction logs** in `src/assets/logs/`
- **Trade history** tracking for performance analysis
- **Account monitoring** for balance changes
- **Performance metrics** and execution statistics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Install development dependencies
cargo install cargo-watch

# Run with hot reload
cargo watch -x run --bin main
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**This software is for educational and research purposes only. Trading cryptocurrencies involves substantial risk and may result in the loss of your capital. Use at your own risk.**

- Past performance does not guarantee future results
- Always test with small amounts first
- Never invest more than you can afford to lose
- Consider consulting with a financial advisor

## 📞 Support

- **Twitter**: [Twitter](https://x.com/kinexbt)
- **Discord**: [Discord](https://discord.com/kinexbt)
- **Telegram**: [Telegram](https://telegram.com/kinexbt)

## 🙏 Acknowledgments

- **Solana Labs** for the amazing blockchain platform
- **Raydium** for the DEX infrastructure
- **PumpSwap** for additional trading opportunities
- **Rust Community** for the excellent language and ecosystem

---

<div align="center">

**⭐ If this project helps you, please give it a star! ⭐**

Made with ❤️ by the Solana Trading Community

</div>
