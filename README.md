# ClearLane - Blockchain Toll Payment System

**Yellow Network Bounty Submission | HackMoney 2026**

> "Pay tolls once a month, not once a mile"

## Overview

ClearLane is a blockchain-based toll payment system that uses Yellow Network's state channels to enable instant, gasless toll payments. Instead of paying $2+ in gas fees for every toll, users deposit once monthly, drive through unlimited tolls with zero gas fees, and settle everything in one final transaction.

## Problem

Blockchain toll payments are impossible today:
- Each toll requires a separate on-chain transaction
- Gas fees average $2+ per transaction on Ethereum
- A commuter passing 12 tolls pays $24 in gas to pay $36 in tolls

## Solution

ClearLane uses Yellow Network's Nitrolite protocol to:
1. Open a state channel with a single on-chain transaction
2. Process unlimited off-chain toll payments (instant, zero gas)
3. Close the channel with one final settlement transaction

## Market Opportunity

- **India FASTag**: 80M toll transactions daily
- **US toll roads**: 9B+ transactions annually
- **Current blockchain solution**: None

## Features

### Dual Payment Modes

**Live Scan Mode**
- Open phone camera
- Scan toll booth QR code
- Instant payment confirmation
- Balance updates immediately

**Simulate Drive Mode**
- Select preset route (e.g., "Boston → NYC via I-95")
- Click "Drive" button
- Car animates through route
- Auto-deducts at each toll checkpoint (every 2 seconds)
- Complete 12-toll journey in 30 seconds

### Real-Time Dashboard
- Large balance display with session info
- Live transaction feed
- Interactive route map visualization
- Gas savings calculator

### Monthly Settlement
- Total tolls passed
- Total distance traveled
- Total amount spent
- Gas fees saved comparison
- One-click session close
- Final on-chain settlement

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: Yellow Network SDK (@erc7824/nitrolite), viem
- **QR Scanning**: html5-qrcode
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
# Optional: Override default sandbox URL
NEXT_PUBLIC_CLEARNODE_WS_URL=wss://clearnet-sandbox.yellow.com/ws
```

## Project Structure

```
clearlane/
├── app/
│   ├── page.tsx                 # Setup screen (wallet + deposit)
│   ├── dashboard/page.tsx       # Main dashboard (dual modes + map)
│   ├── settlement/page.tsx      # Monthly report + close session
│   └── layout.tsx
├── components/
│   ├── ScanMode.tsx             # QR camera scanner
│   ├── SimulateMode.tsx         # Auto-drive animation
│   ├── BalanceDisplay.tsx       # Balance card with session info
│   ├── MapView.tsx              # Route map visualization
│   ├── TollFeed.tsx             # Recent transactions list
│   ├── ConnectWallet.tsx        # Wallet connection UI
│   └── MonthlyStats.tsx         # Analytics and charts
├── lib/
│   ├── yellowService.ts         # Yellow SDK wrapper
│   ├── tollCalculator.ts        # Toll rate calculations
│   └── constants.ts             # Routes, addresses, config
├── hooks/
│   ├── useYellowSession.ts      # Session state management
│   └── useTollPayment.ts        # Payment processing
└── types/
    └── index.ts                 # TypeScript interfaces
```

## Yellow Network Integration

### Session Open (On-Chain)
```typescript
await yellowSDK.openSession({
  deposit: 100,
  counterparty: TOLL_AUTHORITY_ADDRESS,
  duration: 30_DAYS
});
```

### Toll Payment (Off-Chain)
```typescript
await yellowSDK.transfer({
  amount: 2.50,
  recipient: TOLL_AUTHORITY_ADDRESS,
  metadata: { tollId: "TOLL_01" }
});
```

### Session Close (On-Chain)
```typescript
await yellowSDK.closeSession();
```

## Demo

### Quick Demo (90 seconds)

1. **Problem** (15s): "Blockchain can't do tolls - $2 gas per toll"
2. **Setup** (10s): "Opened session once - $100 deposit"
3. **Drive** (40s): Complete Boston → NYC route (12 tolls)
4. **Result** (15s): "12 tolls, zero gas fees"
5. **Settlement** (10s): "Month end: one final transaction"

## Routes Available

| Route | Distance | Tolls | Est. Cost |
|-------|----------|-------|-----------|
| Boston → NYC | 215 mi | 12 | $28.50 |
| LA → San Francisco | 382 mi | 7 | $18.00 |
| Chicago → Detroit | 283 mi | 7 | $15.25 |

## Gas Savings Calculator

| Tolls | Traditional (with gas) | ClearLane | Savings |
|-------|----------------------|-----------|---------|
| 12 | $58.50 ($30 fees + $28.50 tolls) | $28.50 | 51% |
| 30 | $146.25 | $71.25 | 51% |
| 100 | $487.50 | $237.50 | 51% |

## Security

- Funds locked in audited smart contracts
- State channel guarantees: cryptographically signed states
- Challenge period for dispute resolution
- Full fund recovery via on-chain contracts

## License

MIT

## Links

- [Yellow Network Docs](https://docs.yellow.org)
- [Nitrolite SDK](https://github.com/erc7824/nitrolite)
