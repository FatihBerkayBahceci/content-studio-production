'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, GitBranch, CheckCircle2, XCircle, Search,
  TrendingUp, AlertCircle, Loader2, FileText, Target,
  Sparkles, BarChart3, ExternalLink, Play, RefreshCw, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { useAnalyzeContentGap, useProjectValidation } from '@/lib/hooks/use-tool1';

interface PageProps {
  params: { projectId: string };
}

interface ContentGap {
  id: number;
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  opportunity_type: 'missing' | 'weak' | 'improve';
  competitor_count?: number;
  suggested_content_type?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface Project {
  id: number;
  uuid: string;
  project_name: string;
  main_keyword: string;
  status: string;
}

export default function ContentGapPage({ params }: PageProps) {
  const { projectId } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'missing' | 'weak' | 'improve'>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const analyzeContentGap = useAnalyzeContentGap();
  const { data: validation, isLoading: validationLoading } = useProjectValidation(projectId);

  // Get content gap tool validation status
  const contentGapValidation = validation?.tools?.contentGap;
  const canRunContentGap = contentGapValidation?.canRun ?? false;
  const hasRunContentGap = contentGapValidation?.hasRun ?? false;
  const missingPrerequisites = contentGapValidation?.missingPrerequisites ?? [];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      if (projectData.success) {
        setProject(projectData.project);
      }
      // TODO: Fetch content gaps from API when available
      setGaps([]);
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
      await analyzeContentGap.mutateAsync(project.id);
      setNotification({ type: 'success', message: 'İçerik boşluğu analizi tamamlandı!' });
      await fetchData();
    } catch (err) {
      setNotification({ type: 'error', message: `Hata: ${(err as Error).message}` });
    }
  };

  const filteredGaps = gaps.filter(gap => {
    if (filterType === 'all') return true;
    return gap.opportunity_type === filterType;
  });

  const stats = {
    total: gaps.length,
    missing: gaps.filter(g => g.opportunity_type === 'missing').length,
    weak: gaps.filter(g => g.opportunity_type === 'weak').length,
    improve: gaps.filter(g => g.opportunity_type === 'improve').length,
  };

  const typeConfig = {
    missing: { label: 'Eksik İçerik', color: 'text-red-400 bg-red-500/10', icon: XCircle },
    weak: { label: 'Zayıf İçerik', color: 'text-amber-400 bg-amber-500/10', icon: AlertCircle },
    improve: { label: 'Geliştirilebilir', color: 'text-blue-400 bg-blue-500/10', icon: TrendingUp },
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
              <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20">
                <GitBranch className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">İçerik Boşluğu Analizi</h1>
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
                disabled={analyzeContentGap.isPending || !project || !canRunContentGap || validationLoading}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  analyzeContentGap.isPending || !project || !canRunContentGap || validationLoading
                    ? 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                )}
              >
                {analyzeContentGap.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : validationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {analyzeContentGap.isPending ? 'Analiz Ediliyor...' : 'Analizi Çalıştır'}
              </button>
              {/* Validation Tooltip */}
              {!canRunContentGap && !validationLoading && missingPrerequisites.length > 0 && (
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
                            {prereq === 'discovery' ? 'Keyword Keşfi' : prereq === 'scraper' ? 'Rakip Scraper' : prereq}
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
            !canRunContentGap
              ? 'bg-amber-500/10 border border-amber-500/20'
              : hasRunContentGap
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-cyan-500/10 border border-cyan-500/20'
          )}>
            {!canRunContentGap ? (
              <>
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Önkoşullar Tamamlanmadı</p>
                  <p className="text-xs text-muted-foreground">
                    Önce Keyword Keşfi veya Rakip Scraper çalıştırılmalı.
                  </p>
                </div>
                <Link
                  href={`/tool1/${projectId}`}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                >
                  Pipeline'a Git
                </Link>
              </>
            ) : hasRunContentGap ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">İçerik Boşluğu Analizi Tamamlandı</p>
                  <p className="text-xs text-muted-foreground">
                    İsterseniz tekrar çalıştırabilirsiniz.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Info className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-cyan-400">Analize Hazır</p>
                  <p className="text-xs text-muted-foreground">
                    İçerik boşluğu analizini başlatabilirsiniz.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 max-w-xl">
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Toplam</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.missing}</p>
            <p className="text-xs text-muted-foreground">Eksik</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.weak}</p>
            <p className="text-xs text-muted-foreground">Zayıf</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.improve}</p>
            <p className="text-xs text-muted-foreground">Geliştir</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">İçerik boşlukları analiz ediliyor...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
            <p className="text-foreground font-medium">{error}</p>
          </div>
        ) : gaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-2xl bg-pink-500/10 mb-4">
              <GitBranch className="h-10 w-10 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">İçerik Boşluğu Analizi Bekliyor</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              İçerik boşluğu analizi henüz yapılmadı. Pipeline'dan ilgili adımı çalıştırın.
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
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
              {(['all', 'missing', 'weak', 'improve'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filterType === type
                      ? 'bg-primary text-white'
                      : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground hover:text-foreground'
                  )}
                >
                  {type === 'all' ? 'Tümü' : typeConfig[type].label}
                </button>
              ))}
            </div>

            {/* Gaps List */}
            <div className="space-y-3">
              {filteredGaps.map((gap) => {
                const config = typeConfig[gap.opportunity_type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={gap.id}
                    className="rounded-xl glass-1 p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn('p-1 rounded', config.color)}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="font-medium text-foreground">{gap.keyword}</span>
                          {gap.priority && (
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              gap.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              gap.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            )}>
                              {gap.priority === 'high' ? 'Yüksek' : gap.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                          )}
                        </div>
                        {gap.suggested_content_type && (
                          <p className="text-sm text-muted-foreground">
                            <FileText className="h-3.5 w-3.5 inline mr-1" />
                            Önerilen: {gap.suggested_content_type}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {gap.search_volume && (
                          <span className="text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5 inline mr-1" />
                            {gap.search_volume.toLocaleString()}
                          </span>
                        )}
                        {gap.competitor_count && (
                          <span className="text-muted-foreground">
                            {gap.competitor_count} rakip
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
