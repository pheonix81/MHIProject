'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { uploadFile } from '@/lib/api';
import Link from 'next/link';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  const isAdmin = user?.user_metadata?.role === 'platform_admin';

  if (!user || !isAdmin) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin panel.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors inline-block"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const validExtensions = ['.csv', '.json', '.xlsx'];
      const isValidType = validTypes.includes(file.type) || validExtensions.some(ext => file.name.endsWith(ext));
      
      if (!isValidType) {
        setError('Please select a CSV, JSON, or XLSX file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setUploadStatus('Uploading...');
    setError(null);

    try {
      const result = await uploadFile(selectedFile, user.id);
      setUploadStatus(`Upload successful! File ID: ${result.id}`);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadStatus(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600 mb-8">Manage data imports and system configuration</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📤 Upload Data</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Import rate data via CSV, JSON, or Excel file. Each file is validated and processed.
            </p>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                  accept=".csv,.json,.xlsx"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <p className="text-4xl mb-2">📁</p>
                  <p className="text-gray-700 font-medium mb-1">
                    {selectedFile ? selectedFile.name : 'Choose a file'}
                  </p>
                  <p className="text-sm text-gray-500">
                    or drag and drop (CSV, JSON, XLSX up to 10MB)
                  </p>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {uploadStatus && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm">
                  {uploadStatus}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>

          {/* Import Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Recent Uploads</h2>
            <p className="text-gray-600 mb-4">Track ongoing and completed imports</p>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">No recent uploads</p>
                <p className="text-sm text-gray-600">Upload a file to get started</p>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🏥 System Health</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-700">Database Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Online</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-700">API Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Healthy</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-700">Total Records</span>
                <span className="font-semibold text-gray-900">1,000,000+</span>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Configuration</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                Manage Users
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                View Audit Logs
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                System Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
