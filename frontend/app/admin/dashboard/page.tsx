'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, TrendingUp, AlertCircle, RefreshCw, Download } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface DashboardData {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
  };
  systemMetrics: {
    totalRates: number;
    totalProviders: number;
    totalPayers: number;
    averageResponseTime: number;
    successRate: number;
  };
  searchAnalytics: {
    totalSearches: number;
    averageResultsPerSearch: number;
    topProcedures: Array<{ procedure: string; count: number }>;
    topZipCodes: Array<{ zip: string; count: number }>;
    searchesByHour: Array<{ hour: number; count: number }>;
  };
  importStats: {
    totalImports: number;
    completedImports: number;
    failedImports: number;
    totalRecordsImported: number;
    recentImports: Array<{
      id: string;
      fileName: string;
      status: string;
      totalRecords: number;
      successfulRecords: number;
      createdAt: string;
    }>;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/v1/admin/dashboard`, {
        headers: {
          'X-User-ID': 'admin',
          'X-Admin': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setData(result.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError((err as Error).message || 'Failed to load dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-red-600" />
            <h2 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h2>
          </div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const d = data!;
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">Last updated: {lastUpdated}</p>
            </div>
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Total Users</h3>
              <Users className="text-blue-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{d.userStats.totalUsers}</p>
            <p className="text-sm text-green-600 mt-2">+{d.userStats.newUsersThisWeek} this week</p>
          </div>

          {/* Active Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Active Users</h3>
              <Activity className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{d.userStats.activeUsers}</p>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round((d.userStats.activeUsers / d.userStats.totalUsers) * 100)}% of total
            </p>
          </div>

          {/* System Health Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Uptime</h3>
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{d.systemMetrics.successRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500 mt-2">API success rate</p>
          </div>

          {/* Response Time Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Response Time</h3>
              <Activity className="text-purple-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{d.systemMetrics.averageResponseTime}ms</p>
            <p className="text-sm text-gray-500 mt-2">Average API latency</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Searches by Hour */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Searches by Hour</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={d.searchAnalytics.searchesByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  name="Searches"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Procedures */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Procedures</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={d.searchAnalytics.topProcedures}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="procedure" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Import Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Jobs</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Imports</p>
                <p className="text-2xl font-bold text-gray-900">{d.importStats.totalImports}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-green-600">{d.importStats.completedImports}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-xl font-bold text-red-600">{d.importStats.failedImports}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Records Imported</p>
                <p className="text-xl font-bold text-gray-900">
                  {d.importStats.totalRecordsImported.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Data Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Overview</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Rates</p>
                <p className="text-2xl font-bold text-gray-900">{d.systemMetrics.totalRates.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Providers</p>
                <p className="text-xl font-bold text-blue-600">{d.systemMetrics.totalProviders}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payers</p>
                <p className="text-xl font-bold text-green-600">{d.systemMetrics.totalPayers}</p>
              </div>
            </div>
          </div>

          {/* Search Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Analytics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold text-gray-900">{d.searchAnalytics.totalSearches}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Results/Search</p>
                <p className="text-xl font-bold text-purple-600">
                  {d.searchAnalytics.averageResultsPerSearch.toFixed(1)}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Top Zip Code</p>
                <p className="text-lg font-bold text-gray-900">
                  {d.searchAnalytics.topZipCodes[0]?.zip || 'N/A'} (
                  {d.searchAnalytics.topZipCodes[0]?.count || 0} searches)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Imports */}
        {d.importStats.recentImports.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Imports</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">File Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Total Records</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Successful</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {d.importStats.recentImports.map((imp) => (
                    <tr key={imp.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{imp.fileName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            imp.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : imp.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {imp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{imp.totalRecords.toLocaleString()}</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">
                        {imp.successfulRecords.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {new Date(imp.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
