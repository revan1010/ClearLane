'use client';

import { useMemo } from 'react';
import { TollTransaction, MonthlySummary } from '@/types';
import { calculateMonthlySummary, formatCurrency, calculateSavingsPercentage } from '@/lib/tollCalculator';
import { TrendingUp, Car, Zap, DollarSign, Map, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MonthlyStatsProps {
  transactions: TollTransaction[];
  totalSpent: number;
  gasSaved: number;
  tollsPaid: number;
}

export default function MonthlyStats({
  transactions,
  totalSpent,
  gasSaved,
  tollsPaid,
}: MonthlyStatsProps) {
  // Calculate daily breakdown
  const dailyData = useMemo(() => {
    const days: Record<string, { date: string; spent: number; tolls: number }> = {};
    
    transactions.forEach((tx) => {
      const date = new Date(tx.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      
      if (!days[date]) {
        days[date] = { date, spent: 0, tolls: 0 };
      }
      days[date].spent += tx.fee;
      days[date].tolls += 1;
    });

    return Object.values(days).slice(-7).reverse();
  }, [transactions]);

  // Savings comparison data
  const savingsData = [
    { name: 'Tolls', value: totalSpent, color: '#22c55e' },
    { name: 'Gas Saved', value: gasSaved, color: '#3b82f6' },
  ];

  const savingsPercentage = calculateSavingsPercentage(totalSpent, gasSaved);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-sm text-gray-500">Tolls Paid</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{tollsPaid}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Total Spent</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Gas Saved</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(gasSaved)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Savings Rate</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{savingsPercentage}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Spending Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Daily Spending
          </h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Spent']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="spent" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No data yet. Start driving to see your stats!
            </div>
          )}
        </div>

        {/* Savings Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" />
            Cost Comparison
          </h3>
          {totalSpent > 0 || gasSaved > 0 ? (
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={savingsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {savingsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <div>
                    <p className="text-sm text-gray-500">Toll Fees</p>
                    <p className="font-semibold">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-sm text-gray-500">Gas Fees Saved</p>
                    <p className="font-semibold text-green-600">{formatCurrency(gasSaved)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">Traditional Cost</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(totalSpent + gasSaved)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No data yet. Start driving to see your stats!
            </div>
          )}
        </div>
      </div>

      {/* Traditional vs Yellow Comparison */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Yellow Network Advantage</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-white/80 mb-2">Without Yellow Network</p>
            <p className="text-3xl font-bold">{formatCurrency(totalSpent + gasSaved)}</p>
            <p className="text-sm text-white/60 mt-1">
              {tollsPaid} tolls × $2.50 gas each = {formatCurrency(gasSaved)} in fees
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-white/80 mb-2">With Yellow Network</p>
            <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
            <p className="text-sm text-green-300 mt-1">
              + Only 2 on-chain transactions (open & close session)
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white/10 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-lg">Total Saved</span>
            <span className="text-2xl font-bold text-green-300">
              {formatCurrency(gasSaved)} ({savingsPercentage}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
