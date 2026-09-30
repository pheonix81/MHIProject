'use client';

import React, { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Download, Loader2 } from 'lucide-react';

export interface ExportDialogProps {
  currentQuery?: {
    procedure_name?: string;
    zip_code?: string;
    cpt_code?: string;
    payer_id?: string;
    limit?: number;
    offset?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ currentQuery, isOpen, onClose }) => {
  const { user } = useAuth();
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    if (!user) {
      setError('You must be logged in to export results');
      return;
    }

    if (!currentQuery) {
      setError('No search query to export');
      return;
    }

    setIsExporting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/v1/export/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user!.id,
        },
        body: JSON.stringify({
          searchQuery: currentQuery,
          format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Invalid export response');
      }

      // Download file
      const blob = new Blob([data.data.content], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.data.filename || `search_results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Export Results</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">CSV (Excel compatible)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">JSON (Data format)</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
