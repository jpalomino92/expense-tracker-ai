import { Expense } from '@/types/expense';

const STORAGE_KEY = 'expense-tracker-expenses';

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Loads expenses from localStorage
 */
export function loadExpenses(): Expense[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.error('Invalid expenses data in localStorage');
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Error loading expenses from localStorage:', error);
    return [];
  }
}

/**
 * Saves expenses to localStorage
 */
export function saveExpenses(expenses: Expense[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const serialized = JSON.stringify(expenses);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Error saving expenses to localStorage:', error);

    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert(
        'Storage quota exceeded. Please export and delete some old expenses to free up space.'
      );
    }
  }
}

/**
 * Clears all expenses from localStorage
 */
export function clearExpenses(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing expenses from localStorage:', error);
  }
}

/**
 * Gets storage usage information
 */
export function getStorageInfo(): { used: number; total: number } | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY) || '';
    const used = new Blob([stored]).size;
    const total = 5 * 1024 * 1024; // Typical localStorage limit is 5MB

    return { used, total };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
}
