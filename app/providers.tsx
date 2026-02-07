'use client';

import { ReactNode } from 'react';

/**
 * SessionProvider - Simple wrapper for future global state
 * Currently using useYellowSession hook for actual session management
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
