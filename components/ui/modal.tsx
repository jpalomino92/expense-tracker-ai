'use client';

import { HTMLAttributes, useEffect, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, size = 'md', className, children, ...props }, ref) => {
    // Close on ESC key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeStyles = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-2xl',
    };

    const modalContent = (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={ref}
          className={cn(
            'relative w-full bg-white dark:bg-gray-800 rounded-lg shadow-modal animate-slide-up transition-colors',
            sizeStyles[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          )}

          {!title && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          )}

          {/* Content */}
          <div className={cn('p-6', title && 'pt-4')}>{children}</div>
        </div>
      </div>
    );

    // Use portal to render modal at document body level
    if (typeof document !== 'undefined') {
      return createPortal(modalContent, document.body);
    }

    return null;
  }
);

Modal.displayName = 'Modal';
