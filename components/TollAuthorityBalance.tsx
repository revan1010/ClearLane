'use client';

import { useState } from 'react';
import { DollarSign, RefreshCw } from 'lucide-react';
import { getBalanceForAddress } from '@/lib/yellowService';
import { TOLL_AUTHORITY_ADDRESS } from '@/lib/constants';

export default function TollAuthorityBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkBalance = async () => {
    setIsLoading(true);
    try {
      const result = await getBalanceForAddress(TOLL_AUTHORITY_ADDRESS);
      if (result && typeof result === 'object') {
        const r = result as { ledger_balances?: { asset: string; amount: string }[] };
        if (r.ledger_balances) {
          const usdcBalance = r.ledger_balances.find(bal => bal.asset === 'ytest.usd');
          if (usdcBalance) {
            const balanceInSmallestUnits = parseFloat(usdcBalance.amount);
            setBalance(balanceInSmallestUnits / 1000000); // Convert to USD
          }
        }
      }
    } catch (error) {
      console.error('Error checking toll authority balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Toll Authority Balance
        </h3>
        <button
          onClick={checkBalance}
          disabled={isLoading}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Authority Address</p>
          <p className="font-mono text-xs text-gray-900 break-all">
            {TOLL_AUTHORITY_ADDRESS}
          </p>
        </div>

        {balance !== null && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-green-600">
              ${balance.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">ytest.usd</p>
          </div>
        )}

        {balance === null && !isLoading && (
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-sm text-gray-500">
              Click refresh to check authority balance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
