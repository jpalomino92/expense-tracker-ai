import { unparse } from 'papaparse';
import { Expense } from '@/types/expense';
import { formatDate } from './date-utils';
import { formatCurrency } from './currency';

/**
 * Exports expenses to CSV file
 * @param expenses Array of expenses to export
 * @param filename Optional filename (defaults to expenses-YYYY-MM-DD.csv)
 */
export function exportExpensesToCSV(expenses: Expense[], filename?: string): void {
  // Prepare data for CSV
  const data = expenses.map((expense) => ({
    Date: formatDate(expense.date),
    Category: expense.category,
    Description: expense.description,
    Amount: formatCurrency(expense.amount),
    'Amount (cents)': expense.amount,
  }));

  // Convert to CSV
  const csv = unparse(data);

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const defaultFilename = `expenses-${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename || defaultFilename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
