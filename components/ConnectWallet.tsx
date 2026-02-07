'use client';

import { useState, useEffect } from 'react';
import { Wallet, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { disconnectAndClearSession, connectWithNewWallet, requestFaucetTokens } from '@/lib/yellowService';

interface ConnectWalletProps {
  onConnect: (address: string) => void;
  isConnecting?: boolean;
}

export default function ConnectWallet({ onConnect, isConnecting = false }: ConnectWalletProps) {
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [authWarning, setAuthWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for account changes in MetaMask
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ethereum = (window as unknown as { 
      ethereum?: { 
        on?: (event: string, handler: (accounts: string[]) => void) => void;
        removeListener?: (event: string, handler: (accounts: string[]) => void) => void;
      } 
    }).ethereum;

    if (!ethereum?.on) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log('MetaMask accounts changed:', accounts);
      
      if (accounts.length === 0) {
        // User disconnected wallet
        console.log('Wallet disconnected');
        disconnectAndClearSession();
        setAddress(null);
        setStatus('');
        setError('Wallet disconnected. Please reconnect.');
      } else if (address && accounts[0] !== address) {
        // User switched to a different account
        console.log('Switched from', address, 'to', accounts[0]);
        setStatus('Wallet changed, reconnecting...');
        setError(null);
        setAuthWarning(null);
        
        // Clear old session and reconnect
        disconnectAndClearSession();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const newAddress = accounts[0];
        setAddress(newAddress);
        setIsLoading(true);
        
        try {
          // Request faucet tokens
          setStatus('Requesting test tokens...');
          await requestFaucetTokens(newAddress);
          
          // Connect with new wallet
          setStatus('Connecting and authenticating...');
          await connectWithNewWallet(newAddress);
          setStatus('Connected with new wallet!');
          
          // Notify parent component
          await new Promise(resolve => setTimeout(resolve, 500));
          onConnect(newAddress);
        } catch (err) {
          console.error('Failed to reconnect with new wallet:', err);
          setError('Failed to connect with new wallet. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [address, onConnect]);

  const connectMetaMask = async () => {
    setError(null);
    setIsLoading(true);
    setAuthWarning(null);
    setStatus('Connecting wallet...');

    if (typeof window === 'undefined' || !(window as unknown as { ethereum?: unknown }).ethereum) {
      setError('MetaMask not detected. Please install MetaMask extension.');
      setIsLoading(false);
      return;
    }

    try {
      const ethereum = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      if (!accounts || accounts.length === 0) {
        setError('No accounts found. Please unlock MetaMask.');
        setIsLoading(false);
        return;
      }

      const walletAddress = accounts[0];
      
      // Check if this is a different wallet
      if (address && address !== walletAddress) {
        console.log('Different wallet detected, clearing old session');
        setStatus('Clearing previous session...');
        disconnectAndClearSession();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setAddress(walletAddress);
      setStatus('Connecting to Yellow Network...');

      // Request faucet tokens first
      setStatus('Requesting test tokens...');
      try {
        const faucetSuccess = await requestFaucetTokens(walletAddress);
        if (faucetSuccess) {
          setStatus('Test tokens received!');
        } else {
          setStatus('Faucet unavailable, continuing...');
        }
      } catch (faucetError) {
        console.warn('Faucet error:', faucetError);
      }

      // Connect and authenticate with new wallet
      try {
        setStatus('Connecting and authenticating...');
        await connectWithNewWallet(walletAddress);
        setStatus('Authenticated!');
      } catch (authError) {
        console.warn('Auth error (continuing in demo mode):', authError);
        setStatus('Using hybrid mode (faucet working)');
        setAuthWarning('Authentication with Yellow Network Clearnode had an SDK version issue. Continuing in hybrid mode - faucet tokens received, transfers will be tracked locally for demo.');
      }

      // Success - proceed
      setStatus('Ready!');
      await new Promise(resolve => setTimeout(resolve, 500));
      onConnect(walletAddress);
    } catch (err) {
      console.error('Connection error:', err);
      if ((err as { code?: number }).code === 4001) {
        setError('Connection rejected. Please approve the connection request.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const connectDemo = async () => {
    setIsLoading(true);
    setStatus('Setting up demo mode...');
    
    // Demo mode with a simulated address
    const demoAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    
    // Clear previous session if exists
    if (address) {
      disconnectAndClearSession();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setAddress(demoAddress);

    // Request faucet tokens for demo address
    setStatus('Requesting test tokens...');
    try {
      await requestFaucetTokens(demoAddress);
      setStatus('Test tokens received!');
    } catch (error) {
      console.warn('Faucet error:', error);
    }

    // Try to connect to Yellow Network
    try {
      setStatus('Connecting to Yellow Network...');
      await connectWithNewWallet(demoAddress);
      setStatus('Ready!');
    } catch (error) {
      console.warn('Demo mode - Yellow Network connection optional:', error);
      setStatus('Using offline demo mode');
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    onConnect(demoAddress);
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Connect Your Wallet</h2>
          <p className="text-gray-500 mt-2">
            Connect to Yellow Network Sandbox (Testnet)
          </p>
        </div>

        {/* Status */}
        {status && !error && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-sm text-blue-700">{status}</p>
            </div>
          </div>
        )}

        {/* Connected State */}
        {address && !isLoading && !error && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                <p className="text-xs text-green-600 font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* Auth Warning State */}
        {authWarning && !error && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">Hybrid Mode Active</p>
                <p className="text-xs text-yellow-700">{authWarning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connect Buttons */}
        <div className="space-y-3">
          <button
            onClick={connectMetaMask}
            disabled={isConnecting || isLoading || !!address}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 35 33" fill="none">
                  <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726" />
                  <path d="M2.04883 1L15.0617 10.809L12.7337 4.99098L2.04883 1Z" fill="#E27625" />
                  <path d="M28.2295 23.5334L24.7346 29.1333L32.2175 31.1999L34.3739 23.6499L28.2295 23.5334Z" fill="#E27625" />
                  <path d="M0.640625 23.6499L2.78538 31.1999L10.2683 29.1333L6.77344 23.5334L0.640625 23.6499Z" fill="#E27625" />
                </svg>
                Connect MetaMask
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={connectDemo}
            disabled={isConnecting || isLoading || !!address}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Try Demo Mode
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Yellow Network Sandbox</p>
              <p className="text-yellow-700 text-xs mt-1">
                Uses test tokens (ytest.USD) on Sepolia testnet. Free tokens from faucet!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-gray-400 mt-6">
          Connecting to: wss://clearnet-sandbox.yellow.com
        </p>
      </div>
    </div>
  );
}
