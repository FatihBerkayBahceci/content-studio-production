'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Search, FileText, Link2, TrendingUp, TrendingDown,
  Zap, BarChart3, Bot, Target,
  ChevronRight, Activity,
  CheckCircle2, Clock, AlertTriangle, Rocket,
  Database, MousePointerClick
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar
} from 'recharts';
import { useKeywordProjects } from '@/lib/hooks/use-tool1';
import { PageTransition, staggerContainer, staggerItem } from '@/components/motion';
import { cn } from '@/lib/utils/cn';
import { TokenStatsSection } from '@/components/dashboard/TokenStats';

// =====================================================================
// Dashboard Page
// =====================================================================
export default function DashboardPage() {
  const { data, isLoading } = useKeywordProjects();
  const projects = data?.success && data.data ? data.data : [];

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p =>
      (p.status as string) === 'processing' ||
      (p.status as string).includes('keywords_')
    ).length;
    const completed = projects.filter(p => (p.status as string) === 'completed').length;
    const pending = projects.filter(p => (p.status as string) === 'pending').length;
    const failed = projects.filter(p => (p.status as string) === 'failed').length;

    const totalKeywords = projects.reduce((sum, p) =>
      sum + (p.total_keywords_found || p.totalKeywordsFound || 0), 0
    );

    const avgKeywordsPerProject = total > 0 ? Math.round(totalKeywords / total) : 0;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total, active, completed, pending, failed,
      totalKeywords, avgKeywordsPerProject, successRate
    };
  }, [projects]);

  // Generate weekly trend data
  const weeklyTrend = useMemo(() => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const now = new Date();

    return days.map((day, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];

      const count = projects.filter(p => {
        const createdAt = p.created_at || p.createdAt;
        return createdAt?.startsWith(dateStr);
      }).length;

      return { day, projects: count };
    });
  }, [projects]);

  // Status distribution
  const statusData = useMemo(() => [
    { name: 'Tamamlanan', value: stats.completed, color: '#22c55e' },
    { name: 'Aktif', value: stats.active, color: '#f59e0b' },
    { name: 'Bekleyen', value: stats.pending, color: '#6366f1' },
    { name: 'Başarısız', value: stats.failed, color: '#ef4444' },
  ].filter(s => s.value > 0), [stats]);

  // Recent projects
  const recentProjects = useMemo(() =>
    [...projects]
      .sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
      .slice(0, 5),
    [projects]
  );

  // Get current hour for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Welcome Section - Modern Glassmorphism */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/6 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        </div>

        <div className="px-6 py-8">
          <motion.div
            className="relative rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Glass Card */}
            <div className="relative glass-2 rounded-2xl p-8">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              {/* Top Highlight Line */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left Content */}
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
                    {getGreeting()}, <span className="text-gradient">Admin</span>
                  </h1>
                  <p className="text-muted-foreground text-sm lg:text-base max-w-xl leading-relaxed">
                    <span className="text-foreground font-medium">Uçtan uca SEO-ready içerik üretim platformu.</span>{' '}
                    Keyword araştırmasından içerik üretimine, internal linking'den yayınlamaya —
                    tüm süreç tek bir AI agentte.
                  </p>

                  {/* SEO Tools Integration Logos */}
                  <div className="flex items-center gap-2 mt-6">
                    <span className="text-xs text-muted-foreground/60 mr-2">Powered by</span>
                    <div className="flex items-center gap-4">
                      {/* Google */}
                      <div className="flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity" title="Google">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="text-xs font-medium text-muted-foreground hidden sm:block">Google</span>
                      </div>

                      <div className="w-px h-3 bg-border/50" />

                      {/* Ahrefs */}
                      <div className="flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity" title="Ahrefs">
                        <svg className="h-4 w-4 text-[#FF6B35]" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" fill="currentColor"/>
                          <path d="M8 16l4-8 4 8H8z" fill="white"/>
                        </svg>
                        <span className="text-xs font-medium text-muted-foreground hidden sm:block">Ahrefs</span>
                      </div>

                      <div className="w-px h-3 bg-border/50" />

                      {/* SEMrush */}
                      <div className="flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity" title="SEMrush">
                        <svg className="h-4 w-4 text-[#FF642D]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8h-6V7h6v2z"/>
                        </svg>
                        <span className="text-xs font-medium text-muted-foreground hidden sm:block">SEMrush</span>
                      </div>

                      <div className="w-px h-3 bg-border/50 hidden md:block" />

                      {/* Moz */}
                      <div className="hidden md:flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity" title="Moz">
                        <svg className="h-4 w-4 text-[#3EAADF]" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="3" y="6" width="4" height="12" rx="1"/>
                          <rect x="10" y="3" width="4" height="18" rx="1"/>
                          <rect x="17" y="8" width="4" height="10" rx="1"/>
                        </svg>
                        <span className="text-xs font-medium text-muted-foreground hidden lg:block">Moz</span>
                      </div>

                      <div className="w-px h-3 bg-border/50 hidden lg:block" />

                      {/* Ubersuggest / Neil Patel */}
                      <div className="hidden lg:flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity" title="Ubersuggest">
                        <svg className="h-4 w-4 text-[#F97316]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-xs font-medium text-muted-foreground">Neil Patel</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Content - Decorative Card Stack */}
                <div className="hidden xl:block relative w-64 h-40">
                  {/* Background Card */}
                  <motion.div
                    className="absolute top-4 left-4 w-full h-full rounded-xl bg-gradient-to-br from-primary/5 to-orange-500/5 border border-primary/10"
                    animate={{ rotate: -3 }}
                  />
                  {/* Middle Card */}
                  <motion.div
                    className="absolute top-2 left-2 w-full h-full rounded-xl bg-gradient-to-br from-primary/10 to-orange-500/10 border border-primary/15"
                    animate={{ rotate: -1.5 }}
                  />
                  {/* Front Card */}
                  <div className="absolute inset-0 rounded-xl glass-3 p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Haftalık Özet</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{weeklyTrend.reduce((sum, d) => sum + d.projects, 0)}</p>
                      <p className="text-xs text-muted-foreground">yeni proje bu hafta</p>
                    </div>
                    <div className="h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyTrend}>
                          <defs>
                            <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="projects"
                            stroke="hsl(24, 95%, 53%)"
                            strokeWidth={2}
                            fill="url(#miniGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* KPI Cards - Premium Design */}
      <section className="px-6 py-6">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Total Projects Card */}
          <motion.div variants={staggerItem}>
            <KPICard
              title="Toplam Proje"
              value={stats.total}
              subtitle="Tüm projeler"
              icon={<Database className="h-5 w-5" />}
              iconBg="from-blue-500/20 to-cyan-500/20"
              iconColor="text-blue-400"
              chartData={weeklyTrend}
              chartColor="#3b82f6"
              loading={isLoading}
            />
          </motion.div>

          {/* Active Projects Card */}
          <motion.div variants={staggerItem}>
            <KPICard
              title="Aktif Projeler"
              value={stats.active}
              subtitle="Şu an işleniyor"
              icon={<Activity className="h-5 w-5" />}
              iconBg="from-amber-500/20 to-orange-500/20"
              iconColor="text-amber-400"
              chartData={weeklyTrend}
              chartColor="#f59e0b"
              loading={isLoading}
              highlight={stats.active > 0}
            />
          </motion.div>

          {/* Keywords Card */}
          <motion.div variants={staggerItem}>
            <KPICard
              title="Keşfedilen Keywords"
              value={stats.totalKeywords.toLocaleString('tr-TR')}
              subtitle={`Ortalama ${stats.avgKeywordsPerProject}/proje`}
              icon={<Target className="h-5 w-5" />}
              iconBg="from-emerald-500/20 to-green-500/20"
              iconColor="text-emerald-400"
              chartData={weeklyTrend}
              chartColor="#22c55e"
              loading={isLoading}
            />
          </motion.div>

          {/* Success Rate Card */}
          <motion.div variants={staggerItem}>
            <KPICard
              title="Başarı Oranı"
              value={`${stats.successRate}%`}
              subtitle={`${stats.completed}/${stats.total} tamamlandı`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              iconBg="from-purple-500/20 to-violet-500/20"
              iconColor="text-purple-400"
              chartType="progress"
              progressValue={stats.successRate}
              loading={isLoading}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Secondary Stats Row */}
      <section className="px-6 pb-6">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MiniStatCard
            label="Bekleyen"
            value={stats.pending}
            icon={<Clock className="h-4 w-4" />}
            color="indigo"
          />
          <MiniStatCard
            label="Başarısız"
            value={stats.failed}
            icon={<AlertTriangle className="h-4 w-4" />}
            color="red"
          />
          <MiniStatCard
            label="Bu Hafta"
            value={weeklyTrend.reduce((sum, d) => sum + d.projects, 0)}
            icon={<Rocket className="h-4 w-4" />}
            color="cyan"
          />
          <MiniStatCard
            label="Ort. Keyword"
            value={stats.avgKeywordsPerProject}
            icon={<MousePointerClick className="h-4 w-4" />}
            color="pink"
          />
        </motion.div>
      </section>

      {/* Charts Row */}
      <section className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Activity Chart */}
          <motion.div
            className="lg:col-span-2 rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Haftalık Aktivite</h3>
                <p className="text-sm text-muted-foreground">Proje oluşturma trendi</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  Projeler
                </span>
              </div>
            </div>

            <div className="h-[240px]">
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend} barSize={32}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(24, 95%, 53%)" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 6%)',
                        border: '1px solid hsl(var(--glass-border-default))',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Bar
                      dataKey="projects"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            className="rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="mb-6">
              <h3 className="text-base font-semibold text-foreground">Durum Dağılımı</h3>
              <p className="text-sm text-muted-foreground">Proje durumları</p>
            </div>

            <div className="h-[160px] flex items-center justify-center">
              {isLoading ? (
                <LoadingSkeleton type="circle" />
              ) : statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 6%)',
                        border: '1px solid hsl(var(--glass-border-default))',
                        borderRadius: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Veri yok</p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {statusData.map((status, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-muted-foreground truncate">{status.name}</span>
                  <span className="font-medium text-foreground ml-auto">{status.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Token Usage Stats */}
      <TokenStatsSection />

      {/* Tools & Activity */}
      <section className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Tools */}
          <motion.div
            className="rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">AI Araçları</h3>
            </div>

            <div className="space-y-3">
              <ToolLink
                href="/tool1"
                icon={<Search className="h-5 w-5" />}
                title="Keyword Research"
                description="AI destekli keyword keşfi"
                stats={`${stats.total} proje`}
                color="primary"
              />
              <ToolLink
                href="/tool2"
                icon={<FileText className="h-5 w-5" />}
                title="Content Studio"
                description="Brief'ten içeriğe"
                stats="Yakında"
                color="emerald"
                disabled
              />
              <ToolLink
                href="/tool3"
                icon={<Link2 className="h-5 w-5" />}
                title="Internal Linking"
                description="Akıllı link önerileri"
                stats="Yakında"
                color="purple"
                disabled
              />
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="lg:col-span-2 rounded-2xl glass-2 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--glass-border-subtle))]">
              <h3 className="text-base font-semibold text-foreground">Son Aktivite</h3>
              <Link
                href="/tool1"
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                Tümü <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                {recentProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}

// =====================================================================
// KPI Card Component - Premium Design
// =====================================================================
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: { value: number; isPositive: boolean; label: string };
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  chartData?: { day: string; projects: number }[];
  chartColor?: string;
  chartType?: 'area' | 'progress';
  progressValue?: number;
  loading?: boolean;
  highlight?: boolean;
}

function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBg,
  iconColor,
  chartData,
  chartColor = '#f97316',
  chartType = 'area',
  progressValue = 0,
  loading,
  highlight,
}: KPICardProps) {
  return (
    <div className={cn(
      'relative rounded-2xl glass-2 p-5 h-full',
      'transition-all duration-300',
      'hover:border-[hsl(var(--glass-border-active))]',
      highlight && 'border-amber-500/30'
    )}>
      {/* Highlight glow */}
      {highlight && (
        <div className="absolute inset-0 bg-amber-500/5 rounded-2xl" />
      )}

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className={cn(
          'p-2.5 rounded-xl bg-gradient-to-br border border-white/5',
          iconBg
        )}>
          <div className={iconColor}>{icon}</div>
        </div>

        {trend && trend.value !== 0 && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
            trend.isPositive
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative mb-1">
        {loading ? (
          <div className="h-10 w-28 rounded-lg bg-muted/30 animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        )}
      </div>

      {/* Title & Subtitle */}
      <div className="relative mb-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {/* Chart / Progress */}
      <div className="relative h-12">
        {chartType === 'progress' ? (
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressValue}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        ) : chartData && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${chartColor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="projects"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#gradient-${chartColor})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// Mini Stat Card
// =====================================================================
function MiniStatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'indigo' | 'red' | 'cyan' | 'pink';
}) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  };

  return (
    <div className="rounded-xl glass-1 p-4 flex items-center gap-3">
      <div className={cn('p-2 rounded-lg border', colors[color])}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// =====================================================================
// Tool Link
// =====================================================================
function ToolLink({
  href,
  icon,
  title,
  description,
  stats,
  color,
  disabled,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  stats: string;
  color: 'primary' | 'emerald' | 'purple';
  disabled?: boolean;
}) {
  const colors = {
    primary: 'bg-primary/10 text-primary group-hover:bg-primary/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20',
  };

  const content = (
    <div className={cn(
      'group flex items-center gap-3 p-3 rounded-xl glass-1 transition-all',
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[hsl(var(--glass-bg-interactive))]'
    )}>
      <div className={cn('p-2 rounded-lg transition-colors', colors[color])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
        {stats}
      </span>
    </div>
  );

  if (disabled) return content;
  return <Link href={href}>{content}</Link>;
}

// =====================================================================
// Project Row
// =====================================================================
function ProjectRow({ project }: { project: any }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Bekliyor' },
    processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'İşleniyor' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Tamamlandı' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Başarısız' },
  };

  const status = (project.status as string) || 'pending';
  const normalizedStatus = status.includes('keywords_') ? 'processing' : status;
  const config = statusConfig[normalizedStatus] || statusConfig.pending;

  return (
    <Link
      href={`/tool1/${project.uuid || project.id}`}
      className="group flex items-center justify-between p-4 hover:bg-primary/5 transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-orange-500/10 border border-primary/20">
          <Search className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {project.project_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{project.main_keyword}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
          {config.label}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

// =====================================================================
// Loading & Empty States
// =====================================================================
function LoadingSkeleton({ type = 'bar' }: { type?: 'bar' | 'circle' }) {
  if (type === 'circle') {
    return (
      <div className="w-[140px] h-[140px] rounded-full bg-muted/20 animate-pulse" />
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

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">Henüz proje yok</p>
      <p className="text-xs text-muted-foreground mb-4">İlk projenizi oluşturun</p>
      <Link href="/tool1/new">
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary to-orange-500">
          <Zap className="h-4 w-4" />
          Proje Oluştur
        </button>
      </Link>
    </div>
  );
}
