'use client';

import Link from 'next/link';
import { Expense } from '@/types/expense';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_CONFIG } from '@/constants/categories';
import { formatCurrency } from '@/lib/currency';
import { formatRelativeDate } from '@/lib/date-utils';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentExpensesProps {
  expenses: Expense[];
  limit?: number;
}

export function RecentExpenses({ expenses, limit = 5 }: RecentExpensesProps) {
  const recentExpenses = expenses.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Expenses</CardTitle>
          {expenses.length > 0 && (
            <Link
              href="/expenses"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No expenses yet. Start by adding your first transaction.
          </div>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => {
              const config = CATEGORY_CONFIG[expense.category];
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {expense.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn(config.bgColor, config.color, 'text-xs')}>
                        {expense.category}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeDate(expense.date)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white ml-4">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
