'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [procedure, setProcedure] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedure || !zip) return;

    setLoading(true);
    try {
      router.push(`/search?procedure=${encodeURIComponent(procedure)}&zip=${zip}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
      {/* Hero Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
          {/* Headline */}
          <h1 className="h1-hero text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text mb-6">
            Find Healthcare Prices in Seconds
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Search and compare procedure costs across hospitals and providers. Get instant price
            estimates with your insurance information.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex flex-col gap-4 max-w-3xl mx-auto mb-12">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Procedure Input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by procedure, CPT code, or keyword..."
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200"
                  disabled={loading}
                  required
                />
              </div>

              {/* ZIP Code Input */}
              <div className="w-full sm:w-40">
                <input
                  type="text"
                  placeholder="ZIP code"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.slice(0, 5))}
                  maxLength={5}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200"
                  disabled={loading}
                  required
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={loading || !procedure || !zip}
                className="px-8 py-4 bg-teal-600 text-white font-semibold text-lg rounded-xl hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 whitespace-nowrap"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Helper Text */}
            <p className="text-sm text-gray-500">
              💡 Example: Search "99214" (office visit) or "knee replacement" in your ZIP code
            </p>
          </form>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {/* Card 1: Price Comparison */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 card-hover border border-gray-100">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="h3-subsection mb-3 text-gray-900">Compare Prices</h3>
              <p className="text-gray-600">
                See cash and insurance rates from multiple providers instantly.
              </p>
            </div>

            {/* Card 2: Benchmarking */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 card-hover border border-gray-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="h3-subsection mb-3 text-gray-900">Benchmark Data</h3>
              <p className="text-gray-600">
                View national percentiles and find providers above or below average cost.
              </p>
            </div>

            {/* Card 3: Cost Estimator */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 card-hover border border-gray-100">
              <div className="text-4xl mb-4">🧮</div>
              <h3 className="h3-subsection mb-3 text-gray-900">Out-of-Pocket</h3>
              <p className="text-gray-600">
                Calculate your actual costs with insurance details and deductibles.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/benchmark"
              className="px-6 py-3 text-teal-600 font-semibold hover:text-teal-700 transition-colors duration-200"
            >
              View Benchmarks →
            </a>
            <a
              href="/estimator"
              className="px-6 py-3 text-teal-600 font-semibold hover:text-teal-700 transition-colors duration-200"
            >
              Try Cost Estimator →
            </a>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-white border-t border-gray-200 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-6">
            ✓ HIPAA-Compliant Data • ✓ Real Provider Pricing • ✓ Updated Daily
          </p>
          <p className="text-sm text-gray-500">
            Healthcare price data aggregated from machine-readable files and verified sources.
          </p>
        </div>
      </section>
    </main>
  );
}
