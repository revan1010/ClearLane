'use client';

import { Route, TollCheckpoint } from '@/types';
import { MapPin, Navigation, Flag } from 'lucide-react';

interface MapViewProps {
  route: Route | null;
  currentTollIndex: number;
  isDriving: boolean;
}

export default function MapView({ route, currentTollIndex, isDriving }: MapViewProps) {
  if (!route) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-600" />
          Route Map
        </h3>
        <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Select a route to view the map</p>
          </div>
        </div>
      </div>
    );
  }

  const totalTolls = route.tolls.length;
  const progress = totalTolls > 0 ? (currentTollIndex / totalTolls) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-600" />
          {route.name}
        </h3>
        <span className="text-sm text-gray-500">{route.road}</span>
      </div>

      {/* Map Visualization */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl overflow-hidden mb-4">
        {/* Route Line */}
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-300 rounded-full transform -translate-y-1/2">
          {/* Progress Line */}
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Toll Points */}
        <div className="absolute top-1/2 left-8 right-8 transform -translate-y-1/2 flex justify-between">
          {/* Start Point */}
          <div className="relative">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
              Start
            </span>
          </div>

          {/* Toll Markers */}
          {route.tolls.map((toll, index) => {
            const position = ((index + 1) / (totalTolls + 1)) * 100;
            const isPassed = index < currentTollIndex;
            const isCurrent = index === currentTollIndex && isDriving;

            return (
              <div
                key={toll.id}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    isPassed
                      ? 'bg-primary-500 border-primary-600'
                      : isCurrent
                      ? 'bg-yellow-400 border-yellow-500 animate-ping'
                      : 'bg-white border-gray-300'
                  }`}
                />
                {isCurrent && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                    {toll.name}
                  </div>
                )}
              </div>
            );
          })}

          {/* End Point */}
          <div className="relative">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <Flag className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
              End
            </span>
          </div>
        </div>

        {/* Car Animation */}
        {isDriving && (
          <div
            className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-500 z-10"
            style={{ left: `calc(${8 + (progress * 0.84)}%)` }}
          >
            <div className="w-10 h-6 bg-primary-600 rounded-lg shadow-lg flex items-center justify-center">
              <span className="text-lg">🚗</span>
            </div>
          </div>
        )}
      </div>

      {/* Route Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Distance</p>
          <p className="font-bold text-gray-900">{route.distance} mi</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Tolls</p>
          <p className="font-bold text-gray-900">{totalTolls}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Passed</p>
          <p className="font-bold text-primary-600">{currentTollIndex}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Est. Cost</p>
          <p className="font-bold text-gray-900">${route.estimatedCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Toll List */}
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Toll Checkpoints</p>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {route.tolls.map((toll, index) => {
            const isPassed = index < currentTollIndex;
            const isCurrent = index === currentTollIndex && isDriving;

            return (
              <div
                key={toll.id}
                className={`p-2 rounded-lg text-sm flex items-center justify-between ${
                  isPassed
                    ? 'bg-green-50 text-green-700'
                    : isCurrent
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-300'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                <span className="truncate">{toll.name}</span>
                <span className="font-medium">${toll.fee.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
