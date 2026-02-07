'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { parseQRCodeData } from '@/lib/tollCalculator';

interface ScanModeProps {
  onTollScanned: (tollData: {
    tollId: string;
    name: string;
    fee: number;
    roadId: string;
  }) => void;
  isEnabled: boolean;
  onClose: () => void;
}

export default function ScanMode({ onTollScanned, isEnabled, onClose }: ScanModeProps) {
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCode = useRef<unknown>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const initScanner = async () => {
      try {
        // Dynamically import html5-qrcode to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode');
        
        if (scannerRef.current) {
          html5QrCode.current = new Html5Qrcode('qr-reader');
          
          const qrCodeSuccessCallback = (decodedText: string) => {
            const tollData = parseQRCodeData(decodedText);
            if (tollData && tollData.tollId !== lastScanned) {
              setLastScanned(tollData.tollId);
              onTollScanned(tollData);
              
              // Vibrate on successful scan
              if (navigator.vibrate) {
                navigator.vibrate(100);
              }
            }
          };

          const config = { fps: 10, qrbox: { width: 250, height: 250 } };
          
          await (html5QrCode.current as { start: (facingMode: { facingMode: string }, config: { fps: number; qrbox: { width: number; height: number } }, onSuccess: (text: string) => void, onError: () => void) => Promise<void> }).start(
            { facingMode: 'environment' },
            config,
            qrCodeSuccessCallback,
            () => {} // Ignore errors from failed scans
          );
          
          setIsScanning(true);
        }
      } catch (err) {
        console.error('Failed to initialize scanner:', err);
        setError('Camera access denied. Please enable camera permissions.');
      }
    };

    initScanner();

    return () => {
      if (html5QrCode.current && isScanning) {
        (html5QrCode.current as { stop: () => Promise<void> }).stop().catch(console.error);
      }
    };
  }, [isEnabled, lastScanned, onTollScanned]);

  if (!isEnabled) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Scan Toll QR</h2>
              <p className="text-gray-400 text-sm">Point camera at toll booth code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div id="qr-reader" ref={scannerRef} className="w-80 h-80" />
          
          {/* Scan Frame Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full border-2 border-primary-500 rounded-lg">
              {/* Corner Decorations */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />
              
              {/* Scan Line Animation */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-400 animate-pulse" 
                   style={{ animation: 'scanLine 2s linear infinite' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {error ? (
          <div className="flex items-center gap-3 p-4 bg-red-500/20 rounded-xl border border-red-500/30">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-white font-medium">Camera Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        ) : lastScanned ? (
          <div className="flex items-center gap-3 p-4 bg-green-500/20 rounded-xl border border-green-500/30 animate-pulse">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-white font-medium">Toll Paid!</p>
              <p className="text-green-300 text-sm">Ready for next scan</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl">
            <QrCode className="w-6 h-6 text-white" />
            <div>
              <p className="text-white font-medium">Scanning...</p>
              <p className="text-gray-400 text-sm">Position QR code in the frame</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
