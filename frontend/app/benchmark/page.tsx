'use client';

import { useState } from 'react';
import { useBenchmark } from '@/hooks/useBenchmark';
import { BenchmarkChart } from '@/components/BenchmarkChart';
import { validateCPTCode } from '@/lib/utils';

export default function BenchmarkPage() {
  const { benchmarkData, loading, error, fetchBenchmark } = useBenchmark();
  const [cptCode, setCptCode] = useState('');
  const [zip, setZip] = useState('');
  const [payerType, setPayerType] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    if (!cptCode) {
      setSearchError('Please enter a CPT code');
      return;
    }

    if (!validateCPTCode(cptCode)) {
      setSearchError('CPT code must be 5 digits');
      return;
    }

    try {
      await fetchBenchmark({
        cpt_code: cptCode,
        zip_code: zip || undefined,
        payer_type: payerType || undefined,
      });
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Benchmark</h1>
        <p className="text-gray-600 mb-8">
          View price distribution and percentiles for any procedure
        </p>

        {/* Search Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value.slice(0, 5))}
                maxLength={5}
                placeholder="94105"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Type
              </label>
              <select
                value={payerType}
                onChange={(e) => setPayerType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                disabled={loading}
              >
                <option value="">All Types</option>
                <option value="PPO">PPO</option>
                <option value="HMO">HMO</option>
                <option value="Medicare">Medicare</option>
                <option value="Medicaid">Medicaid</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </form>

          {(searchError || error) && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {searchError || error}
            </div>
          )}
        </div>

        {/* Benchmark Chart */}
        <BenchmarkChart benchmarkData={benchmarkData} loading={loading} />
      </div>
    </main>
  );
}
