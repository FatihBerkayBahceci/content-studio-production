'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 border',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border-border/50',
        success: 'bg-success/10 text-success border-success/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20',
        info: 'bg-info/10 text-info border-info/20',
        outline: 'bg-transparent text-foreground border-border',
        ghost: 'bg-transparent text-muted-foreground border-transparent hover:bg-accent',
        premium: 'bg-gradient-to-r from-primary/10 to-orange-600/10 text-primary border-primary/20',
      },
      size: {
        default: 'text-xs px-2.5 py-0.5',
        sm: 'text-[10px] px-2 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, dotColor, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn('h-1.5 w-1.5 rounded-full', dotColor || 'bg-current')}
          />
        )}
        {icon}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status-specific badges
const StatusBadge = React.forwardRef<
  HTMLSpanElement,
  Omit<BadgeProps, 'variant'> & {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'active';
  }
>(({ status, ...props }, ref) => {
  const statusConfig = {
    pending: { variant: 'warning' as const, dot: true },
    processing: { variant: 'info' as const, dot: true },
    completed: { variant: 'success' as const, dot: true },
    failed: { variant: 'destructive' as const, dot: true },
    active: { variant: 'premium' as const, dot: true },
  };

  const config = statusConfig[status];

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      dot={config.dot}
      {...props}
    />
  );
});

StatusBadge.displayName = 'StatusBadge';

export { Badge, StatusBadge, badgeVariants };
