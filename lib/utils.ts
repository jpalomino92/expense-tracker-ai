import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Returns current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Returns current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}
