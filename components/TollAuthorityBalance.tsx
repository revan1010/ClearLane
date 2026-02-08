'use client';

import { DollarSign } from 'lucide-react';
import { TOLL_AUTHORITY_ADDRESS } from '@/lib/constants';

export default function TollAuthorityBalance() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Toll Authority
        </h3>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-2">Payment Destination</p>
          <p className="font-mono text-xs text-gray-900 break-all">
            {TOLL_AUTHORITY_ADDRESS}
          </p>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            All toll payments are sent to this Yellow Network address via instant, gasless off-chain transfers.
          </p>
        </div>
      </div>
    </div>
  );
}
