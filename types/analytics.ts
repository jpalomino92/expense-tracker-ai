import { ExpenseCategory } from './expense';

/**
 * Summary statistics
 */
export interface ExpenseSummary {
  totalSpending: number;
  monthlySpending: number;
  transactionCount: number;
  averageTransaction: number;
  topCategory: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  } | null;
}

/**
 * Category spending breakdown
 */
export interface CategorySpending {
  category: ExpenseCategory;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * Time-series data point
 */
export interface SpendingDataPoint {
  date: string; // YYYY-MM-DD
  amount: number;
  count: number;
}

/**
 * Chart data for visualization
 */
export interface ChartData {
  daily: SpendingDataPoint[];
  weekly: SpendingDataPoint[];
  monthly: SpendingDataPoint[];
}
