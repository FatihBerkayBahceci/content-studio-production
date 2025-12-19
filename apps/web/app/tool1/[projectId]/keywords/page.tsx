'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  Search,
  TrendingUp,
  Target,
  Filter,
  Download,
  FileText,
  BarChart3,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeywords, useKeywordProject } from '@/lib/hooks/use-tool1';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { QuickExportButton } from '@/components/sheets/QuickExportButton';

interface PageProps {
  params: { projectId: string };
}

type FilterType = 'all' | 'high' | 'medium' | 'low';
type IntentFilter = 'all' | 'informational' | 'transactional' | 'commercial' | 'navigational';

// Extended keyword type to handle both camelCase and snake_case from n8n API
interface ExtendedKeyword {
  id?: number;
  keyword?: string;
  // camelCase fields (from shared types)
  keywordType?: string;
  searchVolume?: number | null;
  keywordDifficulty?: number | null;
  searchIntent?: string | null;
  clusterName?: string | null;
  opportunityScore?: number | null;
  pageType?: string;
  // snake_case fields (from n8n API)
  keyword_type?: string;
  search_volume?: number | null;
  keyword_difficulty?: number | null;
  search_intent?: string | null;
  cluster_name?: string | null;
  opportunity_score?: number | null;
  page_type?: string;
  priority?: string;
}

// Helper to get value from either camelCase or snake_case
const getKeywordValue = (kw: ExtendedKeyword) => ({
  keyword: kw.keyword,
  keywordType: kw.keywordType || kw.keyword_type,
  searchVolume: kw.searchVolume ?? kw.search_volume,
  keywordDifficulty: kw.keywordDifficulty ?? kw.keyword_difficulty,
  searchIntent: kw.searchIntent || kw.search_intent,
  clusterName: kw.clusterName || kw.cluster_name,
  opportunityScore: kw.opportunityScore ?? kw.opportunity_score,
  pageType: kw.pageType || kw.page_type,
  priority: kw.priority,
});

