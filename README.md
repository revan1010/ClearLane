# ClearLane - Instant Blockchain Toll Payments

**Yellow Network Bounty Submission | HackMoney 2026**

> "Pay tolls instantly, not expensively"

## Overview

ClearLane is a blockchain-based toll payment system that uses Yellow Network's off-chain infrastructure to enable instant, gasless toll payments. Instead of paying $2+ in gas fees for every toll, drivers authenticate once with Yellow Network and process unlimited toll payments with zero gas fees and sub-second finality.

## Problem

Blockchain toll payments are economically impossible today:
- Each toll requires a separate on-chain transaction
- Gas fees average $2+ per transaction on Ethereum
- A commuter passing 12 tolls pays $24+ in gas to pay $36 in tolls
- Makes crypto payments impractical for everyday micropayments

## Solution

ClearLane uses Yellow Network's Clearnode to process instant off-chain toll payments:
1. **One-time setup**: Connect wallet and authenticate with Yellow Network
2. **Unlimited tolls**: Each payment is an instant off-chain transfer (zero gas)
3. **Real-time settlement**: Payments finalize in <100ms with cryptographic security

## Market Opportunity

- **US toll market**: $18B annually, 47M daily transactions
- **India toll market**: $9B annually, 4B+ annual transactions  
- **Current blockchain solution**: None (gas fees make it impossible)
- **ClearLane advantage**: Zero gas fees unlock crypto for high-frequency micropayments

## Features

### For Drivers

**Simulate Drive Mode**
- Select preset routes (Boston → NYC, LA → SF, Chicago → Detroit)
- Automated route simulation with real Yellow Network payments
- Watch real-time balance updates as tolls are processed
- Complete 12-toll journey with instant settlements

**My QR Code**
- Generate unique windshield pass linked to your wallet
- Download high-resolution QR code for printing
- Display on windshield for automated scanning
- Like E-ZPass, but crypto-powered

### For Toll Booth Operators (Demo Portal)

**Toll Booth Scanner**
- Camera scanning support (html5-qrcode)
- Image upload option (jsqr)
- Visualizes how automated toll collection would work
- Demonstrates QR-based payment triggering

### Real-Time Dashboard
- Live balance display with Yellow Network integration
- Transaction feed showing each toll payment
- Interactive route map visualization
- Gas savings calculator
- Toll authority payment destination info

## Tech Stack

**Frontend:**
- Next.js 14 + TypeScript
- TailwindCSS for styling
- MetaMask integration via Viem
- QR code generation (qrcode.react)
- QR code scanning (html5-qrcode, jsqr)
- Lucide React icons

