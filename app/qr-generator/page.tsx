'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Car, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function TollBoothScannerPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ driver: string; amount: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCode = useRef<any>(null);

  // Select toll booth
  const [selectedToll, setSelectedToll] = useState(ROUTES[0].tolls[0]);

  useEffect(() => {
    return () => {
      if (html5QrCode.current && isScanning) {
        html5QrCode.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      if (scannerRef.current) {
        html5QrCode.current = new Html5Qrcode('toll-booth-scanner');
        
        const qrCodeSuccessCallback = async (decodedText: string) => {
          if (decodedText === lastScanned || processing) return;
          
          setLastScanned(decodedText);
          setProcessing(true);
          setError(null);
          setSuccess(null);

          try {
            // Parse driver QR code
            const driverData = JSON.parse(decodedText);
            
            if (driverData.type !== 'clearlane-driver') {
              throw new Error('Invalid ClearLane QR code');
            }

            // Simulate payment (toll booth visualization - real payments happen in driver dashboard)
            console.log('📸 Toll Booth Scanner: Simulating charge');
            console.log('  Driver:', driverData.driverAddress);
            console.log('  Toll:', selectedToll.name, '- $' + selectedToll.fee);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Show success
            setSuccess({
              driver: driverData.driverAddress,
              amount: selectedToll.fee,
            });
            
            if (navigator.vibrate) {
              navigator.vibrate([100, 50, 100]);
            }

            setTimeout(() => {
              setSuccess(null);
              setLastScanned(null);
            }, 3000);

          } catch (err) {
            console.error('Scan error:', err);
            setError(err instanceof Error ? err.message : 'Failed to process payment');
            setTimeout(() => {
              setError(null);
              setLastScanned(null);
            }, 3000);
          } finally {
            setProcessing(false);
          }
        };

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        await html5QrCode.current.start(
          { facingMode: 'environment' },
          config,
          qrCodeSuccessCallback,
          () => {}
        );
        
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopScanning = async () => {
    if (html5QrCode.current && isScanning) {
      await html5QrCode.current.stop();
      setIsScanning(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageData;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(img, 0, 0);

      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageDataObj.data, imageDataObj.width, imageDataObj.height);

      if (!code) {
        throw new Error('No QR code found in image');
      }

      const driverData = JSON.parse(code.data);
      
      if (driverData.type !== 'clearlane-driver') {
        throw new Error('Invalid ClearLane QR code');
      }

      // Simulate payment
      console.log('📤 Upload: Simulating charge');
      console.log('  Driver:', driverData.driverAddress);
      console.log('  Toll:', selectedToll.name, '- $' + selectedToll.fee);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccess({
        driver: driverData.driverAddress,
        amount: selectedToll.fee,
      });
      
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process QR code');
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="bg-gray-800 shadow-lg sticky top-0 z-40 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Toll Booth Scanner</h1>
                <p className="text-xs text-gray-400">Demo Visualization</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-200">
            <strong>Demo Mode:</strong> This scanner visualizes how toll booths would process payments. Real payments happen when you use the "Simulate Drive" feature in the driver dashboard.
          </p>
        </div>

        {/* Toll Selection */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Select Toll Booth</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {ROUTES[0].tolls.slice(0, 6).map((toll) => (
              <button
                key={toll.id}
                onClick={() => setSelectedToll(toll)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedToll.id === toll.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 hover:border-orange-400/50'
                }`}
              >
                <h3 className="font-semibold">{toll.name}</h3>
                <p className="text-2xl font-bold text-orange-400 mt-2">${toll.fee.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Mile {toll.mile}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scanner */}
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">QR Code Reader</h2>
            
            {!isScanning ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-10 h-10 text-orange-400" />
                </div>
                <p className="text-gray-400 mb-6">
                  Scan or upload driver QR codes
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={startScanning}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </button>
                  <label className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload QR Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div id="toll-booth-scanner" ref={scannerRef} className="rounded-lg overflow-hidden" />
                <button
                  onClick={stopScanning}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Active Toll Booth</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-lg font-semibold">{selectedToll.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Toll Amount</p>
                  <p className="text-3xl font-bold text-orange-400">${selectedToll.fee.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {processing && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent" />
                  <div>
                    <p className="font-medium text-blue-200">Processing...</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-200">QR Code Scanned!</p>
                    <p className="text-sm text-green-300">${success.amount.toFixed(2)} toll</p>
                    <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                      {success.driver}
                    </p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-200">Error</p>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
