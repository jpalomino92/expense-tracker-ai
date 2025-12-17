import { z } from 'zod';
import { ExpenseCategory } from '@/types/expense';

/**
 * Expense form validation schema
 */
export const expenseSchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
    .refine((date) => new Date(date) <= new Date(), 'Date cannot be in the future'),

  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(1000000, 'Amount is too large')
    .refine((amount) => Number.isFinite(amount), 'Invalid amount'),

  category: z.nativeEnum(ExpenseCategory, {
    errorMap: () => ({ message: 'Please select a category' }),
  }),

  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description is too long')
    .trim(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
