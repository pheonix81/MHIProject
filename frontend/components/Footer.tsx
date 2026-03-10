'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">💊 HealthPrice</h3>
            <p className="text-gray-400 text-sm">
              Transparent healthcare pricing for everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-400 hover:text-white">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/benchmark" className="text-gray-400 hover:text-white">
                  Benchmark
                </Link>
              </li>
              <li>
                <Link href="/estimate" className="text-gray-400 hover:text-white">
                  Estimate
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  HIPAA Compliance
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@healthprice.com" className="text-gray-400 hover:text-white">
                  support@healthprice.com
                </a>
              </li>
              <li>
                <a href="tel:+1-555-0123" className="text-gray-400 hover:text-white">
                  +1 (555) 0123
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 HealthPrice. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
