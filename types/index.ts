// Session Types
export interface YellowSession {
  sessionId: string;
  channelId: string;
  userAddress: string;
  initialDeposit: number;
  currentBalance: number;
  startDate: string;
  endDate: string;
  status: 'connecting' | 'active' | 'closed' | 'error';
  tollsPaid: number;
  totalSpent: number;
  gasSaved: number;
}

// Toll Transaction Types
export interface TollTransaction {
  tollId: string;
  name: string;
  fee: number;
  timestamp: string;
  location: TollLocation;
  roadId: string;
  settled: boolean;
}

export interface TollLocation {
  lat: number;
  lng: number;
}

// Route Types for Simulate Mode
export interface TollCheckpoint {
  id: string;
  name: string;
  fee: number;
  mile: number;
  location: TollLocation;
}

export interface Route {
  routeId: string;
  name: string;
  road: string;
  distance: number;
  estimatedCost: number;
  tolls: TollCheckpoint[];
  entryPoint: TollLocation;
  exitPoint: TollLocation;
}

// QR Code Data
export interface TollQRData {
  tollId: string;
  name: string;
  fee: number;
  roadId: string;
  location: TollLocation;
}

// Dashboard Stats
export interface DashboardStats {
  totalTolls: number;
  totalSpent: number;
  totalDistance: number;
  gasSaved: number;
  avgTollCost: number;
}

// Monthly Summary
export interface MonthlySummary {
  month: string;
  year: number;
  totalTolls: number;
  totalSpent: number;
  totalDistance: number;
  gasSaved: number;
  traditionalCost: number;
  savings: number;
  transactions: TollTransaction[];
}

// Wallet Connection State
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: bigint | null;
}

// Yellow Network Types
export interface YellowConfig {
  clearnodeWsUrl: string;
  chainId: number;
  custodyAddress: string;
  adjudicatorAddress: string;
  tokenAddress: string;
  challengeDuration: number;
}

// Payment Result
export interface PaymentResult {
  success: boolean;
  transactionId: string;
  newBalance: number;
  timestamp: string;
  error?: string;
}

// Session Key Types
export interface SessionKeyInfo {
  publicKey: string;
  privateKey: string;
  expiresAt: number;
  allowances: TokenAllowance[];
}

export interface TokenAllowance {
  asset: string;
  amount: string;
}
