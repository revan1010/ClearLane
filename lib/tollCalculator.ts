import { TollTransaction, DashboardStats, MonthlySummary, Route } from '@/types';
import { ESTIMATED_GAS_COST_USD, ROUTES } from './constants';

/**
 * Calculate the total toll cost for a route
 */
export function calculateRouteCost(route: Route): number {
  return route.tolls.reduce((sum, toll) => sum + toll.fee, 0);
}

/**
 * Calculate gas fees saved compared to traditional on-chain payments
 */
export function calculateGasSaved(tollCount: number): number {
  return tollCount * ESTIMATED_GAS_COST_USD;
}

/**
 * Calculate dashboard statistics from transactions
 */
export function calculateDashboardStats(transactions: TollTransaction[]): DashboardStats {
  const totalTolls = transactions.length;
  const totalSpent = transactions.reduce((sum, tx) => sum + tx.fee, 0);
  const gasSaved = calculateGasSaved(totalTolls);
  const avgTollCost = totalTolls > 0 ? totalSpent / totalTolls : 0;

  // Estimate distance based on toll positions (simplified)
  const totalDistance = totalTolls * 15; // Rough estimate: 15 miles between tolls

  return {
    totalTolls,
    totalSpent,
    totalDistance,
    gasSaved,
    avgTollCost,
  };
}

/**
 * Calculate monthly summary for settlement
 */
export function calculateMonthlySummary(
  transactions: TollTransaction[],
  month: string,
  year: number
): MonthlySummary {
  const stats = calculateDashboardStats(transactions);
  const traditionalCost = stats.totalSpent + stats.gasSaved;
  const savings = stats.gasSaved;

  return {
    month,
    year,
    totalTolls: stats.totalTolls,
    totalSpent: stats.totalSpent,
    totalDistance: stats.totalDistance,
    gasSaved: stats.gasSaved,
    traditionalCost,
    savings,
    transactions,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return `$${amount.toFixed(decimals)}`;
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  return `${miles.toLocaleString()} mi`;
}

/**
 * Get route by ID
 */
export function getRouteById(routeId: string): Route | undefined {
  return ROUTES.find((route) => route.routeId === routeId);
}

/**
 * Calculate progress percentage through a route
 */
export function calculateRouteProgress(
  currentTollIndex: number,
  totalTolls: number
): number {
  if (totalTolls === 0) return 0;
  return Math.round((currentTollIndex / totalTolls) * 100);
}

/**
 * Estimate time to complete route in simulate mode
 */
export function estimateSimulationTime(
  tollCount: number,
  intervalMs: number = 2000
): string {
  const totalSeconds = (tollCount * intervalMs) / 1000;
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Parse QR code data for toll payment
 */
export function parseQRCodeData(qrData: string): {
  tollId: string;
  name: string;
  fee: number;
  roadId: string;
} | null {
  try {
    const data = JSON.parse(qrData);
    if (data.tollId && data.name && typeof data.fee === 'number') {
      return {
        tollId: data.tollId,
        name: data.name,
        fee: data.fee,
        roadId: data.roadId || 'unknown',
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate QR code data for a toll
 */
export function generateQRCodeData(
  tollId: string,
  name: string,
  fee: number,
  roadId: string
): string {
  return JSON.stringify({ tollId, name, fee, roadId });
}

/**
 * Calculate savings percentage
 */
export function calculateSavingsPercentage(
  totalSpent: number,
  gasSaved: number
): number {
  const traditionalCost = totalSpent + gasSaved;
  if (traditionalCost === 0) return 0;
  return Math.round((gasSaved / traditionalCost) * 100);
}
