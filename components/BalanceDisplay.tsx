'use client';

import { YellowSession } from '@/types';
import { formatCurrency } from '@/lib/tollCalculator';
import { Wallet, Clock, Car, Zap, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { LOW_BALANCE_THRESHOLD } from '@/lib/constants';
import { isConnected, isUserAuthenticated } from '@/lib/yellowService';

interface BalanceDisplayProps {
  session: YellowSession | null;
  isLoading?: boolean;
}

export default function BalanceDisplay({ session, isLoading = false }: BalanceDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-16 bg-gray-200 rounded w-3/4 mb-6"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No active session</p>
      </div>
    );
  }

  // Convert from smallest units (6 decimals for ytest.usd) to display format
  const displayBalance = session.currentBalance / 1000000;
  const displayInitialDeposit = session.initialDeposit / 1000000;
  
  const isLowBalance = displayBalance < LOW_BALANCE_THRESHOLD;
  const balancePercentage = (session.currentBalance / session.initialDeposit) * 100;

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-white/80">Session Balance</p>
            <p className="text-xs text-white/60">
              {session.userAddress.slice(0, 6)}...{session.userAddress.slice(-4)}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          session.status === 'active' 
            ? 'bg-green-400/20 text-green-100' 
            : 'bg-gray-400/20 text-gray-100'
        }`}>
          {session.status.toUpperCase()}
        </div>
      </div>

      {/* Main Balance */}
      <div className="mb-6">
        <div className={`text-5xl font-bold mb-2 ${isLowBalance ? 'text-yellow-300' : ''}`}>
          {formatCurrency(displayBalance)}
        </div>
        <p className="text-sm text-white/60 mb-3">ytest.usd</p>
        
        {/* Balance Bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isLowBalance ? 'bg-yellow-400' : 'bg-white'
            }`}
            style={{ width: `${balancePercentage}%` }}
          />
        </div>
        <p className="text-sm text-white/70">
          {formatCurrency(displayInitialDeposit - displayBalance)} spent of {formatCurrency(displayInitialDeposit)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Car className="w-4 h-4 text-white/70" />
            <span className="text-xs text-white/70">Tolls Paid</span>
          </div>
          <p className="text-xl font-bold">{session.tollsPaid}</p>
        </div>

        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-white/70" />
            <span className="text-xs text-white/70">Total Spent</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(session.totalSpent)}</p>
        </div>

        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-green-300" />
            <span className="text-xs text-white/70">Gas Saved</span>
          </div>
          <p className="text-xl font-bold text-green-300">{formatCurrency(session.gasSaved)}</p>
        </div>
      </div>

      {/* Session Info */}
      <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-white/70">
          <Clock className="w-4 h-4" />
          <span>Session ends: {new Date(session.endDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected() ? (
            <div className="flex items-center gap-1 text-green-300">
              <Wifi className="w-3 h-3" />
              <span className="text-xs">Yellow Network</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-yellow-300">
              <WifiOff className="w-3 h-3" />
              <span className="text-xs">Offline Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Low Balance Warning */}
      {isLowBalance && (
        <div className="mt-4 p-3 bg-yellow-500/20 rounded-xl border border-yellow-400/30">
          <p className="text-sm text-yellow-200 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            Low balance! Consider adding more funds.
          </p>
        </div>
      )}
    </div>
  );
}
