'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary to-orange-600 text-primary-foreground shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 active:translate-y-0',
        secondary:
          'bg-secondary text-secondary-foreground border border-border/50 hover:bg-accent hover:border-primary/30',
        outline:
          'border border-border/50 bg-transparent text-foreground hover:bg-accent hover:border-primary/30',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link:
          'text-primary underline-offset-4 hover:underline',
        premium:
          'bg-gradient-to-r from-primary via-orange-500 to-primary bg-[length:200%_100%] text-primary-foreground shadow-glow animate-gradient-shift hover:shadow-glow-lg hover:-translate-y-0.5',
        success:
          'bg-success text-success-foreground hover:bg-success/90',
      },
      size: {
        default: 'h-10 px-5 py-2 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Shine effect on hover */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

        {/* Content */}
        <span className="relative flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : leftIcon ? (
            leftIcon
          ) : null}
          {children}
          {rightIcon && !isLoading && rightIcon}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
