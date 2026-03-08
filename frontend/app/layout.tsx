import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Healthcare Price Search | Find Procedure Costs',
  description:
    'Search and compare healthcare procedure prices, estimates, and insurance rates across providers and locations.',
  keywords: [
    'healthcare pricing',
    'price transparency',
    'medical costs',
    'procedure costs',
    'insurance rates',
  ],
  openGraph: {
    title: 'Healthcare Price Search',
    description: 'Find and compare healthcare procedure prices',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          {/* Header coming soon in Phase 3 */}
          <main className="flex-1">{children}</main>
          {/* Footer coming soon in Phase 3 */}
        </div>
      </body>
    </html>
  );
}
