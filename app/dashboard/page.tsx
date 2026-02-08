'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Route, TollTransaction } from '@/types';
import { useYellowSession } from '@/hooks/useYellowSession';
import { useTollPayment } from '@/hooks/useTollPayment';
import { ROUTES } from '@/lib/constants';
import BalanceDisplay from '@/components/BalanceDisplay';
import TollFeed from '@/components/TollFeed';
import MapView from '@/components/MapView';
import SimulateMode from '@/components/SimulateMode';
import TollAuthorityBalance from '@/components/TollAuthorityBalance';
import { Car, QrCode, LogOut, Settings, Menu, X } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const {
    session,
    transactions,
    isLoading,
    addTransaction,
    closeCurrentSession,
  } = useYellowSession();

  const {
    isDriving,
    currentTollIndex,
    startSimulation,
    stopSimulation,
    resetSimulation,
  } = useTollPayment();

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(ROUTES[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect if no session (with delay to allow session to load)
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasCheckedSession(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (hasCheckedSession && !session && !isLoading) {
      console.log('No active session after check, redirecting to home');
      router.push('/');
    }
  }, [session, isLoading, router, hasCheckedSession]);

  // Handle toll payment from simulation
  const handleTollPaid = useCallback(
    (transaction: TollTransaction) => {
      addTransaction(transaction);
    },
    [addTransaction]
  );

  // Handle simulation complete
  const handleSimulationComplete = useCallback(() => {
    console.log('Simulation complete!');
  }, []);

  // Start driving simulation
  const handleStartDrive = useCallback(
    (route: Route) => {
      startSimulation(route, handleTollPaid, handleSimulationComplete);
    },
    [startSimulation, handleTollPaid, handleSimulationComplete]
  );

  // Handle session close
  const handleCloseSession = async () => {
    const result = await closeCurrentSession();
    if (result.success) {
      router.push('/settlement');
    }
  };

  // Return loading state if no session yet
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ClearLane</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => router.push('/my-qr-code')}
                className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors font-medium"
              >
                <QrCode className="w-4 h-4" />
                My QR Code
              </button>
              <button
                onClick={() => router.push('/settlement')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settlement
              </button>
              <button
                onClick={handleCloseSession}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Close Session
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t space-y-2">
              <button
                onClick={() => {
                  router.push('/my-qr-code');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-primary-600 hover:bg-primary-50 rounded-lg"
              >
                <QrCode className="w-4 h-4" />
                My QR Code
              </button>
              <button
                onClick={() => {
                  router.push('/settlement');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-4 h-4" />
                Settlement
              </button>
              <button
                onClick={() => {
                  handleCloseSession();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Close Session
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Balance Display */}
        <div className="mb-6">
          <BalanceDisplay session={session} isLoading={isLoading} />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Simulation */}
          <div className="space-y-6">
            <SimulateMode
              onStartDrive={handleStartDrive}
              onStopDrive={stopSimulation}
              onReset={resetSimulation}
              isDriving={isDriving}
              currentTollIndex={currentTollIndex}
              selectedRoute={selectedRoute}
              onSelectRoute={setSelectedRoute}
            />
            <MapView
              route={selectedRoute}
              currentTollIndex={currentTollIndex}
              isDriving={isDriving}
            />
          </div>

          {/* Right Column - Transaction Feed & Authority Balance */}
          <div className="space-y-6">
            <TollFeed transactions={transactions} maxItems={10} />
            <TollAuthorityBalance />
          </div>
        </div>
      </div>
    </div>
  );
}
