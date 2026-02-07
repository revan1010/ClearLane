'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useYellowSession } from '@/hooks/useYellowSession';
import MonthlyStats from '@/components/MonthlyStats';
import { formatCurrency } from '@/lib/tollCalculator';
import { Car, ArrowLeft, Download, CheckCircle, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';

export default function SettlementPage() {
  const router = useRouter();
  const { session, transactions, closeCurrentSession, isLoading } = useYellowSession();
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Return loading state if no session
  if (!session && !isClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Use actual session data
  const currentSession = session || {
    sessionId: 'closed',
    channelId: 'closed',
    userAddress: '0x0000000000000000000000000000000000000000',
    initialDeposit: 0,
    currentBalance: 0,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: 'closed' as const,
    tollsPaid: transactions.length,
    totalSpent: transactions.reduce((sum, tx) => sum + tx.fee, 0),
    gasSaved: transactions.length * 2.5,
  };

  const handleCloseSession = async () => {
    setIsClosing(true);
    
    // Simulate closing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = await closeCurrentSession();
    
    if (result.success) {
      setTxHash(result.txHash || '0x' + Math.random().toString(16).slice(2).padStart(64, '0'));
      setIsClosed(true);
    }
    
    setIsClosing(false);
  };

  const handleDownloadReport = () => {
    // Generate CSV report
    const headers = ['Date', 'Time', 'Toll Name', 'Road', 'Amount'];
    const rows = transactions.map(tx => {
      const date = new Date(tx.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        tx.name,
        tx.roadId,
        `$${tx.fee.toFixed(2)}`
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clearlane-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ClearLane</h1>
                  <p className="text-xs text-gray-500">Monthly Settlement</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Report</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Summary</h2>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  Started: {new Date(currentSession.startDate).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>
                  Ends: {new Date(currentSession.endDate).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isClosed 
                    ? 'bg-gray-100 text-gray-600' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {isClosed ? 'CLOSED' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {!isClosed && (
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Continue Driving
                </button>
                <button
                  onClick={handleCloseSession}
                  disabled={isClosing}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
                >
                  {isClosing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Settling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Close & Settle
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Final Balance */}
          <div className="mt-6 pt-6 border-t grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Initial Deposit</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentSession.initialDeposit / 1000000)}
              </p>
              <p className="text-xs text-gray-400 mt-1">ytest.usd</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(currentSession.totalSpent)}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Gas Saved</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(currentSession.gasSaved)}
              </p>
            </div>
            <div className="p-4 bg-primary-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Remaining Balance</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(currentSession.currentBalance / 1000000)}
              </p>
              <p className="text-xs text-gray-400 mt-1">ytest.usd</p>
            </div>
          </div>
        </div>

        {/* Closed Session Success */}
        {isClosed && txHash && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 mb-1">
                  Session Closed Successfully!
                </h3>
                <p className="text-green-700 mb-3">
                  Your remaining balance of {formatCurrency(currentSession.currentBalance / 1000000)} ytest.usd has been returned to your wallet.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">Transaction:</span>
                  <code className="px-2 py-1 bg-green-100 rounded font-mono text-xs">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </code>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning if low activity */}
        {currentSession.tollsPaid === 0 && !isClosed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">
                  No Tolls Paid Yet
                </h3>
                <p className="text-yellow-700 text-sm">
                  You haven&apos;t used any tolls during this session. Go to the dashboard to simulate a drive or scan toll QR codes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Stats */}
        <MonthlyStats
          transactions={transactions}
          totalSpent={currentSession.totalSpent}
          gasSaved={currentSession.gasSaved}
          tollsPaid={currentSession.tollsPaid}
        />

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              All Transactions ({transactions.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Date & Time</th>
                    <th className="pb-3 font-medium">Toll Name</th>
                    <th className="pb-3 font-medium">Road</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx, index) => (
                    <tr key={`${tx.tollId}-${index}`} className="text-sm">
                      <td className="py-3 text-gray-600">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 font-medium text-gray-900">{tx.name}</td>
                      <td className="py-3 text-gray-600">{tx.roadId}</td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatCurrency(tx.fee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={3} className="py-3 text-gray-900">Total</td>
                    <td className="py-3 text-right text-gray-900">
                      {formatCurrency(currentSession.totalSpent)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {isClosed ? (
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25"
            >
              Start New Session
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleCloseSession}
                disabled={isClosing}
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
              >
                {isClosing ? 'Settling...' : 'Close Session & Withdraw'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
