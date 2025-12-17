'use client';

import { useState } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown';
import { RecentExpenses } from '@/components/dashboard/recent-expenses';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Plus, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { allExpenses, summary, categoryBreakdown, chartData, actions, isLoading } =
    useExpenses();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddExpense = (data: any) => {
    actions.addExpense(data);
    setIsAddModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your spending and expenses
          </p>
        </div>
        <Button
          icon={<Plus className="h-5 w-5" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {allExpenses.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-primary-100 dark:bg-primary-900/20 p-6 rounded-full mb-6">
            <TrendingUp className="h-16 w-16 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Start Tracking Your Expenses
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
            Add your first expense to see insights, charts, and analytics about your spending
            habits.
          </p>
          <Button
            size="lg"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Your First Expense
          </Button>
        </div>
      ) : (
        /* Dashboard Content */
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendingChart chartData={chartData} />
            <CategoryBreakdown breakdown={categoryBreakdown} />
          </div>

          {/* Recent Expenses */}
          <RecentExpenses expenses={allExpenses} />
        </>
      )}

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
    </div>
  );
}
