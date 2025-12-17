import { ExpenseCategory } from './expense';

/**
 * Date range filter
 */
export interface DateRange {
  from: Date | null;
  to: Date | null;
}

/**
 * Preset date ranges
 */
export enum DateRangePreset {
  ALL_TIME = 'all_time',
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  THIS_MONTH = 'this_month',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

/**
 * All filter options
 */
export interface ExpenseFilters {
  dateRange: DateRange;
  datePreset: DateRangePreset;
  categories: ExpenseCategory[];
  searchQuery: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}
