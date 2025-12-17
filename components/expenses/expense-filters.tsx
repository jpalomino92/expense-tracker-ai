'use client';

import { DateRangePreset } from '@/types/filter';
import { ExpenseCategory } from '@/types/expense';
import { CATEGORIES, CATEGORY_CONFIG } from '@/constants/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpenseFiltersProps {
  datePreset: DateRangePreset;
  onDatePresetChange: (preset: DateRangePreset) => void;
  categories: ExpenseCategory[];
  onCategoryToggle: (category: ExpenseCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
}

const DATE_PRESETS = [
  { label: 'All Time', value: DateRangePreset.ALL_TIME },
  { label: 'Today', value: DateRangePreset.TODAY },
  { label: 'This Week', value: DateRangePreset.THIS_WEEK },
  { label: 'This Month', value: DateRangePreset.THIS_MONTH },
  { label: 'Last 30 Days', value: DateRangePreset.LAST_30_DAYS },
];

export function ExpenseFilters({
  datePreset,
  onDatePresetChange,
  categories,
  onCategoryToggle,
  searchQuery,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
  resultCount,
}: ExpenseFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card dark:shadow-none dark:border dark:border-gray-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} icon={<X className="h-4 w-4" />}>
            Clear All
          </Button>
        )}
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search className="h-5 w-5" />}
          iconPosition="left"
        />
      </div>

      {/* Date Range Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onDatePresetChange(preset.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                datePreset === preset.value
                  ? 'bg-primary-500 dark:bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const config = CATEGORY_CONFIG[category];
            const isSelected = categories.includes(category);

            return (
              <button
                key={category}
                onClick={() => onCategoryToggle(category)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2',
                  isSelected
                    ? `${config.bgColor} ${config.color} border-current`
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{resultCount}</span>{' '}
            {resultCount === 1 ? 'expense' : 'expenses'}
          </p>
        </div>
      )}
    </div>
  );
}
