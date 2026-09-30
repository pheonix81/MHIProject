'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  changes: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  success: boolean;
  data: {
    logs: AuditLog[];
    total: number;
    page: number;
    pages: number;
  };
  message?: string;
}

const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT'];
const TABLES = ['rates', 'procedures', 'providers', 'payers', 'users', 'saved_searches', 'bookmarks', 'audit_logs', 'import_jobs'];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedTable, setSelectedTable] = useState('');

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '25');
      if (selectedAction) params.append('action', selectedAction);
      if (selectedTable) params.append('tableName', selectedTable);

      const response = await fetch(
        `${API_BASE_URL}/v1/admin/audit-logs?${params.toString()}`,
        {
          headers: {
            'X-User-ID': 'admin',
            'X-Admin': 'true',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const result: AuditLogsResponse = await response.json();
      setLogs(result.data.logs);
      setPage(result.data.page);
      setTotalPages(result.data.pages);
      setTotal(result.data.total);
    } catch (err) {
      setError((err as Error).message || 'Failed to load audit logs');
      console.error('Audit logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAction, selectedTable]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [fetchLogs]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'EXPORT':
        return 'bg-purple-100 text-purple-800';
      case 'IMPORT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Total entries: {total.toLocaleString()}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tables</option>
                {TABLES.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => fetchLogs(page)}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading && logs.length === 0 ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Table</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Record ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Timestamp</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">IP Address</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{log.tableName}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{log.userId || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                        {log.recordId ? log.recordId.substring(0, 8) + '...' : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{log.ipAddress || '-'}</td>
                      <td className="py-3 px-4">
                        {!!log.changes && (
                          <button
                            onClick={() =>
                              setExpandedLogId(expandedLogId === log.id ? null : log.id)
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {expandedLogId === log.id ? 'Hide' : 'View'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Change Details */}
          {expandedLogId && !!logs.find((l) => l.id === expandedLogId)?.changes && (
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Changes</h3>
              <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-auto max-h-80 text-xs">
                {JSON.stringify(logs.find((l) => l.id === expandedLogId)?.changes, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page === 1 || loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchLogs(p)}
                  disabled={loading}
                  className={`w-10 h-10 rounded-lg font-semibold ${
                    page === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page === totalPages || loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
