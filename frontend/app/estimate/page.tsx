'use client';

import { useEstimate } from '@/hooks/useEstimate';
import { CostEstimator } from '@/components/CostEstimator';

export default function EstimatePage() {
  const { loading, error, calculateEstimate } = useEstimate();

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cost Estimator</h1>
        <p className="text-gray-600 mb-8">
          Calculate your expected out-of-pocket costs for any procedure
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            Error: {error}
          </div>
        )}

        <CostEstimator onEstimate={calculateEstimate} loading={loading} />
      </div>
    </main>
  );
}
