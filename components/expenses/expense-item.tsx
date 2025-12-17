'use client';

import { Expense } from '@/types/expense';
import { CATEGORY_CONFIG } from '@/constants/categories';
import { formatCurrency } from '@/lib/currency';
import { formatRelativeDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const categoryConfig = CATEGORY_CONFIG[expense.category];
  const IconComponent = Icons[categoryConfig.icon as keyof typeof Icons] as React.FC<{
    className?: string;
  }>;

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all">
      {/* Category Icon */}
      <div className={cn('p-3 rounded-lg', categoryConfig.bgColor)}>
        {IconComponent && (
          <IconComponent className={cn('h-5 w-5', categoryConfig.color)} />
        )}
      </div>

      {/* Expense Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">{expense.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn(categoryConfig.bgColor, categoryConfig.color)}>
                {expense.category}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatRelativeDate(expense.date)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(expense.amount)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(expense)}
          icon={<Edit2 className="h-4 w-4" />}
          aria-label="Edit expense"
        >
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(expense)}
          icon={<Trash2 className="h-4 w-4" />}
          className="text-danger hover:bg-danger-light"
          aria-label="Delete expense"
        >
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>
    </div>
  );
}
