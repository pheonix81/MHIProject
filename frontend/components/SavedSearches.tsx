'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { getUserIdForApi } from '@/lib/testUser';
import { Loader2, Save, Trash2, ChevronDown } from 'lucide-react';

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  search_query: any;
  result_count: number;
  last_executed_at?: string;
  created_at: string;
}

export interface SavedSearchesProps {
  currentQuery?: any;
  onLoadSearch?: (query: any) => void;
  userId?: string;
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({
  currentQuery,
  onLoadSearch,
  userId,
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Get user ID from props, localStorage, or generate test user ID
  const userIdForRequest = userId || (typeof window !== 'undefined' ? getUserIdForApi() : 'test-user');

  // Fetch saved searches
  useEffect(() => {
    if (isOpen && userIdForRequest) {
      fetchSavedSearches();
    }
  }, [isOpen, userIdForRequest]);

  const fetchSavedSearches = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/v1/saved-searches`, {
        headers: {
          'X-User-ID': userIdForRequest || 'test-user',
        },
      });

      if (!response.ok) throw new Error('Failed to load saved searches');
      const data = await response.json();
      setSavedSearches(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim() || !currentQuery) {
      setError('Please enter a name for your search');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/v1/saved-searches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userIdForRequest || 'test-user',
        },
        body: JSON.stringify({
          name: saveName,
          description: saveDescription,
          searchQuery: currentQuery,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save search');
      }

      setSaveName('');
      setSaveDescription('');
      setShowSaveDialog(false);
      fetchSavedSearches();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save search';
      setError(errorMsg);
      console.error('Save search error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSearch = (query: any) => {
    if (onLoadSearch) {
      onLoadSearch(query);
      setIsOpen(false);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm('Delete this saved search?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/saved-searches/${searchId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': userIdForRequest || 'test-user',
        },
      });

      if (!response.ok) throw new Error('Failed to delete search');
      fetchSavedSearches();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="relative">
      {/* Save Current Search Button */}
      <button
        onClick={() => setShowSaveDialog(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="Save current search"
      >
        <Save size={16} />
        <span className="text-sm font-medium">Save Search</span>
      </button>

      {/* Saved Searches Dropdown */}
      <div className="relative inline-block ml-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <span className="text-sm font-medium">Saved</span>
          {savedSearches.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-600 text-white rounded-full">
              {savedSearches.length}
            </span>
          )}
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-blue-600" />
              </div>
            ) : savedSearches.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm text-center">No saved searches yet</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="border-b border-gray-200 last:border-b-0 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handleLoadSearch(search.search_query)}
                          className="text-left w-full hover:text-blue-600 transition-colors"
                        >
                          <div className="font-medium text-sm truncate">{search.name}</div>
                          {search.description && (
                            <div className="text-xs text-gray-500 truncate">{search.description}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {search.result_count} results •{' '}
                            {search.last_executed_at
                              ? new Date(search.last_executed_at).toLocaleDateString()
                              : 'Never'}
                          </div>
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteSearch(search.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete saved search"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Save This Search</h2>

            <form onSubmit={handleSaveSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Name *
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g., Office Visits Under $200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Add notes about this search..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Search'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
