'use client';

import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Tag,
  Ruler,
  DollarSign,
  HelpCircle,
  GitCompare,
  Package,
  Building2,
  Car,
  Star,
  Zap,
  Heart,
  Shield,
  Clock,
  MapPin,
  Users,
  ShoppingCart,
  TrendingUp,
  Search,
  Settings,
  Target,
  Globe,
  Database,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================
// DIFFICULTY BADGE
// ============================================

interface DifficultyBadgeProps {
  value?: number | null;
  size?: 'sm' | 'md';
}

export function DifficultyBadge({ value, size = 'md' }: DifficultyBadgeProps) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">-</span>;
  }

  const getColor = () => {
    if (value <= 30) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (value <= 60) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded font-medium border tabular-nums',
      size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
      getColor()
    )}>
      {value}
    </span>
  );
}

// ============================================
// INTENT BADGE
// ============================================

interface IntentBadgeProps {
  intent?: string | null;
  size?: 'sm' | 'md';
  showFull?: boolean;
}

const INTENT_COLORS: Record<string, string> = {
  'informational': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'transactional': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'commercial': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'navigational': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'investigation': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const INTENT_LABELS: Record<string, string> = {
  'informational': 'Info',
  'transactional': 'Trans',
  'commercial': 'Comm',
  'navigational': 'Nav',
  'investigation': 'Invest',
};

const INTENT_FULL_LABELS: Record<string, string> = {
  'informational': 'Informational',
  'transactional': 'Transactional',
  'commercial': 'Commercial',
  'navigational': 'Navigational',
  'investigation': 'Investigation',
};

export function IntentBadge({ intent, size = 'md', showFull = false }: IntentBadgeProps) {
  if (!intent) return <span className="text-muted-foreground">-</span>;

  const intentLower = intent.toLowerCase();
  const labels = showFull ? INTENT_FULL_LABELS : INTENT_LABELS;

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium border',
      size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
      INTENT_COLORS[intentLower] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
    )}>
      {labels[intentLower] || intent}
    </span>
  );
}

// ============================================
// TREND INDICATOR
// ============================================

interface TrendIndicatorProps {
  trend?: 'up' | 'down' | 'stable' | null;
  size?: 'sm' | 'md';
}

export function TrendIndicator({ trend, size = 'md' }: TrendIndicatorProps) {
  if (!trend) return <div className={cn(size === 'sm' ? 'h-4 w-6' : 'h-6 w-8')} />;

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  const icons = {
    up: <ArrowUpRight className={cn(iconSize, 'text-emerald-400')} />,
    down: <ArrowDownRight className={cn(iconSize, 'text-red-400')} />,
    stable: <Minus className={cn(iconSize, 'text-muted-foreground')} />,
  };

  return <div className="flex items-center justify-end">{icons[trend]}</div>;
}

// ============================================
// SOURCE BADGE
// ============================================

interface SourceBadgeProps {
  source?: string | null;
  size?: 'sm' | 'md';
}

const SOURCE_COLORS: Record<string, string> = {
  'google_ads': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'google_suggest': 'bg-green-500/10 text-green-400 border-green-500/20',
  'dataforseo': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'manual': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'ai': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

const SOURCE_LABELS: Record<string, string> = {
  'google_ads': 'Google Ads',
  'google_suggest': 'Suggest',
  'dataforseo': 'DataForSEO',
  'manual': 'Manuel',
  'ai': 'AI',
};

export function SourceBadge({ source, size = 'md' }: SourceBadgeProps) {
  if (!source) return null;

  const sourceLower = source.toLowerCase();

  return (
    <span className={cn(
      'inline-flex items-center rounded font-medium border',
      size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
      SOURCE_COLORS[sourceLower] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
    )}>
      {SOURCE_LABELS[sourceLower] || source}
    </span>
  );
}

// ============================================
// STATUS BADGE
// ============================================

interface StatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<string, string> = {
  'approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
  'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  'approved': 'Onaylı',
  'rejected': 'Reddedildi',
  'pending': 'Bekliyor',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  if (!status) return null;

  const statusLower = status.toLowerCase();

  return (
    <span className={cn(
      'inline-flex items-center rounded font-medium border',
      size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
      STATUS_COLORS[statusLower] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
    )}>
      {STATUS_LABELS[statusLower] || status}
    </span>
  );
}

// ============================================
// ICON MAP FOR CATEGORIES
// ============================================

export const CATEGORY_ICONS: { [key: string]: React.ElementType } = {
  'tag': Tag,
  'ruler': Ruler,
  'dollar-sign': DollarSign,
  'help-circle': HelpCircle,
  'git-compare': GitCompare,
  'package': Package,
  'building-2': Building2,
  'car': Car,
  'star': Star,
  'zap': Zap,
  'heart': Heart,
  'shield': Shield,
  'clock': Clock,
  'map-pin': MapPin,
  'users': Users,
  'shopping-cart': ShoppingCart,
  'trending-up': TrendingUp,
  'search': Search,
  'settings': Settings,
  'target': Target,
  'globe': Globe,
  'database': Database,
  'sparkles': Sparkles,
};

export function getCategoryIcon(iconName: string): React.ElementType {
  return CATEGORY_ICONS[iconName] || Package;
}
