'use client';

import { TollTransaction } from '@/types';
import { formatCurrency } from '@/lib/tollCalculator';
import { Receipt, MapPin, Clock, CheckCircle } from 'lucide-react';

interface TollFeedProps {
  transactions: TollTransaction[];
  maxItems?: number;
}

export default function TollFeed({ transactions, maxItems = 10 }: TollFeedProps) {
  const displayTransactions = transactions.slice(0, maxItems);

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary-600" />
          Recent Transactions
        </h3>
        <div className="text-center py-8">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No transactions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start driving to see your toll payments
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary-600" />
          Recent Transactions
        </h3>
        <span className="text-sm text-gray-500">
          {transactions.length} total
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayTransactions.map((tx, index) => (
          <div
            key={`${tx.tollId}-${tx.timestamp}`}
            className={`p-4 rounded-xl border transition-all duration-300 ${
              index === 0
                ? 'bg-primary-50 border-primary-200 animate-pulse'
                : 'bg-gray-50 border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{tx.name}</span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                      NEW
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {tx.roadId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(tx.timestamp)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  -{formatCurrency(tx.fee)}
                </p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Instant
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {transactions.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all {transactions.length} transactions
          </button>
        </div>
      )}
    </div>
  );
}
