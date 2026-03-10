'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase';
import { AuthModal } from './AuthModal';

export function Header() {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                💊 HealthPrice
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-700 hover:text-teal-600 font-medium">
                Home
              </Link>
              <Link href="/search" className="text-gray-700 hover:text-teal-600 font-medium">
                Search
              </Link>
              <Link href="/benchmark" className="text-gray-700 hover:text-teal-600 font-medium">
                Benchmark
              </Link>
              <Link href="/estimate" className="text-gray-700 hover:text-teal-600 font-medium">
                Estimate
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="px-4 py-2 bg-teal-50 text-teal-700 font-medium rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    {user.email}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/bookmarks"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 border-t border-gray-200"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Bookmarks
                      </Link>
                      {user.user_metadata?.role === 'platform_admin' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50 border-t border-gray-200"
                          onClick={() => setMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 border-t border-gray-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={() => {}} />
    </>
  );
}
