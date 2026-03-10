'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { SearchResults } from '@/components/SearchResults';
import { SavedSearches } from '@/components/SavedSearches';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { results, pagination, statistics, loading, error, search } = useSearch();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const procedureName = searchParams.get('procedure');
    const zip = searchParams.get('zip');
    const cptCode = searchParams.get('cpt_code');
    const payerId = searchParams.get('payer_id');

    if (procedureName || zip || cptCode || payerId) {
      search({
        procedure_name: procedureName || undefined,
        zip_code: zip || undefined,
        cpt_code: cptCode || undefined,
        payer_id: payerId || undefined,
        limit: 20,
        offset,
      });
    }
  }, [searchParams, offset, search]);

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };

  // Build current search query for export/save
  const currentQuery = {
    procedure_name: searchParams.get('procedure') || undefined,
    zip_code: searchParams.get('zip') || undefined,
    cpt_code: searchParams.get('cpt_code') || undefined,
    payer_id: searchParams.get('payer_id') || undefined,
    limit: 20,
    offset,
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
          <p className="text-gray-600 mb-4">
            Showing results for:{' '}
            {searchParams.get('procedure') || searchParams.get('cpt_code') || 'procedures'}
            {searchParams.get('zip') && ` in ${searchParams.get('zip')}`}
          </p>
          <SavedSearches currentQuery={{
            procedure_name: searchParams.get('procedure') || '',
            zip_code: searchParams.get('zip') || '',
            cpt_code: searchParams.get('cpt_code') || '',
            payer_id: searchParams.get('payer_id') || '',
          }} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            <p className="font-semibold">Search Error</p>
            <p>{error}</p>
          </div>
        )}

        {!error && results.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium text-lg">No Results Found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search criteria or filters</p>
          </div>
        )}

        {(error || results.length > 0 || loading) && (
          <SearchResults
            results={results}
            pagination={pagination}
            statistics={statistics}
            loading={loading}
            onPageChange={handlePageChange}
            currentQuery={currentQuery}
          />
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
