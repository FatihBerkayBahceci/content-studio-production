'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Filter, CheckCircle2, XCircle, Search,
  TrendingUp, AlertCircle, Loader2, RefreshCw, Brain,
  ThumbsUp, ThumbsDown, Sparkles, Play, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { useFilterKeywords, useProjectValidation } from '@/lib/hooks/use-tool1';

interface PageProps {
  params: { projectId: string };
}

interface FilteredKeyword {
  id: number;
  keyword: string;
  search_volume?: number;
  keyword_difficulty?: number;
  competition?: string;
  cpc?: number;
  content_priority?: string;
  search_intent?: string;
  keyword_cluster?: string;
}

interface Project {
  id: number;
  uuid: string;
  project_name: string;
  main_keyword: string;
  status: string;
  total_keywords_found?: number;
}

export default function FilterPage({ params }: PageProps) {
  const { projectId } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<FilteredKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filterKeywords = useFilterKeywords();
  const { data: validation, isLoading: validationLoading } = useProjectValidation(projectId);

  // Get filter tool validation status
  const filterValidation = validation?.tools?.filter;
  const canRunFilter = filterValidation?.canRun ?? false;
  const hasRunFilter = filterValidation?.hasRun ?? false;
  const missingPrerequisites = filterValidation?.missingPrerequisites ?? [];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch project details
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      if (projectData.success) {
        setProject(projectData.project);
      }

      // Fetch keywords with priority info
      const keywordsRes = await fetch(`/api/projects/${projectId}/keywords`);
      const keywordsData = await keywordsRes.json();
      if (keywordsData.success && keywordsData.data) {
        setKeywords(keywordsData.data);
      }
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

  const handleRunFilter = async () => {
    if (!project) return;
    try {
      await filterKeywords.mutateAsync(project.id);
      setNotification({ type: 'success', message: 'AI filtreleme tamamlandı!' });
      // Refetch data after filtering
      await fetchData();
    } catch (err) {
      setNotification({ type: 'error', message: `Hata: ${(err as Error).message}` });
    }
  };

  // Filter keywords by priority
  const filteredKeywords = keywords.filter(kw => {
    if (filterView === 'all') return true;
    return kw.content_priority?.toLowerCase() === filterView;
  });

  // Check if filtering has been done (keywords have content_priority)
  const isFiltered = keywords.some(kw => kw.content_priority);

  const stats = {
    total: keywords.length,
    high: keywords.filter(k => k.content_priority === 'high').length,
    medium: keywords.filter(k => k.content_priority === 'medium').length,
    low: keywords.filter(k => k.content_priority === 'low').length,
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
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Filter className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">AI Filtreleme</h1>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">AI</span>
                </div>
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
                onClick={handleRunFilter}
                disabled={filterKeywords.isPending || !canRunFilter || validationLoading}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  filterKeywords.isPending || !canRunFilter || validationLoading
                    ? 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                )}
              >
                {filterKeywords.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : validationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {filterKeywords.isPending ? 'Filtreleniyor...' : 'Filtrelemeyi Çalıştır'}
              </button>
              {/* Validation Tooltip */}
              {!canRunFilter && !validationLoading && missingPrerequisites.length > 0 && (
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
            !canRunFilter
              ? 'bg-amber-500/10 border border-amber-500/20'
              : hasRunFilter
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-cyan-500/10 border border-cyan-500/20'
          )}>
            {!canRunFilter ? (
              <>
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Önkoşullar Tamamlanmadı</p>
                  <p className="text-xs text-muted-foreground">
                    Bu aracı çalıştırmak için önce Keyword Keşfi yapmalısınız.
                  </p>
                </div>
                <Link
                  href={`/tool1/${projectId}`}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                >
                  Pipeline'a Git
                </Link>
              </>
            ) : hasRunFilter ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Filtreleme Tamamlandı</p>
                  <p className="text-xs text-muted-foreground">
                    {filterValidation?.dataCount || 0} keyword filtrelendi. İsterseniz tekrar çalıştırabilirsiniz.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Info className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-cyan-400">Filtrelemeye Hazır</p>
                  <p className="text-xs text-muted-foreground">
                    {validation.stats.keywords} keyword bulundu. AI filtrelemeyi başlatabilirsiniz.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 max-w-lg">
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Toplam</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.high}</p>
            <p className="text-xs text-muted-foreground">Yüksek</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.medium}</p>
            <p className="text-xs text-muted-foreground">Orta</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.low}</p>
            <p className="text-xs text-muted-foreground">Düşük</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Veriler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
            <p className="text-foreground font-medium">{error}</p>
          </div>
        ) : keywords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-2xl bg-cyan-500/10 mb-4">
              <Brain className="h-10 w-10 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Keyword Verisi Yok</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Önce "Keyword Keşfi" adımını çalıştırarak keyword verisi oluşturun.
            </p>
            <Link
              href={`/tool1/${projectId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Pipeline'a Git
            </Link>
          </div>
        ) : !isFiltered ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-2xl bg-cyan-500/10 mb-4">
              <Brain className="h-10 w-10 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">AI Filtreleme Bekliyor</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {keywords.length} keyword bulundu. AI ile filtrelemek için yukarıdaki butona tıklayın.
            </p>
            <button
              onClick={handleRunFilter}
              disabled={filterKeywords.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
            >
              {filterKeywords.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              {filterKeywords.isPending ? 'Filtreleniyor...' : 'AI Filtrelemeyi Başlat'}
            </button>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
              {(['all', 'high', 'medium', 'low'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setFilterView(view)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filterView === view
                      ? 'bg-primary text-white'
                      : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground hover:text-foreground'
                  )}
                >
                  {view === 'all' ? 'Tümü' : view === 'high' ? 'Yüksek' : view === 'medium' ? 'Orta' : 'Düşük'}
                </button>
              ))}
              <span className="ml-4 text-sm text-muted-foreground">
                {filteredKeywords.length} sonuç
              </span>
            </div>

            {/* Keywords List */}
            <div className="space-y-3">
              {filteredKeywords.map((kw, index) => (
                <motion.div
                  key={kw.id || index}
                  className="rounded-xl glass-1 p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3) }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={kw.content_priority} />
                        <span className="font-medium text-foreground">{kw.keyword}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {kw.search_intent && (
                          <span className="capitalize">{kw.search_intent}</span>
                        )}
                        {kw.keyword_cluster && (
                          <span className="text-xs bg-[hsl(var(--glass-bg-2))] px-2 py-0.5 rounded">
                            {kw.keyword_cluster}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {kw.search_volume && (
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{kw.search_volume.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Hacim</p>
                        </div>
                      )}
                      {kw.keyword_difficulty && (
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{kw.keyword_difficulty}</p>
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

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;

  const config: Record<string, { color: string; label: string }> = {
    high: { color: 'bg-red-500/20 text-red-400', label: 'Yüksek' },
    medium: { color: 'bg-amber-500/20 text-amber-400', label: 'Orta' },
    low: { color: 'bg-emerald-500/20 text-emerald-400', label: 'Düşük' },
  };

  const cfg = config[priority.toLowerCase()] || { color: 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground', label: priority };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', cfg.color)}>
      {cfg.label}
    </span>
  );
}
