'use client';

import { useState } from 'react';
import { Route, TollTransaction } from '@/types';
import { ROUTES } from '@/lib/constants';
import { formatCurrency, estimateSimulationTime } from '@/lib/tollCalculator';
import { Play, Pause, RotateCcw, Car, MapPin, DollarSign, Clock } from 'lucide-react';

interface SimulateModeProps {
  onStartDrive: (route: Route) => void;
  onStopDrive: () => void;
  onReset: () => void;
  isDriving: boolean;
  currentTollIndex: number;
  selectedRoute: Route | null;
  onSelectRoute: (route: Route) => void;
}

export default function SimulateMode({
  onStartDrive,
  onStopDrive,
  onReset,
  isDriving,
  currentTollIndex,
  selectedRoute,
  onSelectRoute,
}: SimulateModeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalTolls = selectedRoute?.tolls.length ?? 0;
  const progress = totalTolls > 0 ? (currentTollIndex / totalTolls) * 100 : 0;
  const isComplete = currentTollIndex >= totalTolls && totalTolls > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Car className="w-5 h-5 text-primary-600" />
          Simulate Drive
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          Demo Mode
        </span>
      </div>

      {/* Route Selection */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Select Route
        </label>
        <div className="space-y-2">
          {ROUTES.map((route) => (
            <button
              key={route.routeId}
              onClick={() => onSelectRoute(route)}
              disabled={isDriving}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedRoute?.routeId === route.routeId
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              } ${isDriving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{route.name}</p>
                  <p className="text-sm text-gray-500">{route.road}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{route.distance} mi</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCurrency(route.estimatedCost)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>{route.tolls.length} tolls</span>
                <span>~{estimateSimulationTime(route.tolls.length)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Route Info */}
      {selectedRoute && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {currentTollIndex} / {totalTolls} tolls
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isComplete ? 'bg-green-500' : 'bg-primary-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current Toll */}
          {isDriving && currentTollIndex < totalTolls && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              <span className="text-gray-600">
                Approaching: {selectedRoute.tolls[currentTollIndex]?.name}
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(selectedRoute.tolls[currentTollIndex]?.fee || 0)}
              </span>
            </div>
          )}

          {isComplete && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
              <span>✅</span>
              <span>Route complete! All tolls paid.</span>
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isDriving && !isComplete && (
          <button
            onClick={() => selectedRoute && onStartDrive(selectedRoute)}
            disabled={!selectedRoute}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
          >
            <Play className="w-5 h-5" />
            Start Drive
          </button>
        )}

        {isDriving && (
          <button
            onClick={onStopDrive}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all"
          >
            <Pause className="w-5 h-5" />
            Stop
          </button>
        )}

        {(isComplete || currentTollIndex > 0) && !isDriving && (
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-blue-50 rounded-xl">
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800">How it works</p>
            <p className="text-blue-600">
              Simulates a real drive through selected route. Tolls are deducted every 2 seconds as you pass each checkpoint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
