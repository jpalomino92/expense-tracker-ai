'use client';

import { useState } from 'react';
import { Expense } from '@/types/expense';
import { useExpenses } from '@/hooks/use-expenses';
import { useFilters } from '@/hooks/use-filters';
import { ExpenseList } from '@/components/expenses/expense-list';
import { ExpenseFilters } from '@/components/expenses/expense-filters';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { DeleteExpenseModal } from '@/components/expenses/delete-expense-modal';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Plus, Download } from 'lucide-react';
import { exportExpensesToCSV } from '@/lib/csv-export';

export default function ExpensesPage() {
  const {
    filters,
    setDatePreset,
    toggleCategory,
    setSearchQuery,
    clearFilters,
    hasActiveFilters,
  } = useFilters();

  const { expenses, filteredCount, actions, isLoading } = useExpenses(filters);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const handleAddExpense = (data: any) => {
    actions.addExpense(data);
    setIsAddModalOpen(false);
  };

  const handleEditExpense = (data: any) => {
    if (editingExpense) {
      actions.updateExpense(editingExpense.id, data);
      setEditingExpense(null);
    }
  };

  const handleDeleteExpense = () => {
    if (deletingExpense) {
      actions.deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  const handleExport = () => {
    exportExpensesToCSV(expenses);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage all your expenses
          </p>
        </div>
        <div className="flex gap-3">
          {expenses.length > 0 && (
            <Button
              variant="secondary"
              icon={<Download className="h-5 w-5" />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          )}
          <Button
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ExpenseFilters
            datePreset={filters.datePreset}
            onDatePresetChange={setDatePreset}
            categories={filters.categories}
            onCategoryToggle={toggleCategory}
            searchQuery={filters.searchQuery}
            onSearchChange={setSearchQuery}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            resultCount={filteredCount}
          />
        </div>

        {/* Expense List */}
        <div className="lg:col-span-3">
          <ExpenseList
            expenses={expenses}
            onEdit={setEditingExpense}
            onDelete={setDeletingExpense}
          />
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Expense"
      >
        <ExpenseForm
          onSubmit={handleAddExpense}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
      >
        {editingExpense && (
          <ExpenseForm
            expense={editingExpense}
            onSubmit={handleEditExpense}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteExpenseModal
        expense={deletingExpense}
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteExpense}
      />
    </div>
  );
}
