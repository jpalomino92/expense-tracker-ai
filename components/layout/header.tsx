'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { Navigation } from './navigation';

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-primary-500 p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ExpenseTracker</span>
          </Link>

          {/* Navigation */}
          <Navigation />
        </div>
      </div>
    </header>
  );
}
