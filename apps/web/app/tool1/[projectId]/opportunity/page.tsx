'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Target, CheckCircle2, TrendingUp,
  AlertCircle, Loader2, Sparkles, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, Play, RefreshCw, XCircle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { useCalculateOpportunityScore, useProjectValidation } from '@/lib/hooks/use-tool1';

interface PageProps {
  params: { projectId: string };
}

interface OpportunityKeyword {
  id: number;
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  opportunity_score: number;
  potential_traffic?: number;
  current_position?: number;
  trend?: 'up' | 'down' | 'stable';
  recommendation?: string;
}

interface Project {
  id: number;
  uuid: string;
  project_name: string;
  main_keyword: string;
  status: string;
}

export default function OpportunityPage({ params }: PageProps) {
  const { projectId } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<OpportunityKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'volume' | 'traffic'>('score');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const calculateOpportunity = useCalculateOpportunityScore();
  const { data: validation, isLoading: validationLoading } = useProjectValidation(projectId);

  // Get opportunity tool validation status
  const opportunityValidation = validation?.tools?.opportunity;
  const canRunOpportunity = opportunityValidation?.canRun ?? false;
  const hasRunOpportunity = opportunityValidation?.hasRun ?? false;
  const missingPrerequisites = opportunityValidation?.missingPrerequisites ?? [];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      if (projectData.success) {
        setProject(projectData.project);
      }
      // TODO: Fetch opportunity scores from API when available
      setKeywords([]);
      setError(null);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleRunAnalysis = async () => {
    if (!project) return;
    try {
      await calculateOpportunity.mutateAsync(project.id);
      setNotification({ type: 'success', message: 'Fırsat skorları hesaplandı!' });
      await fetchData();
    } catch (err) {
      setNotification({ type: 'error', message: `Hata: ${(err as Error).message}` });
    }
  };

  const sortedKeywords = [...keywords].sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.opportunity_score - a.opportunity_score;
      case 'volume': return (b.search_volume || 0) - (a.search_volume || 0);
      case 'traffic': return (b.potential_traffic || 0) - (a.potential_traffic || 0);
      default: return 0;
    }
  });

  const stats = {
    total: keywords.length,
    highOpportunity: keywords.filter(k => k.opportunity_score >= 80).length,
    avgScore: keywords.length > 0
      ? Math.round(keywords.reduce((sum, k) => sum + k.opportunity_score, 0) / keywords.length)
      : 0,
    totalPotentialTraffic: keywords.reduce((sum, k) => sum + (k.potential_traffic || 0), 0),
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10';
    if (score >= 60) return 'text-blue-400 bg-blue-500/10';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10';
    return 'text-red-400 bg-red-500/10';
  };

  const TrendIcon = ({ trend }: { trend?: string }) => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <PageTransition className="min-h-screen">
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
      <div className="px-6 py-6 border-b border-[hsl(var(--glass-border-subtle))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/tool1/${projectId}`}
              className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Target className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Fırsat Skorları</h1>
                <p className="text-sm text-muted-foreground">
                  {project?.main_keyword || 'Yükleniyor...'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-[hsl(var(--glass-border-default))] hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
            >
              <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isLoading && "animate-spin")} />
            </button>
            <div className="relative group">
              <button
                onClick={handleRunAnalysis}
                disabled={calculateOpportunity.isPending || !project || !canRunOpportunity || validationLoading}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  calculateOpportunity.isPending || !project || !canRunOpportunity || validationLoading
                    ? 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                )}
              >
                {calculateOpportunity.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : validationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {calculateOpportunity.isPending ? 'Hesaplanıyor...' : 'Skoru Hesapla'}
              </button>
              {/* Validation Tooltip */}
              {!canRunOpportunity && !validationLoading && missingPrerequisites.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl bg-[hsl(var(--glass-bg-3))] border border-[hsl(var(--glass-border-default))] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Önkoşullar Eksik</p>
                      <p className="text-xs text-muted-foreground">
                        Bu aracı çalıştırmak için önce şunları tamamlayın:
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {missingPrerequisites.map((prereq) => (
                          <li key={prereq} className="text-xs text-amber-400 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-amber-400" />
                            {prereq === 'discovery' ? 'Keyword Keşfi' : prereq}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validation Status Banner */}
        {!validationLoading && validation?.success && (
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-xl mb-4',
            !canRunOpportunity
              ? 'bg-amber-500/10 border border-amber-500/20'
              : hasRunOpportunity
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-cyan-500/10 border border-cyan-500/20'
          )}>
            {!canRunOpportunity ? (
              <>
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Önkoşullar Tamamlanmadı</p>
                  <p className="text-xs text-muted-foreground">
                    Önce Keyword Keşfi çalıştırılmalı.
                  </p>
                </div>
                <Link
                  href={`/tool1/${projectId}`}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                >
                  Pipeline'a Git
                </Link>
              </>
            ) : hasRunOpportunity ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Fırsat Skorları Hesaplandı</p>
                  <p className="text-xs text-muted-foreground">
                    {opportunityValidation?.dataCount || 0} keyword skorlandı.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Info className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-cyan-400">Skorlamaya Hazır</p>
                  <p className="text-xs text-muted-foreground">
                    {validation.stats.keywords} keyword için fırsat skorları hesaplanabilir.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 max-w-2xl">
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Toplam</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.highOpportunity}</p>
            <p className="text-xs text-muted-foreground">Yüksek Fırsat</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.avgScore}</p>
            <p className="text-xs text-muted-foreground">Ort. Skor</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.totalPotentialTraffic.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Potansiyel Trafik</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Fırsat skorları hesaplanıyor...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
            <p className="text-foreground font-medium">{error}</p>
          </div>
        ) : keywords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-2xl bg-amber-500/10 mb-4">
              <Target className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Fırsat Skorları Hesaplanmadı</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              AI henüz fırsat skorlarını hesaplamadı. Pipeline'dan ilgili adımı çalıştırın.
            </p>
            <Link
              href={`/tool1/${projectId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Pipeline'a Git
            </Link>
          </div>
        ) : (
          <>
            {/* Sort Options */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground">Sırala:</span>
              {(['score', 'volume', 'traffic'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    sortBy === sort
                      ? 'bg-primary text-white'
                      : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground hover:text-foreground'
                  )}
                >
                  {sort === 'score' ? 'Skor' : sort === 'volume' ? 'Hacim' : 'Trafik'}
                </button>
              ))}
            </div>

            {/* Keywords List */}
            <div className="space-y-3">
              {sortedKeywords.map((kw, index) => (
                <motion.div
                  key={kw.id}
                  className="rounded-xl glass-1 p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg',
                        getScoreColor(kw.opportunity_score)
                      )}>
                        {kw.opportunity_score}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{kw.keyword}</span>
                          <TrendIcon trend={kw.trend} />
                        </div>
                        {kw.recommendation && (
                          <p className="text-sm text-muted-foreground">{kw.recommendation}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      {kw.search_volume && (
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{kw.search_volume.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Hacim</p>
                        </div>
                      )}
                      {kw.potential_traffic && (
                        <div className="text-center">
                          <p className="font-semibold text-blue-400">{kw.potential_traffic.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Pot. Trafik</p>
                        </div>
                      )}
                      {kw.difficulty !== undefined && (
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{kw.difficulty}</p>
                          <p className="text-xs text-muted-foreground">Zorluk</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
