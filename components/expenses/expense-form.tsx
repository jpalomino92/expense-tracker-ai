'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, ExpenseFormData } from '@/validations/expense-schema';
import { Expense, ExpenseCategory } from '@/types/expense';
import { CATEGORIES } from '@/constants/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { dollarsToCents, centsToDollars } from '@/lib/currency';
import { getCurrentDate } from '@/lib/utils';

interface ExpenseFormProps {
  expense?: Expense; // For editing
  onSubmit: (data: ExpenseFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? {
          date: expense.date,
          amount: centsToDollars(expense.amount),
          category: expense.category,
          description: expense.description,
        }
      : {
          date: getCurrentDate(),
          amount: 0,
          category: ExpenseCategory.OTHER,
          description: '',
        },
  });

  const dateValue = watch('date');

  const handleFormSubmit = (data: ExpenseFormData) => {
    // Convert dollars to cents
    const formattedData = {
      ...data,
      amount: dollarsToCents(data.amount),
    };
    onSubmit(formattedData);
  };

  const categoryOptions = CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <DatePicker
        label="Date"
        value={dateValue}
        onChange={(date) => setValue('date', date)}
        error={errors.date?.message}
      />

      <Input
        label="Amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register('amount', { valueAsNumber: true })}
      />

      <Select
        label="Category"
        options={categoryOptions}
        error={errors.category?.message}
        {...register('category')}
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="What did you spend on?"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-danger">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          {expense ? 'Update Expense' : 'Add Expense'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
