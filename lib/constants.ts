import { Route, TollCheckpoint, YellowConfig } from '@/types';

// Yellow Network Configuration
export const YELLOW_CONFIG: YellowConfig = {
  clearnodeWsUrl: process.env.NEXT_PUBLIC_CLEARNODE_WS_URL || 'wss://clearnet-sandbox.yellow.com/ws',
  chainId: 11155111, // Sepolia
  custodyAddress: '0x019B65A265EB3363822f2752141b3dF16131b262',
  adjudicatorAddress: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2',
  tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC on Sepolia
  challengeDuration: 3600, // 1 hour in seconds
};

// Toll Authority Address
// This is the address that receives toll payments
// For demo: You can use any valid address that has registered with Yellow Network
// In production: This would be the highway authority's wallet
// 
// To test with real transfers:
// 1. Create a second wallet in MetaMask
// 2. Get its address and put it here
// 3. Request faucet tokens for that address too
// 4. After toll payments, check that address's balance on Yellow Network
export const TOLL_AUTHORITY_ADDRESS = '0x948426aa46593681b609b896d6246eBA1C7e932D';

// Gas cost per transaction on Ethereum (estimated)
export const ESTIMATED_GAS_COST_USD = 2.50;

// Default session duration (30 days in milliseconds)
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// Animation timing for simulate mode
export const TOLL_ANIMATION_INTERVAL_MS = 2000;

// Pre-defined Routes
export const ROUTES: Route[] = [
  {
    routeId: 'boston-nyc',
    name: 'Boston → New York City',
    road: 'I-95 South',
    distance: 215,
    estimatedCost: 28.50,
    entryPoint: { lat: 42.3601, lng: -71.0589 },
    exitPoint: { lat: 40.7128, lng: -74.0060 },
    tolls: [
      { id: 'TOLL_01', name: 'Mass Pike - Boston', fee: 1.50, mile: 0, location: { lat: 42.3601, lng: -71.0589 } },
      { id: 'TOLL_02', name: 'Mass Pike - Worcester', fee: 2.00, mile: 45, location: { lat: 42.2626, lng: -71.8023 } },
      { id: 'TOLL_03', name: 'Mass Pike - Springfield', fee: 1.75, mile: 90, location: { lat: 42.1015, lng: -72.5898 } },
      { id: 'TOLL_04', name: 'CT Welcome', fee: 2.50, mile: 105, location: { lat: 42.0120, lng: -72.5790 } },
      { id: 'TOLL_05', name: 'Hartford Plaza', fee: 2.00, mile: 125, location: { lat: 41.7658, lng: -72.6734 } },
      { id: 'TOLL_06', name: 'New Haven Exit', fee: 2.25, mile: 155, location: { lat: 41.3083, lng: -72.9279 } },
      { id: 'TOLL_07', name: 'Bridgeport Plaza', fee: 1.75, mile: 170, location: { lat: 41.1792, lng: -73.1894 } },
      { id: 'TOLL_08', name: 'Stamford Gateway', fee: 2.50, mile: 185, location: { lat: 41.0534, lng: -73.5387 } },
      { id: 'TOLL_09', name: 'Greenwich Border', fee: 3.00, mile: 195, location: { lat: 41.0262, lng: -73.6282 } },
      { id: 'TOLL_10', name: 'Bronx Entry', fee: 3.50, mile: 200, location: { lat: 40.8448, lng: -73.8648 } },
      { id: 'TOLL_11', name: 'Triborough Bridge', fee: 4.00, mile: 208, location: { lat: 40.7841, lng: -73.9212 } },
      { id: 'TOLL_12', name: 'Manhattan Exit', fee: 1.75, mile: 215, location: { lat: 40.7128, lng: -74.0060 } },
    ],
  },
  {
    routeId: 'la-sf',
    name: 'Los Angeles → San Francisco',
    road: 'I-5 North',
    distance: 382,
    estimatedCost: 18.00,
    entryPoint: { lat: 34.0522, lng: -118.2437 },
    exitPoint: { lat: 37.7749, lng: -122.4194 },
    tolls: [
      { id: 'TOLL_LA_01', name: 'LA Metro Express', fee: 2.50, mile: 0, location: { lat: 34.0522, lng: -118.2437 } },
      { id: 'TOLL_LA_02', name: 'Grapevine Pass', fee: 1.50, mile: 60, location: { lat: 34.9592, lng: -118.8757 } },
      { id: 'TOLL_LA_03', name: 'Bakersfield Plaza', fee: 2.00, mile: 120, location: { lat: 35.3733, lng: -119.0187 } },
      { id: 'TOLL_LA_04', name: 'Central Valley', fee: 1.75, mile: 180, location: { lat: 36.7378, lng: -119.7871 } },
      { id: 'TOLL_LA_05', name: 'Modesto Exit', fee: 2.25, mile: 280, location: { lat: 37.6391, lng: -120.9969 } },
      { id: 'TOLL_LA_06', name: 'Bay Bridge Approach', fee: 4.00, mile: 360, location: { lat: 37.8199, lng: -122.3786 } },
      { id: 'TOLL_LA_07', name: 'SF Downtown', fee: 4.00, mile: 382, location: { lat: 37.7749, lng: -122.4194 } },
    ],
  },
  {
    routeId: 'chicago-detroit',
    name: 'Chicago → Detroit',
    road: 'I-94 East',
    distance: 283,
    estimatedCost: 15.25,
    entryPoint: { lat: 41.8781, lng: -87.6298 },
    exitPoint: { lat: 42.3314, lng: -83.0458 },
    tolls: [
      { id: 'TOLL_CHI_01', name: 'Chicago Skyway', fee: 3.00, mile: 0, location: { lat: 41.8781, lng: -87.6298 } },
      { id: 'TOLL_CHI_02', name: 'Indiana Welcome', fee: 2.50, mile: 25, location: { lat: 41.6734, lng: -87.5070 } },
      { id: 'TOLL_CHI_03', name: 'Gary Plaza', fee: 1.75, mile: 40, location: { lat: 41.5934, lng: -87.3465 } },
      { id: 'TOLL_CHI_04', name: 'South Bend Exit', fee: 2.00, mile: 90, location: { lat: 41.6764, lng: -86.2520 } },
      { id: 'TOLL_CHI_05', name: 'Kalamazoo Gate', fee: 2.00, mile: 160, location: { lat: 42.2917, lng: -85.5872 } },
      { id: 'TOLL_CHI_06', name: 'Ann Arbor Junction', fee: 2.25, mile: 230, location: { lat: 42.2808, lng: -83.7430 } },
      { id: 'TOLL_CHI_07', name: 'Detroit Entry', fee: 1.75, mile: 283, location: { lat: 42.3314, lng: -83.0458 } },
    ],
  },
];

// Pre-generated QR codes for toll booths (12 tolls for demo)
export const TOLL_QR_CODES: TollCheckpoint[] = ROUTES[0].tolls;

// Supported chains for wallet connection
export const SUPPORTED_CHAINS = [
  {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://1rpc.io/sepolia',
  },
  {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
  },
];

// Default deposit amount for demo
export const DEFAULT_DEPOSIT_AMOUNT = 100;

// Minimum balance warning threshold
export const LOW_BALANCE_THRESHOLD = 10;
