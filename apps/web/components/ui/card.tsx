'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/* ════════════════════════════════════════════════════════════════════════════
   CARD COMPONENT — Legacy Support
   ════════════════════════════════════════════════════════════════════════════ */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'premium' | 'glass' | 'glow';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-card border border-border/50',
      premium: 'card-premium',
      glass: 'glass-2',
      glow: 'glass-2 glass-glow',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl p-6 transition-all duration-300',
          variants[variant],
          hover && 'hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/30',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/* ════════════════════════════════════════════════════════════════════════════
   GLASS CARD — Enterprise Glassmorphism Component

   USAGE:
   <GlassCard level={2} interactive>Content</GlassCard>
   <GlassCard level={3} glow highlight>Modal Content</GlassCard>

   LEVELS:
   1 — Containers, Page sections (subtle)
   2 — Cards, Panels (default)
   3 — Modals, Popovers, Dropdowns (elevated)
   ════════════════════════════════════════════════════════════════════════════ */

const glassCardVariants = cva(
  'rounded-xl transition-all duration-300',
  {
    variants: {
      level: {
        1: 'glass-1',
        2: 'glass-2',
        3: 'glass-3',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-[hsl(var(--glass-bg-interactive))] hover:border-[hsl(var(--glass-border-active))] hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 active:translate-y-0',
        false: '',
      },
      glow: {
        true: 'glass-glow',
        false: '',
      },
      highlight: {
        true: 'glass-highlight',
        false: '',
      },
    },
    defaultVariants: {
      level: 2,
      padding: 'md',
      interactive: false,
      glow: false,
      highlight: false,
    },
  }
);

interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, level, padding, interactive, glow, highlight, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ level, padding, interactive, glow, highlight }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn('text-xl font-semibold tracking-tight text-foreground', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 border-t border-border/50', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

/* ════════════════════════════════════════════════════════════════════════════
   GLASS CARD SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════════════════ */

const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);
GlassCardHeader.displayName = 'GlassCardHeader';

const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }
>(({ className, as: Component = 'h3', ...props }, ref) => (
  <Component
    ref={ref}
    className={cn('text-lg font-semibold tracking-tight text-foreground', className)}
    {...props}
  />
));
GlassCardTitle.displayName = 'GlassCardTitle';

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
GlassCardDescription.displayName = 'GlassCardDescription';

const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
GlassCardContent.displayName = 'GlassCardContent';

const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center pt-4 border-t border-[hsl(var(--glass-border-default))]',
        className
      )}
      {...props}
    />
  )
);
GlassCardFooter.displayName = 'GlassCardFooter';

export {
  // Legacy Card
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  // Glass Card System
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  // Types
  type GlassCardProps,
};
