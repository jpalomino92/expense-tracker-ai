import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  subDays,
  parseISO,
} from 'date-fns';
import { DateRange, DateRangePreset } from '@/types/filter';

/**
 * Formats a date string for display
 * @param dateString ISO date string (YYYY-MM-DD)
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'MMM d, yyyy');
}

/**
 * Formats a date with relative labels
 * @param dateString ISO date string (YYYY-MM-DD)
 * @returns Relative date string (e.g., "Today", "Yesterday", or "Dec 15, 2024")
 */
export function formatRelativeDate(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE'); // Day of week
  }
  if (isThisYear(date)) {
    return format(date, 'MMM d');
  }
  return format(date, 'MMM d, yyyy');
}

/**
 * Groups expenses by date labels
 * @param dateString ISO date string
 * @returns Group label (e.g., "Today", "This Week", "Older")
 */
export function getDateGroupLabel(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (isThisWeek(date)) {
    return 'This Week';
  }
  if (isThisMonth(date)) {
    return 'This Month';
  }
  return 'Older';
}

/**
 * Gets date range from preset
 * @param preset Date range preset
 * @returns DateRange object
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date();

  switch (preset) {
    case DateRangePreset.ALL_TIME:
      return { from: null, to: null };

    case DateRangePreset.TODAY:
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      };

    case DateRangePreset.YESTERDAY: {
      const yesterday = subDays(now, 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
      };
    }

    case DateRangePreset.THIS_WEEK:
      return {
        from: startOfWeek(now),
        to: endOfWeek(now),
      };

    case DateRangePreset.THIS_MONTH:
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
      };

    case DateRangePreset.LAST_30_DAYS:
      return {
        from: startOfDay(subDays(now, 30)),
        to: endOfDay(now),
      };

    case DateRangePreset.LAST_90_DAYS:
      return {
        from: startOfDay(subDays(now, 90)),
        to: endOfDay(now),
      };

    case DateRangePreset.THIS_YEAR:
      return {
        from: startOfYear(now),
        to: endOfYear(now),
      };

    case DateRangePreset.CUSTOM:
      return { from: null, to: null };

    default:
      return { from: null, to: null };
  }
}

/**
 * Checks if a date is within a date range
 * @param dateString ISO date string
 * @param range DateRange object
 * @returns True if date is within range
 */
export function isDateInRange(dateString: string, range: DateRange): boolean {
  if (!range.from && !range.to) {
    return true; // No filter applied
  }

  const date = parseISO(dateString);

  if (range.from && range.to) {
    return date >= range.from && date <= range.to;
  }

  if (range.from) {
    return date >= range.from;
  }

  if (range.to) {
    return date <= range.to;
  }

  return true;
}
