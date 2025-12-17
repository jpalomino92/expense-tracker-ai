'use client';

import { useMemo } from 'react';
import { useExpenseContext } from '@/context/expense-context';
import { Expense } from '@/types/expense';
import { ExpenseFilters } from '@/types/filter';
import { isDateInRange } from '@/lib/date-utils';
import { calculateSummary, calculateCategoryBreakdown, generateChartData } from '@/lib/analytics';

/**
 * Main hook for accessing and filtering expense data
 */
export function useExpenses(filters?: Partial<ExpenseFilters>) {
  const { expenses, actions, isLoading } = useExpenseContext();

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Apply date range filter
    if (filters?.dateRange) {
      result = result.filter((expense) =>
        isDateInRange(expense.date, filters.dateRange)
      );
    }

    // Apply category filter
    if (filters?.categories && filters.categories.length > 0) {
      result = result.filter((expense) =>
        filters.categories!.includes(expense.category)
      );
    }

    // Apply search filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter((expense) =>
        expense.description.toLowerCase().includes(query)
      );
    }

    // Sort
    const sortBy = filters?.sortBy || 'date';
    const sortOrder = filters?.sortOrder || 'desc';

    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [expenses, filters]);

  // Calculate summary (memoized)
  const summary = useMemo(() => calculateSummary(expenses), [expenses]);

  // Calculate filtered summary
  const filteredSummary = useMemo(
    () => calculateSummary(filteredExpenses),
    [filteredExpenses]
  );

  // Calculate category breakdown
  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(expenses),
    [expenses]
  );

  // Generate chart data
  const chartData = useMemo(() => generateChartData(expenses), [expenses]);

  return {
    // Data
    expenses: filteredExpenses,
    allExpenses: expenses,

    // Analytics
    summary,
    filteredSummary,
    categoryBreakdown,
    chartData,

    // Actions
    actions,

    // State
    isLoading,
    isEmpty: expenses.length === 0,
    filteredCount: filteredExpenses.length,
    totalCount: expenses.length,
  };
}
