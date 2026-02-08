'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useYellowSession } from '@/hooks/useYellowSession';
import { Download, QrCode, ArrowLeft, Car, Shield, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MyQRCodePage() {
  const router = useRouter();
  const { session } = useYellowSession();
  const [copied, setCopied] = useState(false);

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      router.push('/');
    }
  }, [session, router]);

  if (!session) {
    return null;
  }

  // QR code contains the driver's wallet address
  // Toll booth scanners will read this and charge the driver
  const qrData = JSON.stringify({
    driverAddress: session.userAddress,
    sessionId: session.sessionId,
    type: 'clearlane-driver'
  });

  const downloadQR = () => {
    const svg = document.getElementById('driver-qr');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 1024;
    canvas.height = 1024;

    img.onload = () => {
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, 1024, 1024);
      ctx?.drawImage(img, 112, 112, 800, 800);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `clearlane-driver-${session.userAddress.slice(0, 8)}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(session.userAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My QR Code</h1>
                <p className="text-xs text-gray-500">Windshield Pass</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Car className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Your Digital Toll Pass</h3>
              <p className="text-sm text-blue-700">
                This QR code is linked to your Yellow Network account. Display it on your windshield so toll booths can automatically charge you as you drive through.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: QR Code Display */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your ClearLane Pass</h2>
              <p className="text-sm text-gray-500">Valid for session: {session.sessionId.slice(0, 16)}...</p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-8 rounded-xl border-4 border-primary-500 mb-6 relative">
              {/* ClearLane Logo/Badge in corner */}
              <div className="absolute top-2 left-2 bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                ClearLane
              </div>
              
              <QRCodeSVG
                id="driver-qr"
                value={qrData}
                size={400}
                level="H"
                includeMargin={true}
                className="w-full h-auto"
                fgColor="#1e40af"
              />

              {/* Balance Display */}
              <div className="absolute bottom-2 right-2 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                ${(session.currentBalance / 1000000).toFixed(2)}
              </div>
            </div>

            {/* Wallet Address */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-gray-900 flex-1 truncate">
                  {session.userAddress}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25"
            >
              <Download className="w-5 h-5" />
              Download High-Res QR Code
            </button>
          </div>

          {/* Right: Instructions */}
          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-600" />
                How It Works
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-primary-600">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Print & Display</h4>
                    <p className="text-sm text-gray-600">Download and print your QR code. Place it on your windshield where toll scanners can see it.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-primary-600">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Drive Through</h4>
                    <p className="text-sm text-gray-600">Simply drive through toll booths. Scanners read your QR code automatically - no stopping needed!</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-primary-600">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Instant Payment</h4>
                    <p className="text-sm text-gray-600">Tolls are charged instantly via Yellow Network. Zero gas fees, instant settlement!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Printing Instructions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Printing Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>Print on white paper (minimum 8.5" x 11")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>Use high-quality printer (300 DPI or better)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>Laminate for weather protection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>Mount on windshield facing outward</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>Keep QR code clean and unobstructed</span>
                </li>
              </ul>
            </div>

            {/* Security Note */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Secure & Private</h4>
                  <p className="text-sm text-green-700">
                    Your QR code only contains your wallet address. Toll payments require authentication through Yellow Network's state channels. Nobody can steal funds by scanning your code.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Session Details</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-primary-600">
                ${(session.currentBalance / 1000000).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Tolls Paid</p>
              <p className="text-2xl font-bold text-gray-900">{session.tollsPaid}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Gas Saved</p>
              <p className="text-2xl font-bold text-green-600">${session.gasSaved.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