export default function KeywordsPage({ params }: PageProps) {
  const { projectId } = params;
  const { data: projectData } = useKeywordProject(projectId);
  const { data, isLoading, error } = useKeywords(projectId);

  const [priorityFilter, setPriorityFilter] = useState<FilterType>('all');
  const [intentFilter, setIntentFilter] = useState<IntentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const project = projectData?.success ? projectData.data : null;
  const clientId = (project as { client_id?: number })?.client_id || null;

  // n8n returns flat structure: { success, data: [...keywords], stats, by_cluster }
  // Type assertion to handle the actual API response structure
  const rawResponse = data as unknown as {
    success: boolean;
    data: ExtendedKeyword[];
    stats?: {
      total: number;
      filtered_count: number;
      with_intent: number;
      avg_volume: number;
      avg_difficulty: number;
      avg_opportunity: number;
    };
    by_cluster?: Record<string, number>;
  } | undefined;

  const keywords = rawResponse?.success ? (rawResponse.data || []) : [];
  const stats = rawResponse?.stats;
  const byCluster = rawResponse?.by_cluster;

  // Filter keywords
  const filteredKeywords = keywords.filter((kw) => {
    const kwValues = getKeywordValue(kw);
    const matchesPriority =
      priorityFilter === 'all' ||
      kwValues.priority?.toLowerCase() === priorityFilter;
    const matchesIntent =
      intentFilter === 'all' ||
      kwValues.searchIntent?.toLowerCase() === intentFilter;
    const matchesSearch =
      !searchQuery ||
      kwValues.keyword?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesIntent && matchesSearch;
  });

  const handleExportCSV = () => {
    if (!filteredKeywords.length) return;

    const headers = ['Keyword', 'Volume', 'Difficulty', 'Opportunity', 'Intent', 'Priority', 'Cluster', 'Page Type'];
    const rows = filteredKeywords.map((kw) => {
      const kwValues = getKeywordValue(kw);
      return [
        kwValues.keyword || '',
        kwValues.searchVolume || 0,
        kwValues.keywordDifficulty || 0,
        kwValues.opportunityScore || 0,
        kwValues.searchIntent || '',
        kwValues.priority || '',
        kwValues.clusterName || '',
        kwValues.pageType || '',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <div className="relative h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Keyword verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-[hsl(var(--glass-border-subtle))]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Link
              href={`/tool1/${projectId}`}
              className="p-2 rounded-xl glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>

            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-xl" />
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30">
                <Search className="h-6 w-6 text-primary" />
              </div>
            </motion.div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Keyword Sonuçları</h1>
              <p className="text-sm text-muted-foreground">
                {project?.project_name} - {project?.main_keyword}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Export to Sheets */}
              <QuickExportButton
                projectId={projectId}
                clientId={clientId}
                selectedKeywords={filteredKeywords.map(kw => {
                  const kwValues = getKeywordValue(kw);
                  return {
                    id: kw.id,
                    keyword: kwValues.keyword || '',
                    search_volume: kwValues.searchVolume,
                    keyword_difficulty: kwValues.keywordDifficulty,
                    search_intent: kwValues.searchIntent,
                    opportunity_score: kwValues.opportunityScore,
                  };
                })}
                disabled={!filteredKeywords.length}
              />

              {/* CSV Download */}
              <button
                onClick={handleExportCSV}
                disabled={!filteredKeywords.length}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--glass-bg-2))] hover:bg-[hsl(var(--glass-bg-3))] border border-[hsl(var(--glass-border-subtle))] text-muted-foreground hover:text-foreground text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Summary */}
      {stats && (
        <section className="px-6">
          <motion.div
            className="grid grid-cols-6 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard label="Toplam" value={stats.total} icon={FileText} color="blue" />
            <StatCard label="Filtreli" value={stats.filtered_count} icon={Filter} color="purple" />
            <StatCard label="Ort. Volume" value={Math.round(stats.avg_volume)} icon={BarChart3} color="emerald" />
            <StatCard label="Ort. Difficulty" value={Math.round(stats.avg_difficulty)} icon={Target} color="amber" />
            <StatCard label="Ort. Fırsat" value={Math.round(stats.avg_opportunity)} icon={Zap} color="primary" />
            <StatCard label="Intent Var" value={stats.with_intent} icon={TrendingUp} color="cyan" />
          </motion.div>
        </section>
      )}

      {/* Filters */}
      <section className="px-6">
        <motion.div
          className="rounded-xl glass-1 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keyword ara..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-sm focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FilterType)}
              className="px-4 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="all">Tüm Öncelik</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>

            {/* Intent Filter */}
            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value as IntentFilter)}
              className="px-4 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="all">Tüm Intent</option>
              <option value="informational">Informational</option>
              <option value="transactional">Transactional</option>
              <option value="commercial">Commercial</option>
              <option value="navigational">Navigational</option>
            </select>

            <span className="text-sm text-muted-foreground">
              {filteredKeywords.length} / {keywords.length}
            </span>
          </div>
        </motion.div>
      </section>

      {/* Keywords Table */}
      <section className="px-6 pb-6">
        <motion.div
          className="rounded-2xl glass-2 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--glass-bg-3))]">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keyword</th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difficulty</th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fırsat</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intent</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Öncelik</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cluster</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sayfa Tipi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                {filteredKeywords.map((keyword, index) => {
                  const kwValues = getKeywordValue(keyword);
                  return (
                    <motion.tr
                      key={keyword.id || index}
                      className="hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.02 }}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{kwValues.keyword}</div>
                        {kwValues.keywordType && (
                          <span className="text-xs text-muted-foreground">{kwValues.keywordType}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-foreground">
                          {kwValues.searchVolume?.toLocaleString() || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DifficultyBadge value={kwValues.keywordDifficulty} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <OpportunityBadge value={kwValues.opportunityScore} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <IntentBadge intent={kwValues.searchIntent} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <PriorityBadge priority={kwValues.priority} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                          {kwValues.clusterName || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <PageTypeBadge pageType={kwValues.pageType} />
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredKeywords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-xl bg-[hsl(var(--glass-bg-2))]">
                          <Search className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground">
                          {keywords.length === 0
                            ? 'Henüz keyword verisi yok. Önce "Keyword Keşfi" adımını çalıştırın.'
                            : 'Filtrelere uygun keyword bulunamadı.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* Cluster Distribution */}
      {byCluster && Object.keys(byCluster).length > 0 && (
        <section className="px-6 pb-6">
          <motion.div
            className="rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Cluster Dağılımı</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(byCluster).map(([cluster, count]) => (
                <div key={cluster} className="rounded-xl glass-1 p-3">
                  <p className="text-sm font-medium text-foreground truncate">{cluster}</p>
                  <p className="text-2xl font-bold text-primary">{count as number}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

    </PageTransition>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'primary' | 'cyan';
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    primary: 'text-primary bg-primary/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  };

  return (
    <div className="rounded-xl glass-1 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-2 rounded-lg', colors[color])}>
          <Icon className={cn('h-4 w-4', colors[color].split(' ')[0])} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function DifficultyBadge({ value }: { value?: number | null }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground">-</span>;

  const color = value <= 30 ? 'emerald' : value <= 60 ? 'amber' : 'red';
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[color])}>
      {value}
    </span>
  );
}

function OpportunityBadge({ value }: { value?: number | null }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground">-</span>;

  const color = value >= 70 ? 'emerald' : value >= 40 ? 'amber' : 'red';
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[color])}>
      {value}
    </span>
  );
}

function IntentBadge({ intent }: { intent?: string | null }) {
  if (!intent) return <span className="text-muted-foreground">-</span>;

  const colors: Record<string, string> = {
    informational: 'bg-blue-500/20 text-blue-400',
    transactional: 'bg-emerald-500/20 text-emerald-400',
    commercial: 'bg-purple-500/20 text-purple-400',
    navigational: 'bg-amber-500/20 text-amber-400',
  };

  const labels: Record<string, string> = {
    informational: 'Info',
    transactional: 'Trans',
    commercial: 'Comm',
    navigational: 'Nav',
  };

  return (
    <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[intent.toLowerCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground')}>
      {labels[intent.toLowerCase()] || intent}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return <span className="text-muted-foreground">-</span>;

  const colors: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-emerald-500/20 text-emerald-400',
  };

  const labels: Record<string, string> = {
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
  };

  return (
    <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[priority.toLowerCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground')}>
      {labels[priority.toLowerCase()] || priority}
    </span>
  );
}

function PageTypeBadge({ pageType }: { pageType?: string }) {
  if (!pageType) return <span className="text-muted-foreground">-</span>;

  const colors: Record<string, string> = {
    pillar: 'bg-purple-500/20 text-purple-400',
    cluster: 'bg-blue-500/20 text-blue-400',
    standalone: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[pageType.toLowerCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground')}>
      {pageType}
    </span>
  );
}
