'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, DollarSign, Zap, TrendingUp, TrendingDown,
  Activity, BarChart3, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { useTokenStats } from '@/lib/hooks/use-token-stats';
import { cn } from '@/lib/utils/cn';
import { staggerContainer, staggerItem } from '@/components/motion';

// =====================================================================
// Token Stats Section Component
// =====================================================================

export function TokenStatsSection() {
  const { data, isLoading, error } = useTokenStats();
  const stats = data?.success ? data.data : null;

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('tr-TR');
  };

  // Prepare daily trend data (reverse to show oldest first)
  const dailyTrend = useMemo(() => {
    if (!stats?.daily_trend) return [];
    return [...stats.daily_trend]
      .reverse()
      .slice(-7)
      .map(d => ({
        date: new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
        input: d.input_tokens,
        output: d.output_tokens,
        total: d.input_tokens + d.output_tokens,
        calls: d.call_count,
      }));
  }, [stats?.daily_trend]);

  // Provider distribution for pie chart
  const providerData = useMemo(() => {
    if (!stats?.by_provider) return [];
    const colors: Record<string, string> = {
      google: '#4285F4',
      gemini: '#4285F4',
      openai: '#10A37F',
    };
    return stats.by_provider.map(p => ({
      name: p.api_provider === 'google' ? 'Gemini' : p.api_provider.toUpperCase(),
      value: Number(p.total_input) + Number(p.total_output),
      cost: p.estimated_cost,
      color: colors[p.api_provider] || '#6366f1',
    }));
  }, [stats?.by_provider]);

  // Calculate week over week change from real data
  const weekChange = useMemo(() => {
    if (!stats?.daily_trend || stats.daily_trend.length < 14) return null;

    const trend = stats.daily_trend;
    // Last 7 days total
    const thisWeek = trend.slice(0, 7).reduce((sum, d) => sum + d.input_tokens + d.output_tokens, 0);
    // Previous 7 days total
    const lastWeek = trend.slice(7, 14).reduce((sum, d) => sum + d.input_tokens + d.output_tokens, 0);

    if (lastWeek === 0) return null;
    return ((thisWeek - lastWeek) / lastWeek * 100).toFixed(1);
  }, [stats?.daily_trend]);

  if (error) {
    return null; // Silently fail if no token data
  }

  return (
    <section className="px-6 py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
            <Cpu className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">AI Token Kullanimi</h2>
            <p className="text-xs text-muted-foreground">Son 30 gunluk istatistikler</p>
          </div>
        </div>
        {stats && weekChange !== null && (
          <div className="flex items-center gap-2">
            <span className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
              parseFloat(weekChange) >= 0
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            )}>
              {parseFloat(weekChange) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {parseFloat(weekChange) >= 0 ? '+' : ''}{weekChange}% bu hafta
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Total Tokens */}
        <motion.div variants={staggerItem}>
          <TokenKPICard
            title="Toplam Token"
            value={stats ? formatNumber(stats.summary.total_tokens) : '-'}
            subtitle={stats ? `${formatNumber(stats.summary.total_input_tokens)} input + ${formatNumber(stats.summary.total_output_tokens)} output` : ''}
            icon={<Zap className="h-5 w-5" />}
            iconBg="from-purple-500/20 to-violet-500/20"
            iconColor="text-purple-400"
            loading={isLoading}
          />
        </motion.div>

        {/* Total API Calls */}
        <motion.div variants={staggerItem}>
          <TokenKPICard
            title="API Cagrisi"
            value={stats ? formatNumber(stats.summary.total_calls) : '-'}
            subtitle={stats ? `Ort. ${formatNumber(stats.summary.avg_input_per_call)} token/call` : ''}
            icon={<Activity className="h-5 w-5" />}
            iconBg="from-blue-500/20 to-cyan-500/20"
            iconColor="text-blue-400"
            loading={isLoading}
          />
        </motion.div>

        {/* Estimated Cost */}
        <motion.div variants={staggerItem}>
          <TokenKPICard
            title="Tahmini Maliyet"
            value={stats ? `$${parseFloat(stats.summary.estimated_cost_usd).toFixed(2)}` : '-'}
            subtitle="Son 30 gun"
            icon={<DollarSign className="h-5 w-5" />}
            iconBg="from-emerald-500/20 to-green-500/20"
            iconColor="text-emerald-400"
            loading={isLoading}
            highlight
          />
        </motion.div>

        {/* Avg Tokens per Call */}
        <motion.div variants={staggerItem}>
          <TokenKPICard
            title="Ort. Token/Call"
            value={stats ? formatNumber(Number(stats.summary.avg_input_per_call) + Number(stats.summary.avg_output_per_call)) : '-'}
            subtitle={stats ? `${formatNumber(Number(stats.summary.avg_output_per_call))} output` : ''}
            icon={<BarChart3 className="h-5 w-5" />}
            iconBg="from-amber-500/20 to-orange-500/20"
            iconColor="text-amber-400"
            loading={isLoading}
          />
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Chart */}
        <motion.div
          className="lg:col-span-2 rounded-2xl glass-2 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Gunluk Token Kullanimi</h3>
              <p className="text-sm text-muted-foreground">Son 7 gun</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                Input
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Output
              </span>
            </div>
          </div>

          <div className="h-[200px]">
            {isLoading ? (
              <LoadingSkeleton />
            ) : dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrend} barSize={24}>
                  <defs>
                    <linearGradient id="inputGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="outputGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0 0% 6%)',
                      border: '1px solid hsl(var(--glass-border-default))',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    formatter={(value: number, name: string) => [
                      value.toLocaleString('tr-TR'),
                      name === 'input' ? 'Input Tokens' : 'Output Tokens'
                    ]}
                  />
                  <Bar dataKey="input" fill="url(#inputGradient)" radius={[4, 4, 0, 0]} stackId="stack" />
                  <Bar dataKey="output" fill="url(#outputGradient)" radius={[4, 4, 0, 0]} stackId="stack" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Henuz token verisi yok" />
            )}
          </div>
        </motion.div>

        {/* Provider Distribution */}
        <motion.div
          className="rounded-2xl glass-2 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Provider Dagilimi</h3>
            <p className="text-sm text-muted-foreground">Token kullanimi</p>
          </div>

          <div className="h-[140px] flex items-center justify-center">
            {isLoading ? (
              <LoadingSkeleton type="circle" />
            ) : providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0 0% 6%)',
                      border: '1px solid hsl(var(--glass-border-default))',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [value.toLocaleString('tr-TR'), 'Tokens']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Veri yok" type="circle" />
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2">
            {providerData.map((provider, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: provider.color }}
                  />
                  <span className="text-muted-foreground">{provider.name}</span>
                </div>
                <span className="font-medium text-foreground">
                  ${provider.cost.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Project Breakdown */}
      {stats?.by_project && stats.by_project.length > 0 && (
        <motion.div
          className="mt-6 rounded-2xl glass-2 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--glass-border-subtle))]">
            <h3 className="text-base font-semibold text-foreground">Projelere Gore Kullanim</h3>
            <span className="text-xs text-muted-foreground">Top 10</span>
          </div>
          <div className="divide-y divide-[hsl(var(--glass-border-subtle))]">
            {stats.by_project.slice(0, 10).map((project, idx) => (
              <div
                key={project.project_id}
                className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/10 to-orange-500/10 flex items-center justify-center text-xs font-medium text-primary">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {project.main_keyword}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.call_count} API call
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {formatNumber(Number(project.total_input) + Number(project.total_output))}
                    </p>
                    <p className="text-xs text-muted-foreground">token</p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-medium text-emerald-400">
                      ${(Number(project.total_cost) || 0).toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}

// =====================================================================
// Token KPI Card Component
// =====================================================================

interface TokenKPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
  highlight?: boolean;
}

function TokenKPICard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  loading,
  highlight,
}: TokenKPICardProps) {
  return (
    <div className={cn(
      'relative rounded-xl glass-1 p-4',
      'transition-all duration-300',
      'hover:border-[hsl(var(--glass-border-active))]',
      highlight && 'border-emerald-500/30'
    )}>
      {highlight && (
        <div className="absolute inset-0 bg-emerald-500/5 rounded-xl" />
      )}

      <div className="relative flex items-start justify-between mb-3">
        <div className={cn(
          'p-2 rounded-lg bg-gradient-to-br border border-white/5',
          iconBg
        )}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>

      <div className="relative">
        {loading ? (
          <div className="h-8 w-24 rounded-lg bg-muted/30 animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-foreground tracking-tight mb-1">{value}</p>
        )}
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

// =====================================================================
// Loading & Empty States
// =====================================================================

function LoadingSkeleton({ type = 'bar' }: { type?: 'bar' | 'circle' }) {
  if (type === 'circle') {
    return (
      <div className="w-[120px] h-[120px] rounded-full bg-muted/20 animate-pulse" />
    );
  }
  return (
    <div className="h-full flex items-end gap-2 px-4">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-muted/20 rounded-t animate-pulse"
          style={{ height: `${30 + Math.random() * 50}%` }}
        />
      ))}
    </div>
  );
}

function EmptyChart({ message, type = 'bar' }: { message: string; type?: 'bar' | 'circle' }) {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      {type === 'circle' ? (
        <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center mb-2">
          <BarChart3 className="h-6 w-6 text-muted-foreground/30" />
        </div>
      ) : (
        <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-2" />
      )}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default TokenStatsSection;
