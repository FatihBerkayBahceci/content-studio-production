'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer' | 'pulse';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'shimmer', ...props }, ref) => {
    const variants = {
      default: 'bg-muted',
      shimmer: 'animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/5 to-muted bg-[length:200%_100%]',
      pulse: 'bg-muted animate-pulse',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-lg', variants[variant], className)}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton patterns
const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 && 'w-3/4'
        )}
      />
    ))}
  </div>
);

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('rounded-xl border border-border/50 bg-card p-6 space-y-4', className)}>
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <SkeletonText lines={3} />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20 rounded-lg" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);

const SkeletonTable = ({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) => (
  <div className={cn('rounded-xl border border-border/50 bg-card overflow-hidden', className)}>
    {/* Header */}
    <div className="flex gap-4 p-4 border-b border-border/50 bg-muted/30">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="flex gap-4 p-4 border-b border-border/30 last:border-0"
      >
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable };
