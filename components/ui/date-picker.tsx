'use client';

import { useState, forwardRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  label?: string;
  error?: string;
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  ({ label, error, value, onChange, placeholder = 'Select date', className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedDate = value ? new Date(value) : undefined;

    const handleSelect = (date: Date | undefined) => {
      if (date) {
        // Convert to ISO date string (YYYY-MM-DD)
        const isoDate = format(date, 'yyyy-MM-dd');
        onChange(isoDate);
      }
      setIsOpen(false);
    };

    const displayValue = selectedDate ? format(selectedDate, 'MMM d, yyyy') : '';

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-full px-4 py-2 pl-10 border rounded-lg text-left transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error
                ? 'border-danger focus:ring-danger'
                : 'border-gray-300',
              !displayValue && 'text-gray-400'
            )}
          >
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            {displayValue || placeholder}
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-20 mt-2 bg-white rounded-lg shadow-modal border border-gray-200 p-3">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelect}
                  disabled={{ after: new Date() }}
                  className="rdp-custom"
                />
              </div>
            </>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
