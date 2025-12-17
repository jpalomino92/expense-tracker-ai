'use client';

import { useState, useCallback } from 'react';
import { ExpenseFilters, DateRangePreset, DateRange } from '@/types/filter';
import { ExpenseCategory } from '@/types/expense';
import { getDateRangeFromPreset } from '@/lib/date-utils';

const DEFAULT_FILTERS: ExpenseFilters = {
  dateRange: { from: null, to: null },
  datePreset: DateRangePreset.ALL_TIME,
  categories: [],
  searchQuery: '',
  sortBy: 'date',
  sortOrder: 'desc',
};

/**
 * Hook for managing expense filter state
 */
export function useFilters() {
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);

  const setDatePreset = useCallback((preset: DateRangePreset) => {
    const dateRange = getDateRangeFromPreset(preset);
    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
      dateRange,
    }));
  }, []);

  const setCustomDateRange = useCallback((range: DateRange) => {
    setFilters((prev) => ({
      ...prev,
      datePreset: DateRangePreset.CUSTOM,
      dateRange: range,
    }));
  }, []);

  const setCategories = useCallback((categories: ExpenseCategory[]) => {
    setFilters((prev) => ({
      ...prev,
      categories,
    }));
  }, []);

  const toggleCategory = useCallback((category: ExpenseCategory) => {
    setFilters((prev) => {
      const isSelected = prev.categories.includes(category);
      return {
        ...prev,
        categories: isSelected
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      };
    });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  const setSortBy = useCallback((sortBy: 'date' | 'amount') => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
    }));
  }, []);

  const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
    setFilters((prev) => ({
      ...prev,
      sortOrder,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.datePreset !== DateRangePreset.ALL_TIME ||
      filters.categories.length > 0 ||
      filters.searchQuery.length > 0
    );
  }, [filters]);

  return {
    filters,
    setDatePreset,
    setCustomDateRange,
    setCategories,
    toggleCategory,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}
