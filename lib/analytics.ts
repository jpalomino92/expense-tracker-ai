import {
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  subDays,
} from 'date-fns';
import { Expense, ExpenseCategory } from '@/types/expense';
import {
  ExpenseSummary,
  CategorySpending,
  SpendingDataPoint,
  ChartData,
} from '@/types/analytics';

/**
 * Calculates summary statistics for expenses
 */
export function calculateSummary(expenses: Expense[]): ExpenseSummary {
  if (expenses.length === 0) {
    return {
      totalSpending: 0,
      monthlySpending: 0,
      transactionCount: 0,
      averageTransaction: 0,
      topCategory: null,
    };
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Calculate totals
  const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const transactionCount = expenses.length;
  const averageTransaction = totalSpending / transactionCount;

  // Calculate monthly spending
  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = parseISO(expense.date);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });
  const monthlySpending = monthlyExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Find top category
  const categoryTotals = calculateCategoryBreakdown(expenses);
  const topCategory =
    categoryTotals.length > 0
      ? {
          category: categoryTotals[0].category,
          amount: categoryTotals[0].amount,
          percentage: categoryTotals[0].percentage,
        }
      : null;

  return {
    totalSpending,
    monthlySpending,
    transactionCount,
    averageTransaction,
    topCategory,
  };
}

/**
 * Calculates spending breakdown by category
 */
export function calculateCategoryBreakdown(
  expenses: Expense[]
): CategorySpending[] {
  if (expenses.length === 0) {
    return [];
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Group by category
  const categoryMap = new Map<ExpenseCategory, { amount: number; count: number }>();

  expenses.forEach((expense) => {
    const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
    categoryMap.set(expense.category, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    });
  });

  // Convert to array and calculate percentages
  const breakdown: CategorySpending[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: (data.amount / total) * 100,
    })
  );

  // Sort by amount (descending)
  return breakdown.sort((a, b) => b.amount - a.amount);
}

/**
 * Generates time-series data for charts
 */
export function generateChartData(expenses: Expense[]): ChartData {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const ninetyDaysAgo = subDays(now, 90);

  // Daily data (last 30 days)
  const daily = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: now,
  }).map((date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const dayExpenses = expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= dayStart && expenseDate <= dayEnd;
    });

    return {
      date: format(date, 'yyyy-MM-dd'),
      amount: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      count: dayExpenses.length,
    };
  });

  // Weekly data (last 90 days)
  const weekly = eachWeekOfInterval({
    start: ninetyDaysAgo,
    end: now,
  }).map((date) => {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);

    const weekExpenses = expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= weekStart && expenseDate <= weekEnd;
    });

    return {
      date: format(weekStart, 'yyyy-MM-dd'),
      amount: weekExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      count: weekExpenses.length,
    };
  });

  // Monthly data (last 12 months)
  const twelveMonthsAgo = subDays(now, 365);
  const monthly = eachMonthOfInterval({
    start: twelveMonthsAgo,
    end: now,
  }).map((date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const monthExpenses = expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    return {
      date: format(monthStart, 'yyyy-MM-dd'),
      amount: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      count: monthExpenses.length,
    };
  });

  return { daily, weekly, monthly };
}
