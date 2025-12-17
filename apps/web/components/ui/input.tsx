'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Search, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'premium' | 'ghost';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  error?: boolean;
  errorMessage?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant = 'default',
      leftIcon,
      rightIcon,
      onClear,
      error,
      errorMessage,
      ...props
    },
    ref
  ) => {
    const variants = {
      default:
        'bg-secondary border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20',
      premium:
        'bg-secondary/50 backdrop-blur-sm border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-glow-sm',
      ghost:
        'bg-transparent border-transparent hover:bg-accent focus:bg-accent focus:border-border',
    };

    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-xl border px-4 py-2 text-sm transition-all duration-200',
            'placeholder:text-muted-foreground',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            variants[variant],
            leftIcon && 'pl-10',
            (rightIcon || onClear) && 'pr-10',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {(rightIcon || (onClear && props.value)) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {onClear && props.value ? (
              <button
                type="button"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              rightIcon
            )}
          </div>
        )}
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-destructive">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input variant
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="h-4 w-4" />}
        className={className}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { Input, SearchInput };
