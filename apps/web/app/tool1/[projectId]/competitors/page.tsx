'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  FileText,
  Globe,
  TrendingUp,
  Users,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompetitorData, useKeywordProject, useAnalyzeCompetitors, useProjectValidation } from '@/lib/hooks/use-tool1';
import { cn } from '@/lib/utils/cn';
import { PageTransition, staggerContainer, staggerItem } from '@/components/motion';

interface PageProps {
  params: { projectId: string };
}

export default function CompetitorsPage({ params }: PageProps) {
  const { projectId } = params;
  const { data: projectData } = useKeywordProject(projectId);
  const { data, isLoading, error, refetch } = useCompetitorData(Number(projectId));
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const analyzeCompetitors = useAnalyzeCompetitors();
  const { data: validation, isLoading: validationLoading } = useProjectValidation(projectId);

  // Get competitor tool validation status
  const competitorValidation = validation?.tools?.competitors;
  const canRunCompetitors = competitorValidation?.canRun ?? true; // No prerequisites
  const hasRunCompetitors = competitorValidation?.hasRun ?? false;

  const project = projectData?.success ? projectData.data : null;
  // Filter out any undefined/null values from the competitors array
  const rawCompetitors = data?.success ? (Array.isArray(data.data) ? data.data : [data.data]) : [];
  const competitors = rawCompetitors.filter((c): c is NonNullable<typeof c> => c != null);

  const handleRunAnalysis = async () => {
    if (!project) return;
    try {
      await analyzeCompetitors.mutateAsync(project.id);
      setNotification({ type: 'success', message: 'Rakip analizi tamamlandı!' });
      await refetch();
    } catch (err) {
      setNotification({ type: 'error', message: `Hata: ${(err as Error).message}` });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <div className="relative h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Rakip verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              'fixed top-20 left-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl',
              notification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            )}
            onAnimationComplete={() => setTimeout(() => setNotification(null), 3000)}
          >
            {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <section className="relative overflow-hidden border-b border-[hsl(var(--glass-border-subtle))]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
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
                <div className="absolute inset-0 bg-blue-500/40 rounded-2xl blur-xl" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </motion.div>

              <div>
                <h1 className="text-2xl font-bold text-foreground">Rakip Analizi</h1>
                <p className="text-sm text-muted-foreground">
                  {project?.project_name} - {project?.main_keyword}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-[hsl(var(--glass-border-default))] hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isLoading && "animate-spin")} />
              </button>
              <button
                onClick={handleRunAnalysis}
                disabled={analyzeCompetitors.isPending || !project}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  analyzeCompetitors.isPending || !project
                    ? 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                )}
              >
                {analyzeCompetitors.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {analyzeCompetitors.isPending ? 'Analiz Ediliyor...' : 'Analizi Çalıştır'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Validation Status Banner */}
      <section className="px-6">
        {!validationLoading && validation?.success && (
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-xl mb-4',
            hasRunCompetitors
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-cyan-500/10 border border-cyan-500/20'
          )}>
            {hasRunCompetitors ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Rakip Analizi Tamamlandı</p>
                  <p className="text-xs text-muted-foreground">
                    {competitorValidation?.dataCount || 0} rakip analiz edildi. İsterseniz tekrar çalıştırabilirsiniz.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Info className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-cyan-400">Rakip Analizine Hazır</p>
                  <p className="text-xs text-muted-foreground">
                    Ana keyword için rakip analizi başlatabilirsiniz.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Stats Summary */}
      <section className="px-6">
        <motion.div
          className="grid grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            label="Toplam Rakip"
            value={competitors.length}
            icon={Globe}
            color="blue"
          />
          <StatCard
            label="Ort. Kelime Sayısı"
            value={
              competitors.length > 0
                ? Math.round(
                    competitors.reduce((sum, c) => sum + (c.word_count || 0), 0) /
                      competitors.length
                  )
                : 0
            }
            icon={FileText}
            color="emerald"
          />
          <StatCard
            label="Taranan Sayfa"
            value={competitors.filter((c) => c.word_count && c.word_count > 0).length}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            label="Bekleyen"
            value={competitors.filter((c) => !c.word_count || c.word_count === 0).length}
            icon={Loader2}
            color="amber"
          />
        </motion.div>
      </section>

      {/* Competitors Table */}
      <section className="px-6">
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
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domain</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Başlık</th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelime</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">H1</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">H2</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">H3</th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">DR</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                {competitors.map((competitor, index) => {
                  const headings = competitor.headings_json
                    ? (typeof competitor.headings_json === 'string'
                        ? JSON.parse(competitor.headings_json)
                        : competitor.headings_json)
                    : null;

                  return (
                    <motion.tr
                      key={competitor.id}
                      className="hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.03 }}
                    >
                      <td className="px-4 py-4 text-sm">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--glass-bg-3))] text-xs font-semibold text-muted-foreground">
                          {competitor.serp_position || index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{competitor.competitor_domain}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-xs truncate text-sm text-muted-foreground" title={competitor.title}>
                          {competitor.title || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={cn(
                            'font-semibold',
                            competitor.word_count && competitor.word_count > 0
                              ? 'text-emerald-400'
                              : 'text-muted-foreground'
                          )}
                        >
                          {competitor.word_count || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <HeadingBadge count={headings?.h1?.length || 0} type="h1" />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <HeadingBadge count={headings?.h2?.length || 0} type="h2" />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <HeadingBadge count={headings?.h3?.length || 0} type="h3" />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm text-muted-foreground">
                          {competitor.domain_rating || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <a
                          href={competitor.competitor_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </a>
                      </td>
                    </motion.tr>
                  );
                })}
                {competitors.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-xl bg-[hsl(var(--glass-bg-2))]">
                          <Users className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground">
                          Henüz rakip verisi yok. Önce "Rakip Analizi Başlat" butonuna tıklayın.
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

      {/* Headings Detail */}
      {competitors.length > 0 && (
        <section className="px-6 pb-6">
          <motion.div
            className="rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Heading Analizi</h3>
            <div className="grid gap-4">
              {competitors
                .filter((c) => c.headings_json)
                .slice(0, 3)
                .map((competitor, index) => {
                  const headings = typeof competitor.headings_json === 'string'
                      ? JSON.parse(competitor.headings_json)
                      : competitor.headings_json;
                  return (
                    <motion.div
                      key={competitor.id}
                      className="rounded-xl glass-1 p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <div className="mb-3 font-semibold text-foreground">{competitor.competitor_domain}</div>
                      {headings.h1?.length > 0 && (
                        <div className="mb-2 flex items-start gap-2">
                          <span className="inline-flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">H1</span>
                          <span className="text-sm text-muted-foreground">{headings.h1[0]}</span>
                        </div>
                      )}
                      {headings.h2?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="inline-flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">H2</span>
                          <span className="text-sm text-muted-foreground">
                            {headings.h2.slice(0, 3).join(' | ')}
                            {headings.h2.length > 3 && <span className="text-muted-foreground/50"> +{headings.h2.length - 3} more</span>}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
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
  color: 'blue' | 'emerald' | 'purple' | 'amber';
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
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

function HeadingBadge({ count, type }: { count: number; type: 'h1' | 'h2' | 'h3' }) {
  const colors = {
    h1: 'bg-blue-500/20 text-blue-400',
    h2: 'bg-emerald-500/20 text-emerald-400',
    h3: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <span
      className={cn(
        'inline-flex h-6 min-w-[24px] items-center justify-center rounded-md text-xs font-semibold',
        count > 0 ? colors[type] : 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground'
      )}
    >
      {count}
    </span>
  );
}