**Yellow Network Integration:**
- @erc7824/nitrolite SDK
- WebSocket RPC (wss://clearnet-sandbox.yellow.com/ws)
- EIP-712 authentication
- Session key delegation
- Real-time balance updates

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Yellow Network testnet tokens (ytest.usd)

### Installation

```bash
# Clone repository
git clone https://github.com/revan1010/ClearLane.git
cd ClearLane

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Get Test Tokens

1. Visit [apps.yellow.com](https://apps.yellow.com)
2. Create a channel with Yellow Network
3. Request ytest.usd tokens from the faucet
4. Use these tokens in ClearLane

### Environment Variables

Create a `.env.local` file (optional):

```env
# Yellow Network Clearnode WebSocket URL (defaults to sandbox)
NEXT_PUBLIC_CLEARNODE_WS_URL=wss://clearnet-sandbox.yellow.com/ws
```

## How It Works

### Architecture

```
DRIVER APP                    YELLOW NETWORK              TOLL BOOTH
──────────                    ──────────────              ──────────
1. Connect Wallet       →     1. Authenticate        
2. Generate QR Code           2. Create Session
3. Display on Car       →                           →    3. Scan QR Code
4. Drive Through        →     4. Process Payment     ←    4. Trigger Charge
5. Balance Updates      ←     5. Update Ledger       
```

### Payment Flow

1. **Authentication**: Driver connects MetaMask → App authenticates with Yellow Network using EIP-712 signatures
2. **Session Keys**: App generates session key for delegated signing → Enables gasless payments
3. **QR Code**: Driver gets unique QR code with wallet address → Displays on windshield
4. **Toll Payment**: Toll booth scans QR → Yellow Network processes instant off-chain transfer
5. **Real-time Updates**: WebSocket messages update driver's balance immediately

## Yellow Network Integration Details

### Authentication Flow
```typescript
// 1. Request authentication
auth_request → (wallet, session_key, application, expires_at)

// 2. Sign challenge with EIP-712
auth_challenge → Sign with wallet → auth_verify

// 3. Receive JWT token
auth_success → JWT token for session
```

### Transfer Execution
```typescript
// Each toll payment
transfer(destination, [{
  asset: 'ytest.usd',
  amount: '1500000'  // $1.50 in smallest units (6 decimals)
}])

// Signed with session key + JWT authentication
// Processes on Yellow Network's off-chain ledger
```

### Real-time Balance Updates
```typescript
// WebSocket message handler
onMessage('bu') → balance_updates → {
  asset: 'ytest.usd',
  amount: '565500000'  // Updated balance
}
```

## Project Structure

```
clearlane/
├── app/
│   ├── page.tsx                 # Landing + wallet connection
│   ├── dashboard/page.tsx       # Main dashboard with simulate mode
│   ├── my-qr-code/page.tsx      # Driver's windshield QR code
│   ├── qr-generator/page.tsx    # Toll booth scanner (demo)
│   ├── settlement/page.tsx      # Session summary
│   └── layout.tsx
├── components/
│   ├── BalanceDisplay.tsx       # Real-time balance from Yellow Network
│   ├── TollFeed.tsx             # Transaction history
│   ├── MapView.tsx              # Route visualization
│   ├── SimulateMode.tsx         # Automated driving simulation
│   ├── TollAuthorityBalance.tsx # Payment destination info
│   └── ConnectWallet.tsx        # MetaMask connection
├── lib/
│   ├── yellowService.ts         # Yellow Network Clearnode integration
│   ├── tollCalculator.ts        # Route and toll calculations
│   └── constants.ts             # Routes, addresses, config
├── hooks/
│   ├── useYellowSession.ts      # Session state management
│   └── useTollPayment.ts        # Payment processing logic
└── types/
    └── index.ts                 # TypeScript interfaces
```

## Routes Available

| Route | Distance | Tolls | Est. Cost |
|-------|----------|-------|-----------|
| Boston → NYC (I-95) | 215 mi | 12 | $28.50 |
| LA → SF (I-5) | 382 mi | 7 | $18.00 |
| Chicago → Detroit (I-94) | 283 mi | 7 | $15.25 |

## Technical Challenges Solved

**Amount Formatting:**
- Yellow Network uses smallest units (6 decimal precision)
- Had to convert $1.50 → "1500000" (not "1.5")
- Implemented proper USD-to-smallest-units conversion pipeline

**Wallet Switching:**
- MetaMask account changes weren't clearing authentication state
- Implemented comprehensive session cleanup on wallet change
- Prevents authentication conflicts between different accounts

**WebSocket Reconnection:**
- Built automatic reconnection with exponential backoff
- Preserves authentication state across disconnects
- Graceful degradation when connection drops

**Session Key Management:**
- Session keys enable gasless transactions (no wallet popups)
- Proper key generation and secure storage
- Signature verification for each transfer

## Gas Savings Comparison

| Scenario | Traditional Blockchain | ClearLane (Yellow Network) | Savings |
|----------|----------------------|---------------------------|---------|
| 12 tolls (Boston→NYC) | $58.50 ($30 gas + $28.50 tolls) | $28.50 (zero gas) | **$30.00** |
| 30 tolls (monthly commuter) | $146.25 ($75 gas + $71.25 tolls) | $71.25 (zero gas) | **$75.00** |
| 100 tolls (commercial driver) | $487.50 ($250 gas + $237.50 tolls) | $237.50 (zero gas) | **$250.00** |

## Demo

🔗 **Live Demo**: [Your Vercel URL]

### Try It Yourself:

1. Get ytest.usd tokens from [Yellow Network's faucet](https://apps.yellow.com)
2. Connect your MetaMask wallet
3. Open a Yellow Network session
4. Try the simulate drive to see real Yellow Network transfers!
5. Watch the console to see WebSocket messages and balance updates

## How Yellow Network Integration Works

### What's Real:
✅ **Simulate Drive**: Processes actual Yellow Network transfers with real balance changes
✅ **Authentication**: Real EIP-712 signatures and JWT tokens
✅ **WebSocket Connection**: Live connection to Yellow Network's Clearnode
✅ **Balance Updates**: Real-time updates from Yellow Network's off-chain ledger

### What's Demo/Visualization:
🎨 **Toll Booth Scanner**: Demonstrates how automated scanning would work in production
🎨 **QR Code System**: Shows the user experience for windshield-based payments

### Technical Implementation:

**WebSocket Connection:**
```typescript
const ws = new WebSocket('wss://clearnet-sandbox.yellow.com/ws');
```

**Authentication (EIP-712):**
```typescript
// Sign challenge with wallet
const signature = await createEIP712AuthMessageSigner(
  walletClient,
  partialMessage,
  domain
);
```

**Payment Transfer:**
```typescript
// Send transfer to Yellow Network
ws.send(JSON.stringify({
  req: [id, 'transfer', {
    destination: tollAuthorityAddress,
    allocations: [{ 
      asset: 'ytest.usd', 
      amount: '1500000' // $1.50 in smallest units
    }]
  }, timestamp],
  sig: [sessionKeySignature],
  token: jwtToken
}));
```

## Future Scope

**Production Ready:**
- Full state channel lifecycle with on-chain deposits via Custody contracts
- Mainnet deployment with real USDC on Ethereum/Base
- Automated camera scanners for real-time QR reading at toll booths
- Fleet management dashboard for commercial vehicles

**Feature Expansion:**
- Geolocation-based automatic toll detection (no QR scanning needed)
- Multi-token support (ETH, USDC, DAI)
- Monthly receipts and tax reporting
- E-ZPass/FASTag API integration for existing infrastructure

**Market Extension:**
- Parking meter payments
- EV charging station micropayments
- Public transit fare collection
- Supply chain milestone settlements

## Why Yellow Network?

- ⚡ **Instant finality**: <100ms settlement vs 15+ seconds on-chain
- 💰 **Zero gas fees**: Off-chain transfers cost nothing
- 🔐 **Cryptographic security**: EIP-712 signatures + session keys
- 🌐 **Real-time updates**: WebSocket-based bidirectional communication
- 📈 **Scalable**: Handles high-frequency micropayments that are impossible on-chain

## Contributing

This is a hackathon project built for HackMoney 2026. Contributions, issues, and feature requests are welcome!

## License

MIT

## Acknowledgments

- Built with [Yellow Network SDK](https://docs.yellow.org)
- Inspired by E-ZPass and FASTag toll systems
- Created for HackMoney 2026 Hackathon

---

**ClearLane** - Making crypto payments practical for everyday infrastructure
