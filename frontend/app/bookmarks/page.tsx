'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { getUserIdForApi } from '@/lib/testUser';
import { formatPrice } from '@/lib/utils';
import { Loader2, Trash2 } from 'lucide-react';

interface BookmarkedRate {
  id: string;
  rate_id: string;
  notes?: string;
  created_at: string;
  rate?: {
    cash_price: number;
    insurance_price: number;
    cpt_code: string;
    procedure_name: string;
    provider_name: string;
    payer_name: string;
  };
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const userIdFromStorage =
    typeof window !== 'undefined' ? getUserIdForApi() : 'test-user';

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/v1/bookmarks`, {
        headers: {
          'X-User-ID': userIdFromStorage || 'test-user',
        },
      });

      if (!response.ok) throw new Error('Failed to load bookmarks');
      const data = await response.json();
      setBookmarks(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    if (!confirm('Remove this bookmark?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': userIdFromStorage || 'test-user',
        },
      });

      if (!response.ok) throw new Error('Failed to delete bookmark');
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
        <p className="text-gray-600 mb-8">
          {bookmarks.length} saved {bookmarks.length === 1 ? 'item' : 'items'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading bookmarks...</span>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No bookmarks yet</p>
            <p className="text-gray-500 text-sm mt-2">Click the bookmark button on search results to save items</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {bookmark.rate?.procedure_name || 'Unknown'}
                    </h3>
                    <button
                      onClick={() => handleDelete(bookmark.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove bookmark"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded">
                      {bookmark.rate?.cpt_code || '—'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{bookmark.rate?.provider_name || '—'}</p>

                  {bookmark.notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                      <p className="text-xs font-medium text-blue-900">Notes:</p>
                      <p className="text-xs text-blue-800 mt-1">{bookmark.notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cash Price:</span>
                    <span className="font-bold text-gray-900">
                      {formatPrice(bookmark.rate?.cash_price || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Insurance Price:</span>
                    <span className="font-bold text-teal-600">
                      {formatPrice(bookmark.rate?.insurance_price || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payer:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {bookmark.rate?.payer_name || '—'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-200">
                  Saved {new Date(bookmark.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
