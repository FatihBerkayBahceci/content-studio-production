'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  showValue?: boolean;
  animated?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = 'default',
      size = 'default',
      showValue = false,
      animated = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
      default: 'bg-primary',
      gradient: 'bg-gradient-to-r from-primary to-orange-500',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    };

    const sizes = {
      sm: 'h-1.5',
      default: 'h-2.5',
      lg: 'h-4',
    };

    return (
      <div className={cn('w-full', className)} {...props}>
        <div
          ref={ref}
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-secondary',
            sizes[size]
          )}
        >
          {/* Track glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `inset 0 0 10px hsl(var(--primary) / 0.1)`,
            }}
          />

          {/* Progress bar */}
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              variants[variant],
              animated && 'animate-progress-grow'
            )}
            style={{
              width: `${percentage}%`,
              '--progress-width': `${percentage}%`,
            } as React.CSSProperties}
          >
            {/* Shine effect */}
            {percentage > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" />
            )}
          </div>
        </div>

        {showValue && (
          <div className="mt-1 flex justify-end">
            <span className="text-xs text-muted-foreground font-medium">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// Circular Progress
interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'destructive';
  showValue?: boolean;
  className?: string;
}

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  (
    {
      value = 0,
      max = 100,
      size = 48,
      strokeWidth = 4,
      variant = 'default',
      showValue = false,
      className,
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const colors = {
      default: 'stroke-primary',
      gradient: 'stroke-[url(#gradient)]',
      success: 'stroke-success',
      warning: 'stroke-warning',
      destructive: 'stroke-destructive',
    };

    return (
      <div className={cn('relative inline-flex', className)}>
        <svg
          ref={ref}
          className="progress-ring"
          width={size}
          height={size}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(17 88% 40%)" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            className="stroke-secondary"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />

          {/* Progress circle */}
          <circle
            className={cn('transition-all duration-500 ease-out', colors[variant])}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>

        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

export { Progress, CircularProgress };
