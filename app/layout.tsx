import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClearLane - Blockchain Toll Payment System',
  description: 'Pay tolls once a month, not once a mile. Using Yellow Network state channels for instant, gasless toll payments.',
  keywords: ['blockchain', 'toll', 'payment', 'Yellow Network', 'state channels', 'USDC'],
  authors: [{ name: 'ClearLane Team' }],
  openGraph: {
    title: 'ClearLane - Blockchain Toll Payment System',
    description: 'Pay tolls once a month, not once a mile.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
