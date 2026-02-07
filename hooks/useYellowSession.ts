'use client';

import { useState, useCallback, useEffect } from 'react';
import { YellowSession, TollTransaction } from '@/types';
import {
  openSession,
  closeSession,
  getCurrentSession,
  isConnected,
  isUserAuthenticated,
  initializeConnection,
  requestFaucetTokens,
} from '@/lib/yellowService';
import { DEFAULT_DEPOSIT_AMOUNT } from '@/lib/constants';

interface UseYellowSessionReturn {
  session: YellowSession | null;
  transactions: TollTransaction[];
  isLoading: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  openNewSession: (userAddress: string, amount?: number) => Promise<boolean>;
  closeCurrentSession: () => Promise<{ success: boolean; txHash?: string }>;
  addTransaction: (transaction: TollTransaction) => void;
  updateBalance: (amount: number) => void;
  refreshSession: () => void;
}

export function useYellowSession(): UseYellowSessionReturn {
  // Initialize session immediately from yellowService (before first render)
  const [session, setSession] = useState<YellowSession | null>(() => {
    const existingSession = getCurrentSession();
    if (existingSession) {
      console.log('Initializing with existing session:', existingSession);
    }
    return existingSession;
  });
  const [transactions, setTransactions] = useState<TollTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check connection status periodically and sync session
  useEffect(() => {
    const checkStatus = () => {
      setConnected(isConnected());
      setAuthenticated(isUserAuthenticated());
      
      // Sync session state from yellowService
      const currentSession = getCurrentSession();
      if (currentSession) {
        setSession(currentSession);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Refresh session from service
  const refreshSession = useCallback(() => {
    const currentSession = getCurrentSession();
    if (currentSession) {
      setSession({ ...currentSession });
    }
  }, []);

  // Open a new session
  const openNewSession = useCallback(
    async (userAddress: string, amount: number = DEFAULT_DEPOSIT_AMOUNT): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Opening session for:', userAddress, 'amount:', amount);
        
        // Request faucet tokens first
        console.log('Requesting faucet tokens...');
        const faucetResult = await requestFaucetTokens(userAddress);
        console.log('Faucet result:', faucetResult);

        // Open the session
        const newSession = await openSession(userAddress, amount);
        setSession(newSession);
        setTransactions([]);
        
        console.log('Session opened successfully:', newSession);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to open session';
        console.error('Session open error:', err);
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Close current session
  const closeCurrentSession = useCallback(async (): Promise<{
    success: boolean;
    txHash?: string;
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Closing session...');
      const result = await closeSession();
      
      if (result.success) {
        setSession((prev) => (prev ? { ...prev, status: 'closed' } : null));
        console.log('Session closed:', result);
      }
      
      return { success: result.success, txHash: result.txHash };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close session';
      console.error('Session close error:', err);
      setError(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new transaction
  const addTransaction = useCallback((transaction: TollTransaction) => {
    setTransactions((prev) => [transaction, ...prev].slice(0, 100)); // Keep last 100

    // Update session stats (fee is in USD, balance is in smallest units)
    setSession((prev) => {
      if (!prev) return null;
      const feeInSmallestUnits = transaction.fee * 1000000;
      return {
        ...prev,
        currentBalance: prev.currentBalance - feeInSmallestUnits,
        tollsPaid: prev.tollsPaid + 1,
        totalSpent: prev.totalSpent + transaction.fee,
        gasSaved: prev.gasSaved + 2.5,
      };
    });
  }, []);

  // Update balance directly
  const updateBalance = useCallback((amount: number) => {
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentBalance: Math.max(0, prev.currentBalance - amount),
      };
    });
  }, []);

  return {
    session,
    transactions,
    isLoading,
    isConnected: connected,
    isAuthenticated: authenticated,
    error,
    openNewSession,
    closeCurrentSession,
    addTransaction,
    updateBalance,
    refreshSession,
  };
}
