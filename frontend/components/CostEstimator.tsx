'use client';

import { useState } from 'react';
import { formatPrice, calculateOutOfPocket } from '@/lib/utils';

interface CostEstimatorProps {
  onEstimate: (params: any) => Promise<any>;
  loading: boolean;
}

export function CostEstimator({ onEstimate, loading }: CostEstimatorProps) {
  const [cptCode, setCptCode] = useState('');
  const [deductible, setDeductible] = useState('0');
  const [copay, setCopay] = useState('0');
  const [coinsurance, setCoinsurance] = useState('20');
  const [insuranceAllowed, setInsuranceAllowed] = useState('5000');
  const [estimate, setEstimate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cptCode) {
      setError('Please enter a CPT code');
      return;
    }

    try {
      const result = await onEstimate({
        cpt_code: cptCode,
        deductible_remaining: parseInt(deductible) || 0,
        copay: parseInt(copay) || 0,
      });

      const outOfPocket = calculateOutOfPocket(
        parseInt(insuranceAllowed),
        parseInt(deductible),
        parseInt(copay),
        parseInt(coinsurance) / 100
      );

      setEstimate({
        ...result,
        out_of_pocket: outOfPocket,
        insurance_responsibility: parseInt(insuranceAllowed) - outOfPocket,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Cost Calculator</h3>

          <form onSubmit={handleCalculate} className="space-y-4">
            {/* CPT Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPT Code *
              </label>
              <input
                type="text"
                value={cptCode}
                onChange={(e) => setCptCode(e.target.value)}
                placeholder="e.g., 99213"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                disabled={loading}
              />
            </div>

            {/* Insurance Allowed Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Allowed Amount
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  value={insuranceAllowed}
                  onChange={(e) => setInsuranceAllowed(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Deductible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deductible Remaining
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  value={deductible}
                  onChange={(e) => setDeductible(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Copay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Copay
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  value={copay}
                  onChange={(e) => setCopay(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Coinsurance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coinsurance
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={coinsurance}
                  onChange={(e) => setCoinsurance(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  disabled={loading}
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Calculating...' : 'Calculate'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Cost Breakdown</h3>

          {estimate ? (
            <div className="space-y-4">
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                <p className="text-sm text-teal-700 mb-1">Your Out-of-Pocket Cost</p>
                <p className="text-4xl font-bold text-teal-600">
                  {formatPrice(estimate.out_of_pocket)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Deductible (Remaining)</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(Math.min(parseInt(insuranceAllowed), parseInt(deductible)))}
                  </span>
                </div>

                <div className="flex justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Copay</span>
                  <span className="font-semibold text-gray-900">{formatPrice(parseInt(copay))}</span>
                </div>

                <div className="flex justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Coinsurance ({coinsurance}%)</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(
                      Math.max(0, parseInt(insuranceAllowed) - Math.min(parseInt(insuranceAllowed), parseInt(deductible))) *
                        (parseInt(coinsurance) / 100)
                    )}
                  </span>
                </div>

                <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                  <span className="font-semibold text-gray-900">Insurance Pays</span>
                  <span className="text-xl font-bold text-teal-600">
                    {formatPrice(estimate.insurance_responsibility)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 border border-blue-200">
                <p>
                  💡 This estimate assumes the procedure is covered by your insurance and the provider
                  is in-network.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Fill in your information and click Calculate to see your estimated costs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
