'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConnectWallet from '@/components/ConnectWallet';
import { useYellowSession } from '@/hooks/useYellowSession';
import { DEFAULT_DEPOSIT_AMOUNT } from '@/lib/constants';
import { formatCurrency } from '@/lib/tollCalculator';
import { Car, Zap, Shield, DollarSign, ArrowRight, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { openNewSession, isLoading, error } = useYellowSession();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState(DEFAULT_DEPOSIT_AMOUNT);
  const [step, setStep] = useState<'connect' | 'deposit'>('connect');

  const handleWalletConnect = (address: string) => {
    console.log('Wallet connected:', address);
    setWalletAddress(address);
    setStep('deposit');
  };

  const handleOpenSession = async () => {
    if (!walletAddress) return;

    const success = await openNewSession(walletAddress, depositAmount);
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ClearLane</h1>
                <p className="text-xs text-gray-500">Powered by Yellow Network</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/qr-generator')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                🎥 Toll Booth Scanner
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Sandbox Mode</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Yellow Network Bounty Submission
            </div>
            
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Pay tolls once a month,
              <span className="gradient-text"> not once a mile</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Stop paying $2+ gas fees for every toll. Open a session once, drive through 
              unlimited tolls with zero fees, settle everything in one transaction.
            </p>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Instant Payments</h3>
                  <p className="text-sm text-gray-500">Sub-second toll processing</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Zero Gas Fees</h3>
                  <p className="text-sm text-gray-500">Off-chain state channels</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Fully Secure</h3>
                  <p className="text-sm text-gray-500">Funds locked in smart contract</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Easy to Use</h3>
                  <p className="text-sm text-gray-500">Scan QR or simulate drive</p>
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div className="p-4 bg-gray-900 rounded-xl text-white">
              <p className="text-sm text-gray-400 mb-2">Market Opportunity</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">80M</p>
                  <p className="text-xs text-gray-400">Daily tolls (India)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">9B+</p>
                  <p className="text-xs text-gray-400">Annual (US)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">$0</p>
                  <p className="text-xs text-gray-400">Current blockchain solution</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Connect/Deposit Flow */}
          <div>
            {step === 'connect' && (
              <ConnectWallet onConnect={handleWalletConnect} isConnecting={isLoading} />
            )}

            {step === 'deposit' && walletAddress && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                {/* Connected Status */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Wallet Connected</p>
                      <p className="font-mono text-sm">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('connect')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Change
                  </button>
                </div>

                {/* Deposit Amount */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Deposit Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                      $
                    </span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      min={10}
                      max={1000}
                      className="w-full pl-8 pr-20 py-4 text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      USDC
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Minimum $10 • Maximum $1,000 • 30-day session
                  </p>
                </div>

                {/* Quick Select */}
                <div className="flex gap-2 mb-6">
                  {[50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        depositAmount === amount
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                {/* Estimated Usage */}
                <div className="p-4 bg-gray-50 rounded-xl mb-6">
                  <p className="text-sm text-gray-600 mb-2">Estimated usage</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">
                      ~{Math.floor(depositAmount / 2.5)} tolls
                    </span>
                    <span className="text-green-600 font-medium">
                      Save {formatCurrency(Math.floor(depositAmount / 2.5) * 2.5)} in gas
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Open Session Button */}
                <button
                  onClick={handleOpenSession}
                  disabled={isLoading || depositAmount < 10}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Opening Session...
                    </>
                  ) : (
                    <>
                      Open Session
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-400 mt-4">
                  This is a demo using Yellow Network Sandbox.
                  Test tokens will be used.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>ClearLane - HackMoney 2026 Submission</p>
            <p>Built with Yellow Network State Channels</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
