import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  onRemove?: () => void;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', onRemove, className, children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-success-light text-success-dark',
      warning: 'bg-warning-light text-warning-dark',
      danger: 'bg-danger-light text-danger-dark',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            onClick={onRemove}
            className="ml-0.5 -mr-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
