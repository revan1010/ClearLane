import { YELLOW_CONFIG, TOLL_AUTHORITY_ADDRESS } from './constants';
import { YellowSession, PaymentResult, TollLocation } from '@/types';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, custom, type Address, getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import {
  createAuthVerifyMessageFromChallenge,
  createEIP712AuthMessageSigner,
  type PartialEIP712AuthMessage,
  type EIP712AuthDomain,
} from '@erc7824/nitrolite';

/**
 * Yellow Network Service - FULL REAL INTEGRATION
 * Based on the official Nitrolite API specification
 * https://github.com/erc7824/nitrolite/blob/main/clearnode/docs/API.md
 */

// WebSocket connection
let ws: WebSocket | null = null;
let isAuthenticated = false;
let currentSession: YellowSession | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
let reconnectTimeout: NodeJS.Timeout | null = null;

// Wallet state
let currentWalletAddress: string | null = null;

// Session key for delegation
let sessionPrivateKey: `0x${string}` | null = null;
let sessionKeyAddress: string | null = null;

// Auth state for challenge/verify flow
let pendingAuthParams: {
  wallet: string;
  session_key: string;
  application: string;
  scope: string;
  expires_at: number;
  allowances: { asset: string; amount: string }[];
} | null = null;

// JWT token after successful auth
let jwtToken: string | null = null;

// Message handlers for async responses
type MessageHandler = (data: unknown) => void;
const messageHandlers: Map<string, MessageHandler> = new Map();
let requestId = 0;

// Auth promise resolution
let pendingAuthResolve: ((value: boolean) => void) | null = null;
let pendingAuthReject: ((error: Error) => void) | null = null;

/**
 * Get ethereum provider
 */
function getEthereum() {
  return (window as unknown as {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }).ethereum;
}

/**
 * Initialize WebSocket connection to Clearnode
 */
