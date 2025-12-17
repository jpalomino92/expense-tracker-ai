'use client';

import { Expense } from '@/types/expense';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle } from 'lucide-react';

interface DeleteExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteExpenseModal({
  expense,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteExpenseModalProps) {
  if (!expense) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="bg-danger-light dark:bg-red-900/20 p-3 rounded-full inline-flex mb-4">
          <AlertTriangle className="h-6 w-6 text-danger dark:text-red-400" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete Expense?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this expense? This action cannot be undone.
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Description:</span>
              <span className="font-medium text-gray-900 dark:text-white">{expense.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(expense.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Category:</span>
              <span className="font-medium text-gray-900 dark:text-white">{expense.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(expense.date)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isDeleting}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
