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
import ScanMode from '@/components/ScanMode';
import TollAuthorityBalance from '@/components/TollAuthorityBalance';
import { Car, Camera, LogOut, Settings, Menu, X } from 'lucide-react';

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
  const [isScanMode, setIsScanMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulate' | 'scan'>('simulate');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect if no session (with delay to allow session to load)
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  
  useEffect(() => {
    // Wait a moment for the session to load from yellowService
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

  // Handle QR scan
  const handleTollScanned = useCallback(
    async (tollData: { tollId: string; name: string; fee: number; roadId: string }) => {
      const transaction: TollTransaction = {
        tollId: tollData.tollId,
        name: tollData.name,
        fee: tollData.fee,
        timestamp: new Date().toISOString(),
        location: { lat: 0, lng: 0 },
        roadId: tollData.roadId,
        settled: false,
      };
      addTransaction(transaction);
    },
    [addTransaction]
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

        {/* Mode Tabs */}
        <div className="mb-6">
          <div className="flex bg-white rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('simulate')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'simulate'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Car className="w-5 h-5" />
              Simulate Drive
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'scan'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="w-5 h-5" />
              Scan QR
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {activeTab === 'simulate' ? (
              <>
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
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary-600" />
                  QR Code Scanner
                </h3>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-10 h-10 text-primary-600" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    Scan toll booth QR codes for instant payment
                  </p>
                  <button
                    onClick={() => setIsScanMode(true)}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25"
                  >
                    Open Camera
                  </button>
                </div>

                {/* Demo QR Codes */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-3">Demo: Click to simulate scan</p>
                  <div className="grid grid-cols-4 gap-2">
                    {ROUTES[0].tolls.slice(0, 8).map((toll) => (
                      <button
                        key={toll.id}
                        onClick={() => handleTollScanned({
                          tollId: toll.id,
                          name: toll.name,
                          fee: toll.fee,
                          roadId: ROUTES[0].routeId,
                        })}
                        className="p-2 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-center"
                      >
                        <div className="text-lg mb-1">📍</div>
                        <p className="text-xs text-gray-600 truncate">${toll.fee.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Transaction Feed & Authority Balance */}
          <div className="space-y-6">
            <TollFeed transactions={transactions} maxItems={10} />
            <TollAuthorityBalance />
          </div>
        </div>
      </div>

      {/* Scan Mode Overlay */}
      <ScanMode
        isEnabled={isScanMode}
        onTollScanned={handleTollScanned}
        onClose={() => setIsScanMode(false)}
      />
    </div>
  );
}