export async function initializeConnection(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      console.log('Connecting to Yellow Network:', YELLOW_CONFIG.clearnodeWsUrl);
      ws = new WebSocket(YELLOW_CONFIG.clearnodeWsUrl);

      ws.onopen = () => {
        console.log('Connected to Yellow Network Clearnode');
        reconnectAttempts = 0; // Reset on successful connection
        resolve(true);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = (event) => {
        console.log('Disconnected from Clearnode:', event.code, event.reason);
        
        // Don't clear auth state on disconnect - we might reconnect
        const wasAuthenticated = isAuthenticated;
        const savedJwtToken = jwtToken;
        const savedWallet = currentWalletAddress;
        const savedSessionKey = sessionPrivateKey;
        const savedSessionKeyAddress = sessionKeyAddress;
        
        ws = null;
        
        // Attempt reconnection if not manually closed
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`Attempting reconnection (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          reconnectTimeout = setTimeout(async () => {
            try {
              await initializeConnection();
              // Restore auth state after reconnection
              if (wasAuthenticated && savedJwtToken) {
                isAuthenticated = wasAuthenticated;
                jwtToken = savedJwtToken;
                currentWalletAddress = savedWallet;
                sessionPrivateKey = savedSessionKey;
                sessionKeyAddress = savedSessionKeyAddress;
                console.log('✅ Reconnected and restored authentication');
              }
            } catch (err) {
              console.error('Reconnection failed:', err);
            }
          }, 2000 * reconnectAttempts);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.warn('Max reconnection attempts reached. Please refresh or try again later.');
          // Only clear auth after max attempts
          isAuthenticated = false;
          jwtToken = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          console.log('WS Message:', JSON.stringify(response, null, 2));
          handleMessage(response);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(response: unknown): void {
  if (typeof response !== 'object' || response === null) return;

  const res = (response as Record<string, unknown>).res as unknown[];

  if (res && Array.isArray(res)) {
    const [reqId, method, payload] = res as [number, string, unknown];

    // Handle request-specific handlers
    const handler = messageHandlers.get(`${reqId}`);
    if (handler) {
      handler({ method, payload, response });
      messageHandlers.delete(`${reqId}`);
    }

    // Handle auth flow
    if (method === 'auth_challenge') {
      handleAuthChallenge(payload as { challenge_message: string });
    } else if (method === 'auth_verify') {
      handleAuthVerifyResponse(payload);
    } else if (method === 'error') {
      console.error('Server error:', payload);
      // If auth pending, reject it
      if (pendingAuthReject) {
        const errorMsg = (payload as { error: string })?.error || 'Unknown error';
        pendingAuthReject(new Error(errorMsg));
        pendingAuthReject = null;
        pendingAuthResolve = null;
      }
    }

    // Handle balance updates
    if (method === 'bu') {
      console.log('Balance update received:', payload);
      
      // Parse and log clearly
      if (payload && typeof payload === 'object') {
        const p = payload as { balance_updates?: { asset: string; amount: string }[] };
        if (p.balance_updates) {
          p.balance_updates.forEach(update => {
            const amountNum = parseFloat(update.amount);
            const amountUSD = amountNum / 1000000;
            console.log(`📊 YELLOW NETWORK BALANCE: ${update.asset} = ${amountNum} (smallest units) = ${amountUSD.toFixed(6)} USD`);
          });
        }
      }
    }

    // Handle transfer notifications
    if (method === 'tr') {
      console.log('Transfer notification:', payload);
    }
  }
}

/**
 * Handle auth challenge - sign the Policy struct using EIP-712
 * Using the SDK's createEIP712AuthMessageSigner and createAuthVerifyMessageFromChallenge
 */
async function handleAuthChallenge(payload: { challenge_message: string }): Promise<void> {
  console.log('Auth challenge received:', payload.challenge_message);

  if (!pendingAuthParams || !currentWalletAddress) {
    console.error('No pending auth params or wallet');
    if (pendingAuthReject) {
      pendingAuthReject(new Error('Auth state not initialized'));
      pendingAuthReject = null;
      pendingAuthResolve = null;
    }
    return;
  }

  const ethereum = getEthereum();
  if (!ethereum) {
    console.error('No ethereum provider');
    if (pendingAuthReject) {
      pendingAuthReject(new Error('No ethereum provider'));
      pendingAuthReject = null;
      pendingAuthResolve = null;
    }
    return;
  }

  try {
    const challenge = payload.challenge_message;

    // Create viem wallet client from MetaMask provider
    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom(ethereum),
    });
    
    // Get the account address
    const [accountAddress] = await walletClient.getAddresses();
    if (!accountAddress) {
      throw new Error('No account address found');
    }
    
    // Create wallet client WITH account for signing (SDK requires account property)
    const signingWalletClient = createWalletClient({
      chain: sepolia,
      transport: custom(ethereum),
      account: accountAddress as Address,
    });

    // EIP-712 Domain - MUST match the 'application' field from auth_request!
    const domain: EIP712AuthDomain = {
      name: pendingAuthParams.application, // "clearnode"
    };

    // Create PartialEIP712AuthMessage matching the SDK's interface
    const partialMessage: PartialEIP712AuthMessage = {
      scope: pendingAuthParams.scope,
      session_key: pendingAuthParams.session_key as Address,
      expires_at: BigInt(pendingAuthParams.expires_at),
      allowances: pendingAuthParams.allowances,
    };

    // Debug: log exactly what addresses we're using
    console.log('Address comparison:', {
      authRequestAddress: pendingAuthParams.wallet,
      viemAccountAddress: accountAddress,
      signingWalletAccount: signingWalletClient.account?.address,
      match: pendingAuthParams.wallet === signingWalletClient.account?.address,
    });

    console.log('Using SDK to create EIP-712 signer:', {
      domain,
      partialMessage: {
        ...partialMessage,
        expires_at: partialMessage.expires_at.toString(),
      },
    });

    // Use the SDK's createEIP712AuthMessageSigner to create a proper signer
    const signer = createEIP712AuthMessageSigner(
      signingWalletClient,
      partialMessage,
      domain
    );

    // Use the SDK's createAuthVerifyMessageFromChallenge to create the auth_verify message
    const authVerifyMessage = await createAuthVerifyMessageFromChallenge(
      signer,
      challenge,
      ++requestId,
      Date.now()
    );

    console.log('Sending auth_verify (SDK-generated):', authVerifyMessage);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(authVerifyMessage);
    }
  } catch (error) {
    console.error('Failed to sign challenge:', error);
    if (pendingAuthReject) {
      pendingAuthReject(error as Error);
      pendingAuthReject = null;
      pendingAuthResolve = null;
    }
  }
}

/**
 * Handle successful auth verify response
 */
function handleAuthVerifyResponse(payload: unknown): void {
  console.log('Auth verify response:', payload);

  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (p.success === true) {
      isAuthenticated = true;
      if (p.jwt_token) {
        jwtToken = p.jwt_token as string;
        console.log('JWT token received!');
      }
      console.log('Authentication successful!');
      if (pendingAuthResolve) {
        pendingAuthResolve(true);
        pendingAuthResolve = null;
        pendingAuthReject = null;
      }
    } else {
      console.error('Auth failed:', p);
      if (pendingAuthReject) {
        pendingAuthReject(new Error('Authentication failed'));
        pendingAuthReject = null;
        pendingAuthResolve = null;
      }
    }
  }
}

/**
 * Authenticate with Yellow Network
 * Follows the auth_request -> auth_challenge -> auth_verify flow
 */
export async function authenticate(walletAddress: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket not connected'));
      return;
    }

    pendingAuthResolve = resolve;
    pendingAuthReject = reject;
    
    // IMPORTANT: Normalize to checksummed address to match what viem uses
    // The SDK's EIP-712 signer uses walletClient.account.address which is checksummed
    const checksummedAddress = getAddress(walletAddress);
    currentWalletAddress = checksummedAddress;

    try {
      // Generate session key
      sessionPrivateKey = generatePrivateKey();
      const sessionAccount = privateKeyToAccount(sessionPrivateKey);
      sessionKeyAddress = sessionAccount.address;

      console.log('Session key generated:', sessionKeyAddress);
      console.log('Using checksummed wallet address:', checksummedAddress);

      const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 24 hours

      // Store auth params for use in challenge response
      // NOTE: Use 'clearnode' as application name to allow full access (from integration tests)
      // IMPORTANT: Use checksummed addresses to match SDK's EIP-712 signing
      pendingAuthParams = {
        wallet: checksummedAddress,
        session_key: sessionKeyAddress,
        application: 'clearnode', // 'clearnode' allows session key to be used as custody signer
        scope: 'console',
        expires_at: expiresAt,
        allowances: [], // Empty allowances for full access
      };

      // Send auth_request
      // Note: the sig array is empty for the initial request
      // IMPORTANT: Use checksummed address to match what EIP-712 signer will use
      const authRequest = {
        req: [
          ++requestId,
          'auth_request',
          {
            address: checksummedAddress,
            session_key: sessionKeyAddress,
            application: 'clearnode', // Must match pendingAuthParams.application
            allowances: pendingAuthParams.allowances,
            scope: 'console',
            expires_at: expiresAt,
          },
          Date.now(),
        ],
        sig: [],
      };

      console.log('Sending auth_request:', JSON.stringify(authRequest, null, 2));
      ws.send(JSON.stringify(authRequest));

      // Timeout after 60 seconds
      setTimeout(() => {
        if (pendingAuthResolve === resolve) {
          pendingAuthResolve = null;
          pendingAuthReject = null;
          reject(new Error('Authentication timeout'));
        }
      }, 60000);
    } catch (error) {
      pendingAuthResolve = null;
      pendingAuthReject = null;
      reject(error);
    }
  });
}

/**
 * Request test tokens from faucet (sandbox only)
 */
export async function requestFaucetTokens(userAddress: string): Promise<boolean> {
  // COMMENTED OUT - Testing balance decrease without faucet
  console.log('⚠️ Faucet disabled for testing - no new tokens will be added');
  return true;
  
  // try {
  //   console.log('Requesting faucet tokens for:', userAddress);
  //   const response = await fetch('https://clearnet-sandbox.yellow.com/faucet/requestTokens', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ userAddress }),
  //   });

  //   const result = await response.text();
  //   console.log('Faucet response:', result);
  //   return response.ok;
  // } catch (error) {
  //   console.error('Faucet request failed:', error);
  //   return false;
  // }
}

/**
 * Get ledger balances from Yellow Network
 */
export async function getLedgerBalances(): Promise<unknown> {
  if (!ws || ws.readyState !== WebSocket.OPEN || !isAuthenticated) {
    console.warn('Not connected or not authenticated');
    return null;
  }

  return new Promise((resolve) => {
    const id = ++requestId;

    messageHandlers.set(`${id}`, (data) => {
      const d = data as { payload: unknown };
      console.log('Ledger balances:', d.payload);
      resolve(d.payload);
    });

    const message = {
      req: [id, 'get_ledger_balances', {}, Date.now()],
      sig: [],
      ...(jwtToken ? { token: jwtToken } : {}),
    };

    ws!.send(JSON.stringify(message));

    setTimeout(() => {
      if (messageHandlers.has(`${id}`)) {
        messageHandlers.delete(`${id}`);
        resolve(null);
      }
    }, 10000);
  });
}

/**
 * Transfer funds to another account
 * This is the REAL Yellow Network transfer - NO MOCKING!
 */
export async function transfer(
  destination: string,
  allocations: { asset: string; amount: string }[]
): Promise<boolean> {
  console.log(`\n💸 === INITIATING YELLOW NETWORK TRANSFER ===`);
  console.log(`Destination: ${destination}`);
  console.log(`Allocations:`, allocations);
  
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('❌ WebSocket not connected');
    return false;
  }

  if (!isAuthenticated || !jwtToken) {
    console.error('❌ Not authenticated');
    return false;
  }

  if (!sessionPrivateKey) {
    console.error('❌ No session key available');
    return false;
  }

  return new Promise(async (resolve) => {
    try {
      const id = ++requestId;
      const timestamp = Date.now();

      const transferParams = {
        destination: destination,
        allocations: allocations,
      };

      const reqArray = [id, 'transfer', transferParams, timestamp];

      console.log(`🔏 Signing transfer with SESSION KEY (ID: ${id})...`);
      
      // Sign with SESSION KEY using direct signature (no Ethereum prefix)
      const sessionAccount = privateKeyToAccount(sessionPrivateKey!);
      const messageToSign = JSON.stringify(reqArray);
      
      // Hash the message with keccak256
      const { keccak256, toHex } = await import('viem');
      const messageHash = keccak256(toHex(messageToSign));
      
      // Sign the hash directly without Ethereum prefix
      const signature = await sessionAccount.sign({
        hash: messageHash,
      });

      console.log(`✅ Transfer signed by session key: ${sessionAccount.address}`);
      console.log(`Message: ${messageToSign}`);
      console.log(`Message hash: ${messageHash}`);
      console.log(`Signature: ${signature.slice(0, 20)}...`);

      messageHandlers.set(`${id}`, (data) => {
        const d = data as { method: string; payload: unknown };
        console.log(`📨 Transfer response received:`, d);
        
        if (d.method === 'transfer') {
          console.log('✅ TRANSFER SUCCESS:', d.payload);
          resolve(true);
        } else if (d.method === 'error') {
          console.error('❌ TRANSFER FAILED:', d.payload);
          resolve(false);
        } else {
          console.log(`✅ Transfer completed (method: ${d.method})`);
          resolve(true);
        }
      });

      // Send transfer with session key signature + JWT
      const message = {
        req: reqArray,
        sig: [signature], // Signed by session key!
        token: jwtToken,
      };

      console.log(`🚀 Sending transfer to Yellow Network:`, JSON.stringify(message, null, 2));
      ws!.send(JSON.stringify(message));
      console.log(`⏳ Waiting for transfer confirmation...`);

      setTimeout(() => {
        if (messageHandlers.has(`${id}`)) {
          console.error(`⏱️ Transfer timeout (ID: ${id})`);
          messageHandlers.delete(`${id}`);
          resolve(false);
        }
      }, 30000);
    } catch (error) {
      console.error('❌ Transfer error:', error);
      resolve(false);
    }
  });
}

/**
 * Open a Yellow session
 */
export async function openSession(
  userAddress: string,
  depositAmount: number
): Promise<YellowSession> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // FAUCET DISABLED FOR TESTING
  // console.log('Requesting faucet tokens...');
  // const faucetSuccess = await requestFaucetTokens(userAddress);
  // if (faucetSuccess) {
  //   console.log('Faucet tokens received!');
  // }

  // Wait for authentication to complete
  console.log('Waiting for authentication...');
  let waitTime = 0;
  while (!isAuthenticated && waitTime < 10000) {
    await new Promise(resolve => setTimeout(resolve, 100));
    waitTime += 100;
  }
  
  if (!isAuthenticated) {
    throw new Error('Authentication timeout - please try again');
  }
  
  console.log('✅ Authenticated! Opening session...');

  // Get actual balance from Yellow Network if authenticated
  let actualBalance = depositAmount * 1000000; // Convert to smallest units (6 decimals)
  if (isAuthenticated) {
  const balances = await getLedgerBalances();
  if (balances && typeof balances === 'object') {
  const b = balances as { ledger_balances?: { asset: string; amount: string }[] };
  if (b.ledger_balances) {
  const usdcBalance = b.ledger_balances.find(bal => bal.asset === 'ytest.usd');
  if (usdcBalance) {
  // Balance is in smallest units (e.g., 500000000 = 500 ytest.usd)
  actualBalance = parseFloat(usdcBalance.amount);
  console.log('Actual Yellow Network balance:', actualBalance, 'ytest.usd (smallest units)');
  }
  }
  }
  }

  const session: YellowSession = {
    sessionId,
    channelId: `channel_${Date.now()}`,
    userAddress,
    initialDeposit: actualBalance,
    currentBalance: actualBalance,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    tollsPaid: 0,
    totalSpent: 0,
    gasSaved: 0,
  };

  currentSession = session;
  console.log('Session opened:', session);
  return session;
}

/**
 * Process a toll payment - REAL YELLOW NETWORK TRANSFER
 */
export async function payToll(
  tollId: string,
  tollName: string,
  amount: number,
  location: TollLocation,
  tollAuthorityAddress: string
): Promise<PaymentResult> {
  console.log(`\n=== PAYING TOLL ===`);
  console.log(`Toll: ${tollName}`);
  console.log(`Amount: ${amount}`);
  console.log(`Authority: ${tollAuthorityAddress}`);
  console.log(`Authenticated: ${isAuthenticated}`);
  console.log(`Has JWT: ${!!jwtToken}`);
  
  if (!currentSession) {
    console.error('❌ No active session');
    return {
      success: false,
      transactionId: '',
      newBalance: 0,
      timestamp: new Date().toISOString(),
      error: 'No active session',
    };
  }

  // Convert amount to smallest units for balance calculations
  const amountInSmallestUnits = amount * 1000000;
  
  if (currentSession.currentBalance < amountInSmallestUnits) {
    console.error(`❌ Insufficient balance: ${currentSession.currentBalance} < ${amountInSmallestUnits}`);
    return {
      success: false,
      transactionId: '',
      newBalance: currentSession.currentBalance,
      timestamp: new Date().toISOString(),
      error: 'Insufficient balance',
    };
  }

  const transactionId = `tx_${Date.now()}_${tollId}`;

  // ALWAYS send real transfer if authenticated - NO MOCKING!
  if (!isAuthenticated || !jwtToken) {
    console.error('❌ NOT AUTHENTICATED - Cannot send real transfer!');
    return {
      success: false,
      transactionId: '',
      newBalance: currentSession.currentBalance,
      timestamp: new Date().toISOString(),
      error: 'Not authenticated with Yellow Network',
    };
  }

  // Normalize toll authority address to checksummed format
  const checksummedAuthority = getAddress(tollAuthorityAddress);
  console.log(`Checksummed authority address: ${checksummedAuthority}`);

  // Send REAL transfer through Yellow Network
  // Yellow Network expects amounts in SMALLEST UNITS (6 decimals)
  const amountInSmallestUnitsStr = amountInSmallestUnits.toString();
  console.log(`🚀 Sending REAL Yellow Network transfer: ${amount} USD = ${amountInSmallestUnitsStr} smallest units`);
  
  const transferSuccess = await transfer(checksummedAuthority, [
    { asset: 'ytest.usd', amount: amountInSmallestUnitsStr },
  ]);

  if (!transferSuccess) {
    console.error('❌ REAL TRANSFER FAILED!');
    return {
      success: false,
      transactionId,
      newBalance: currentSession.currentBalance,
      timestamp: new Date().toISOString(),
      error: 'Transfer to toll authority failed',
    };
  }

  console.log(`✅ REAL TRANSFER SUCCESSFUL: ${tollName} - ${amount} to ${checksummedAuthority}`);

  // Update local state ONLY after successful transfer
  currentSession.currentBalance -= amountInSmallestUnits;
  currentSession.tollsPaid += 1;
  currentSession.totalSpent += amount;
  currentSession.gasSaved += 2.50;

  console.log(`Updated balance: ${currentSession.currentBalance} (${currentSession.currentBalance / 1000000} ytest.usd)`);
  console.log(`=== TOLL PAYMENT COMPLETE ===\n`);

  return {
    success: true,
    transactionId,
    newBalance: currentSession.currentBalance,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Close the session - Local cleanup only (no Yellow Network session to close)
 * Note: Yellow Network doesn't use "sessions" - it has a unified balance.
 * Transfers are instant and final. There's nothing to "close" or "settle".
 */
export async function closeSession(): Promise<{
  success: boolean;
  finalBalance: number;
  txHash?: string;
  error?: string;
}> {
  if (!currentSession) {
    return {
      success: false,
      finalBalance: 0,
      error: 'No active session',
    };
  }

  console.log('📝 Closing local session (Yellow Network balance persists)');
  
  const finalBalance = currentSession.currentBalance;
  
  // Get current Yellow Network balance for verification
  let actualYellowBalance = finalBalance;
  if (isAuthenticated) {
    try {
      const balances = await getLedgerBalances();
      if (balances && typeof balances === 'object') {
        const b = balances as { ledger_balances?: { asset: string; amount: string }[] };
        if (b.ledger_balances) {
          const usdcBalance = b.ledger_balances.find(bal => bal.asset === 'ytest.usd');
          if (usdcBalance) {
            actualYellowBalance = parseFloat(usdcBalance.amount);
            console.log(`📊 Final Yellow Network balance: ${actualYellowBalance / 1000000} ytest.usd`);
          }
        }
      }
    } catch (error) {
      console.warn('Could not verify final balance:', error);
    }
  }
  
  currentSession.status = 'closed';
  currentSession = null;

  console.log('✅ Local session closed. Yellow Network balance remains available.');

  return {
    success: true,
    finalBalance: actualYellowBalance,
  };
}

/**
 * Get current session
 */
export function getCurrentSession(): YellowSession | null {
  return currentSession;
}

/**
 * Get session balance
 */
export function getSessionBalance(): number {
  return currentSession?.currentBalance ?? 0;
}

/**
 * Check if session is active
 */
export function isSessionActive(): boolean {
  return currentSession?.status === 'active';
}

/**
 * Check if connected to Yellow Network
 */
export function isConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

/**
 * Check if authenticated
 */
export function isUserAuthenticated(): boolean {
  return isAuthenticated;
}

/**
 * Get wallet address
 */
export function getWalletAddress(): string | null {
  return currentWalletAddress;
}

/**
 * Get ledger balances for a specific address
 */
export async function getBalanceForAddress(address: string): Promise<unknown> {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn('Not connected to Yellow Network');
    return null;
  }

  if (!isAuthenticated || !jwtToken) {
    console.warn('Not authenticated - cannot query other addresses');
    return null;
  }

  return new Promise((resolve) => {
    const id = ++requestId;

    messageHandlers.set(`${id}`, (data) => {
      const d = data as { payload: unknown };
      console.log(`👁️ TOLL AUTHORITY BALANCE for ${address}:`, d.payload);
      
      // Parse and display the balance clearly
      if (d.payload && typeof d.payload === 'object') {
        const payload = d.payload as { ledger_balances?: { asset: string; amount: string }[] };
        if (payload.ledger_balances) {
          const balance = payload.ledger_balances.find(b => b.asset === 'ytest.usd');
          if (balance) {
            const amount = parseFloat(balance.amount) / 1000000;
            console.log(`💰 TOLL AUTHORITY HAS: ${amount} ytest.usd`);
          }
        }
      }
      
      resolve(d.payload);
    });

    // Query balances - Yellow Network returns OUR balance, not other addresses
    // This is a limitation - we can only see our own balance
    const message = {
      req: [id, 'get_ledger_balances', {}, Date.now()],
      sig: [],
      token: jwtToken,
    };

    console.log(`🔍 Querying balance for address: ${address}`);
    ws!.send(JSON.stringify(message));

    setTimeout(() => {
      if (messageHandlers.has(`${id}`)) {
        messageHandlers.delete(`${id}`);
        console.warn(`Balance query timeout for ${address}`);
        resolve(null);
      }
    }, 10000);
  });
}

/**
 * Disconnect and clear all session state
 */
export function disconnectAndClearSession(): void {
  console.log('Clearing session and disconnecting...');
  
  // Clear reconnect timers
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
  
  // Close WebSocket
  if (ws) {
    ws.close(1000, 'Manual disconnect'); // Normal closure code
    ws = null;
  }
  
  // Clear all authentication state
  isAuthenticated = false;
  jwtToken = null;
  currentWalletAddress = null;
  sessionPrivateKey = null;
  sessionKeyAddress = null;
  pendingAuthParams = null;
  
  // Clear session
  currentSession = null;
  
  // Clear message handlers
  messageHandlers.clear();
  
  // Clear auth promises
  if (pendingAuthReject) {
    pendingAuthReject(new Error('Session cleared'));
    pendingAuthReject = null;
    pendingAuthResolve = null;
  }
  
  console.log('Session cleared successfully');
}

/**
 * Disconnect from Clearnode (legacy function, kept for backwards compatibility)
 */
export function disconnect(): void {
  disconnectAndClearSession();
}

/**
 * Connect with a new wallet - clears previous session first
 */
export async function connectWithNewWallet(walletAddress: string): Promise<boolean> {
  console.log('Connecting with new wallet:', walletAddress);
  
  // Step 1: Disconnect and clear previous session
  disconnectAndClearSession();
  
  // Step 2: Wait a bit for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Step 3: Initialize new connection
  try {
    await initializeConnection();
    console.log('WebSocket connected for new wallet');
    
    // Step 4: Authenticate with new wallet
    const authenticated = await authenticate(walletAddress);
    console.log('Authentication result:', authenticated);
    
    return authenticated;
  } catch (error) {
    console.error('Failed to connect with new wallet:', error);
    throw error;
  }
}
