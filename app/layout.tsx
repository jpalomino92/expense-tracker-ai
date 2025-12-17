import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { ExpenseProvider } from '@/context/expense-context';
import { ThemeProvider } from '@/context/theme-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ExpenseTracker - Manage Your Personal Finances',
  description: 'Track, analyze, and manage your expenses with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ExpenseProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </main>
          </div>
        </ExpenseProvider>
      </body>
    </html>
  );
}
