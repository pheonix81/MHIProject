'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access your dashboard.
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

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome, {user.email}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Saved Searches */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📌 Saved Searches</h2>
            <p className="text-gray-600 mb-4">You haven&apos;t saved any searches yet.</p>
            <Link
              href="/search"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Start searching →
            </Link>
          </div>

          {/* Bookmarks */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⭐ Bookmarks</h2>
            <p className="text-gray-600 mb-4">Bookmark procedures for quick access.</p>
            <button className="text-teal-600 hover:text-teal-700 font-medium cursor-not-allowed opacity-50">
              Coming soon
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Recent Activity</h2>
            <p className="text-gray-600 mb-4">Your recent searches and estimates.</p>
            <button className="text-teal-600 hover:text-teal-700 font-medium cursor-not-allowed opacity-50">
              Coming soon
            </button>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Account Settings</h2>
            <p className="text-gray-600 mb-4">Manage your profile and preferences.</p>
            <button className="text-teal-600 hover:text-teal-700 font-medium cursor-not-allowed opacity-50">
              Coming soon
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-teal-50 rounded-lg border border-teal-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/search"
              className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors text-center"
            >
              Search Procedures
            </Link>
            <Link
              href="/benchmark"
              className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors text-center"
            >
              View Benchmarks
            </Link>
            <Link
              href="/estimate"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              Calculate Costs
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
