/**
 * Expense categories
 */
export enum ExpenseCategory {
  FOOD = 'Food',
  TRANSPORTATION = 'Transportation',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  BILLS = 'Bills',
  OTHER = 'Other',
}

/**
 * Core expense data structure
 */
export interface Expense {
  id: string; // UUID v4
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  amount: number; // In cents to avoid floating point issues
  category: ExpenseCategory;
  description: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Category metadata for UI
 */
export interface CategoryConfig {
  label: string;
  value: ExpenseCategory;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  bgColor: string; // Background color class
}

/**
 * Input for creating/updating expenses
 */
export interface ExpenseInput {
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
}

/**
 * Expense context actions
 */
export interface ExpenseActions {
  addExpense: (expense: ExpenseInput) => void;
  updateExpense: (id: string, expense: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
  clearAllExpenses: () => void;
}
