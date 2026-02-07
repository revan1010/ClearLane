'use client';

import { useState, useCallback, useRef } from 'react';
import { TollTransaction, TollCheckpoint, Route, PaymentResult } from '@/types';
import { payToll } from '@/lib/yellowService';
import { TOLL_ANIMATION_INTERVAL_MS, TOLL_AUTHORITY_ADDRESS } from '@/lib/constants';

interface UseTollPaymentReturn {
  isProcessing: boolean;
  currentTollIndex: number;
  isDriving: boolean;
  lastPayment: PaymentResult | null;
  error: string | null;
  processTollPayment: (
    tollId: string,
    tollName: string,
    fee: number,
    location: { lat: number; lng: number },
    roadId: string
  ) => Promise<TollTransaction | null>;
  startSimulation: (
    route: Route,
    onTollPaid: (transaction: TollTransaction) => void,
    onComplete: () => void
  ) => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
}

export function useTollPayment(): UseTollPaymentReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTollIndex, setCurrentTollIndex] = useState(0);
  const [isDriving, setIsDriving] = useState(false);
  const [lastPayment, setLastPayment] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const simulationRef = useRef<{
    route: Route | null;
    onTollPaid: ((tx: TollTransaction) => void) | null;
    onComplete: (() => void) | null;
  }>({
    route: null,
    onTollPaid: null,
    onComplete: null,
  });

  // Process a single toll payment
  const processTollPayment = useCallback(
    async (
      tollId: string,
      tollName: string,
      fee: number,
      location: { lat: number; lng: number },
      roadId: string
    ): Promise<TollTransaction | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await payToll(tollId, tollName, fee, location, TOLL_AUTHORITY_ADDRESS);
        setLastPayment(result);

        if (result.success) {
          const transaction: TollTransaction = {
            tollId,
            name: tollName,
            fee,
            timestamp: result.timestamp,
            location,
            roadId,
            settled: false,
          };
          return transaction;
        } else {
          setError(result.error || 'Payment failed');
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment error';
        setError(errorMessage);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Start route simulation
  const startSimulation = useCallback(
    (
      route: Route,
      onTollPaid: (transaction: TollTransaction) => void,
      onComplete: () => void
    ) => {
      // Store callbacks
      simulationRef.current = { route, onTollPaid, onComplete };

      setIsDriving(true);
      setCurrentTollIndex(0);
      setError(null);

      let tollIndex = 0;

      const processNextToll = async () => {
        if (!simulationRef.current.route) {
          stopSimulation();
          return;
        }

        const tolls = simulationRef.current.route.tolls;
        
        if (tollIndex >= tolls.length) {
          stopSimulation();
          simulationRef.current.onComplete?.();
          return;
        }

        const toll = tolls[tollIndex];
        const transaction = await processTollPayment(
          toll.id,
          toll.name,
          toll.fee,
          toll.location,
          simulationRef.current.route.routeId
        );

        if (transaction) {
          simulationRef.current.onTollPaid?.(transaction);
          tollIndex++;
          setCurrentTollIndex(tollIndex);
        } else {
          // Payment failed, stop simulation
          stopSimulation();
        }
      };

      // Process first toll immediately
      processNextToll();

      // Set up interval for remaining tolls
      simulationInterval.current = setInterval(
        processNextToll,
        TOLL_ANIMATION_INTERVAL_MS
      );
    },
    [processTollPayment]
  );

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    setIsDriving(false);
    simulationRef.current = { route: null, onTollPaid: null, onComplete: null };
  }, []);

  // Reset simulation state
  const resetSimulation = useCallback(() => {
    stopSimulation();
    setCurrentTollIndex(0);
    setLastPayment(null);
    setError(null);
  }, [stopSimulation]);

  return {
    isProcessing,
    currentTollIndex,
    isDriving,
    lastPayment,
    error,
    processTollPayment,
    startSimulation,
    stopSimulation,
    resetSimulation,
  };
}
