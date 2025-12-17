'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Expense, ExpenseInput, ExpenseActions } from '@/types/expense';
import { loadExpenses, saveExpenses, clearExpenses } from '@/lib/storage';
import { generateId, getCurrentTimestamp } from '@/lib/utils';

interface ExpenseContextType {
  expenses: Expense[];
  actions: ExpenseActions;
  isLoading: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load expenses from localStorage on mount
  useEffect(() => {
    const loaded = loadExpenses();
    setExpenses(loaded);
    setIsLoading(false);
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveExpenses(expenses);
    }
  }, [expenses, isLoading]);

  const actions: ExpenseActions = {
    addExpense: (input: ExpenseInput) => {
      const newExpense: Expense = {
        id: generateId(),
        ...input,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      };

      setExpenses((prev) => [...prev, newExpense]);
    },

    updateExpense: (id: string, input: ExpenseInput) => {
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === id
            ? {
                ...expense,
                ...input,
                updatedAt: getCurrentTimestamp(),
              }
            : expense
        )
      );
    },

    deleteExpense: (id: string) => {
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    },

    clearAllExpenses: () => {
      setExpenses([]);
      clearExpenses();
    },
  };

  return (
    <ExpenseContext.Provider value={{ expenses, actions, isLoading }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenseContext() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenseContext must be used within ExpenseProvider');
  }
  return context;
}
