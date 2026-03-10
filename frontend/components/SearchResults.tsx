'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { BookmarkButton } from './BookmarkButton';
import { ExportDialog } from './ExportDialog';
import { Download } from 'lucide-react';

interface SearchResult {
  id: string;
  cpt_code: string;
  procedure_name: string;
  category?: string;
  cash_price: number;
  insurance_allowed_amount: number;
  payer_name: string;
  provider_zip?: string;
  provider_name?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    pages: number;
  };
  statistics: {
    min_price: number;
    max_price: number;
    avg_price: number;
  };
  loading: boolean;
  onPageChange: (offset: number) => void;
  currentQuery?: {
    procedure_name?: string;
    zip_code?: string;
    cpt_code?: string;
    payer_id?: string;
    limit?: number;
    offset?: number;
  };
}

export function SearchResults({
  results,
  pagination,
  statistics,
  loading,
  onPageChange,
  currentQuery,
}: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'category'>('price');
  const [showExport, setShowExport] = useState(false);

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'price') {
      return a.insurance_allowed_amount - b.insurance_allowed_amount;
    } else if (sortBy === 'category') {
      return (a.category || '').localeCompare(b.category || '');
    }
    return a.procedure_name.localeCompare(b.procedure_name);
  });

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  // Only show results UI if we have results
  if (results.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Statistics Bar - Only show if we have results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-100">
          <div className="text-center p-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Lowest Price</p>
            <p className="text-3xl font-bold text-teal-600 mt-1">{formatPrice(statistics.min_price)}</p>
          </div>
          <div className="text-center p-2 border-l border-r border-teal-200 sm:border-l sm:border-r">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Average Price</p>
            <p className="text-3xl font-bold text-teal-600 mt-1">{formatPrice(statistics.avg_price)}</p>
          </div>
          <div className="text-center p-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Highest Price</p>
            <p className="text-3xl font-bold text-teal-600 mt-1">{formatPrice(statistics.max_price)}</p>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <p className="text-gray-700 font-medium">
          Found <span className="text-teal-600 font-bold text-lg">{pagination.total}</span> {pagination.total === 1 ? 'result' : 'results'}
        </p>
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'price' | 'name' | 'category')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 flex-1 sm:flex-none"
          >
            <option value="price">Sort by Price (Low to High)</option>
            <option value="name">Sort by Procedure Name</option>
            <option value="category">Sort by Category</option>
          </select>
          {results.length > 0 && (
            <button
              onClick={() => setShowExport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download size={16} />
              <span className="text-sm">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog currentQuery={currentQuery} isOpen={showExport} onClose={() => setShowExport(false)} />

      {/* Results Table */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No results found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search filters or parameters</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Procedure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    CPT Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ZIP
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Cash Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Insurance Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Payer
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedResults.map((result) => (
                  <tr
                    key={result.id}
                    className="hover:bg-teal-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{result.procedure_name}</td>
                    <td className="px-6 py-4 text-sm font-mono font-bold text-teal-600 bg-teal-50 rounded">{result.cpt_code}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {result.category || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{result.provider_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono font-semibold">{result.provider_zip || '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                      {formatPrice(result.cash_price)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-teal-600 text-right bg-teal-50 rounded">
                      {formatPrice(result.insurance_allowed_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{result.payer_name}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <BookmarkButton rateId={result.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                onClick={() => onPageChange(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors"
              >
                ← Previous
              </button>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">
                  Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{pagination.pages}</span>
                </span>
              </div>
              <button
                onClick={() =>
                  onPageChange(Math.min(pagination.offset + pagination.limit, pagination.total - 1))
                }
                disabled={currentPage >= pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
