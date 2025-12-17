'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  MessageSquare,
  Image,
  Video,
  ListChecks,
  AlertTriangle,
  Download,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Info,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSerpFeatures, usePaaData, useKeywordProject, useDetectSerpFeatures, useProjectValidation } from '@/lib/hooks/use-tool1';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

interface PageProps {
  params: { projectId: string };
}

// Extended SERP feature type to handle both camelCase and snake_case from n8n API
interface ExtendedSerpFeature {
  id?: number;
  keyword?: string;
  // snake_case fields from n8n
  has_featured_snippet?: boolean;
  has_paa?: boolean;
  paa_count?: number;
  has_video_results?: boolean;
  has_image_pack?: boolean;
  zero_click_risk?: string;
  // camelCase fields (from shared types)
  featureType?: string;
  isOwnedByCompetitor?: boolean;
  opportunityLevel?: string;
}

// Extended PAA type
interface ExtendedPaaData {
  id?: number;
  keyword?: string;
  question?: string;
  position?: number;
  answerSnippet?: string | null;
}

export default function SerpPage({ params }: PageProps) {
  const { projectId } = params;
  const numericProjectId = parseInt(projectId, 10) || null;
  const { data: projectData } = useKeywordProject(projectId);
  const { data: serpData, isLoading: serpLoading, refetch: refetchSerp } = useSerpFeatures(numericProjectId);
  const { data: paaData, isLoading: paaLoading, refetch: refetchPaa } = usePaaData(numericProjectId);

  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const detectSerpFeatures = useDetectSerpFeatures();
  const { data: validation, isLoading: validationLoading } = useProjectValidation(projectId);

  // Get SERP tool validation status
  const serpValidation = validation?.tools?.serp;
  const canRunSerp = serpValidation?.canRun ?? true; // No prerequisites
  const hasRunSerp = serpValidation?.hasRun ?? false;

  const handleRunAnalysis = async () => {
    if (!numericProjectId) return;
    try {
      await detectSerpFeatures.mutateAsync(numericProjectId);
      setNotification({ type: 'success', message: 'SERP analizi tamamlandı!' });
      await Promise.all([refetchSerp(), refetchPaa()]);
    } catch (err) {
      setNotification({ type: 'error', message: `Hata: ${(err as Error).message}` });
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchSerp(), refetchPaa()]);
  };

  const project = projectData?.success ? projectData.data : null;
  const serpFeatures = (serpData?.success ? (Array.isArray(serpData.data) ? serpData.data : [serpData.data]) : []) as ExtendedSerpFeature[];
  const paaQuestions = (paaData?.success ? (Array.isArray(paaData.data) ? paaData.data : [paaData.data]) : []) as ExtendedPaaData[];

  const isLoading = serpLoading || paaLoading;

  // Filter PAA by search query
  const filteredPaa = paaQuestions.filter((paa) =>
    !searchQuery || paa?.question?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate SERP feature stats
  const featuredSnippetCount = serpFeatures.filter((s) => s?.has_featured_snippet).length;
  const paaCount = serpFeatures.filter((s) => s?.has_paa).length;
  const videoCount = serpFeatures.filter((s) => s?.has_video_results).length;
  const imageCount = serpFeatures.filter((s) => s?.has_image_pack).length;
  const highRiskCount = serpFeatures.filter((s) => s?.zero_click_risk === 'high').length;

  const handleExportPaaCSV = () => {
    if (!filteredPaa.length) return;

    const headers = ['Question', 'Keyword', 'Position'];
    const rows = filteredPaa.map((paa) => [
      `"${(paa.question || '').replace(/"/g, '""')}"`,
      paa.keyword || '',
      paa.position || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paa-questions-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative h-12 w-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">SERP verileri yükleniyor...</p>
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
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
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
                <div className="absolute inset-0 bg-purple-500/40 rounded-2xl blur-xl" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
              </motion.div>

              <div>
                <h1 className="text-2xl font-bold text-foreground">SERP Analizi</h1>
                <p className="text-sm text-muted-foreground">
                  {project?.project_name} - {project?.main_keyword}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPaaCSV}
                disabled={!filteredPaa.length}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                PAA CSV
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-[hsl(var(--glass-border-default))] hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isLoading && "animate-spin")} />
              </button>
              <button
                onClick={handleRunAnalysis}
                disabled={detectSerpFeatures.isPending || !numericProjectId}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  detectSerpFeatures.isPending || !numericProjectId
                    ? 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                )}
              >
                {detectSerpFeatures.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {detectSerpFeatures.isPending ? 'Analiz Ediliyor...' : 'Analizi Çalıştır'}
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
            hasRunSerp
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-cyan-500/10 border border-cyan-500/20'
          )}>
            {hasRunSerp ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">SERP Analizi Tamamlandı</p>
                  <p className="text-xs text-muted-foreground">
                    {serpValidation?.dataCount || 0} SERP özelliği analiz edildi.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Info className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-cyan-400">SERP Analizine Hazır</p>
                  <p className="text-xs text-muted-foreground">
                    Ana keyword için SERP analizi başlatabilirsiniz.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* SERP Features Summary */}
      <section className="px-6">
        <motion.div
          className="grid grid-cols-5 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FeatureCard
            label="Featured Snippet"
            value={featuredSnippetCount}
            total={serpFeatures.length}
            icon={ListChecks}
            color="blue"
          />
          <FeatureCard
            label="PAA"
            value={paaCount}
            total={serpFeatures.length}
            icon={HelpCircle}
            color="purple"
          />
          <FeatureCard
            label="Video Results"
            value={videoCount}
            total={serpFeatures.length}
            icon={Video}
            color="red"
          />
          <FeatureCard
            label="Image Pack"
            value={imageCount}
            total={serpFeatures.length}
            icon={Image}
            color="emerald"
          />
          <FeatureCard
            label="Zero-Click Risk"
            value={highRiskCount}
            total={serpFeatures.length}
            icon={AlertTriangle}
            color="amber"
            isRisk
          />
        </motion.div>
      </section>

      {/* SERP Features Table */}
      {serpFeatures.length > 0 && (
        <section className="px-6">
          <motion.div
            className="rounded-2xl glass-2 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="px-6 py-4 border-b border-[hsl(var(--glass-border-subtle))]">
              <h3 className="text-lg font-semibold text-foreground">SERP Features</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[hsl(var(--glass-bg-3))]">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keyword</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Featured</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">PAA</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Video</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zero-Click</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                  {serpFeatures.slice(0, 20).map((feature, index) => (
                    <motion.tr
                      key={feature?.id || index}
                      className="hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.03 }}
                    >
                      <td className="px-4 py-4">
                        <span className="font-medium text-foreground">{feature?.keyword || '-'}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <FeatureIndicator active={feature?.has_featured_snippet} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <FeatureIndicator active={feature?.has_paa} count={feature?.paa_count} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <FeatureIndicator active={feature?.has_video_results} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <FeatureIndicator active={feature?.has_image_pack} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <RiskBadge risk={feature?.zero_click_risk} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>
      )}

      {/* PAA Questions */}
      <section className="px-6 pb-6">
        <motion.div
          className="rounded-2xl glass-2 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="px-6 py-4 border-b border-[hsl(var(--glass-border-subtle))] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">People Also Ask</h3>
              <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-semibold">
                {paaQuestions.length} soru
              </span>
            </div>
            <div className="relative w-64">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Soru ara..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="p-6">
            {filteredPaa.length > 0 ? (
              <div className="grid gap-3">
                {filteredPaa.map((paa, index) => (
                  <motion.div
                    key={paa?.id || index}
                    className="rounded-xl glass-1 p-4 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.02 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-purple-500/10">
                        <HelpCircle className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{paa?.question}</p>
                        {paa?.keyword && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Keyword: {paa.keyword}
                            {paa?.position && <span className="ml-2">• Position: {paa.position}</span>}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="p-4 rounded-xl bg-[hsl(var(--glass-bg-2))]">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">
                  {paaQuestions.length === 0
                    ? 'Henüz PAA verisi yok. Önce "SERP Analizi" adımını çalıştırın.'
                    : 'Aramaya uygun soru bulunamadı.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </PageTransition>
  );
}

function FeatureCard({
  label,
  value,
  total,
  icon: Icon,
  color,
  isRisk = false,
}: {
  label: string;
  value: number;
  total: number;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'red' | 'emerald' | 'amber';
  isRisk?: boolean;
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    red: 'text-red-400 bg-red-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  };

  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-xl glass-1 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('p-2 rounded-lg', colors[color])}>
          <Icon className={cn('h-4 w-4', colors[color].split(' ')[0])} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <span className="text-sm text-muted-foreground">/ {total}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-[hsl(var(--glass-bg-3))] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isRisk
              ? percentage > 50
                ? 'bg-red-500'
                : percentage > 25
                ? 'bg-amber-500'
                : 'bg-emerald-500'
              : colors[color].split(' ')[0].replace('text-', 'bg-')
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FeatureIndicator({ active, count }: { active?: boolean; count?: number }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        {count !== undefined && count > 0 && (
          <span className="text-xs text-emerald-400 font-medium">{count}</span>
        )}
      </span>
    );
  }
  return <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
}

function RiskBadge({ risk }: { risk?: string }) {
  if (!risk) return <span className="text-muted-foreground">-</span>;

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
    <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[risk.toLowerCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground')}>
      {labels[risk.toLowerCase()] || risk}
    </span>
  );
}
