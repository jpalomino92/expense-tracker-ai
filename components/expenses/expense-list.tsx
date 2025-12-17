'use client';

import { useMemo } from 'react';
import { Expense } from '@/types/expense';
import { getDateGroupLabel } from '@/lib/date-utils';
import { ExpenseItem } from './expense-item';
import { Receipt } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  // Group expenses by date label
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};

    expenses.forEach((expense) => {
      const label = getDateGroupLabel(expense.date);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(expense);
    });

    // Define order for groups
    const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

    return groupOrder
      .filter((label) => groups[label])
      .map((label) => ({
        label,
        expenses: groups[label],
      }));
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
          <Receipt className="h-12 w-12 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No expenses yet</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
          Start tracking your expenses by adding your first transaction.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedExpenses.map((group) => (
        <div key={group.label}>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.expenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
