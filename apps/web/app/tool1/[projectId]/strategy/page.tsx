'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Lightbulb, CheckCircle2, TrendingUp,
  AlertCircle, Loader2, Sparkles, FileText, Target,
  Calendar, Clock, ArrowRight, Star, Zap, Play, RefreshCw, XCircle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { useGenerateStrategy, useProjectValidation } from '@/lib/hooks/use-tool1';

interface PageProps {
  params: { projectId: string };
}

interface StrategyItem {
  id: number;
  title: string;
  description: string;
  keywords: string[];
  content_type: string;
  priority: 'high' | 'medium' | 'low';
  estimated_traffic?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'in_progress' | 'completed';
}

interface Project {
  id: number;
  uuid: string;
  project_name: string;
  main_keyword: string;
  status: string;
}

export default function StrategyPage({ params }: PageProps) {
  const { projectId } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const generateStrategy = useGenerateStrategy();
  const { data: validation, isLoading: validationLoading } = useProjectValidation(projectId);

  // Get strategy tool validation status
  const strategyValidation = validation?.tools?.strategy;
  const canRunStrategy = strategyValidation?.canRun ?? false;
  const hasRunStrategy = strategyValidation?.hasRun ?? false;
  const missingPrerequisites = strategyValidation?.missingPrerequisites ?? [];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      if (projectData.success) {
        setProject(projectData.project);
      }
      // TODO: Fetch strategies from API when available
      setStrategies([]);
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
      await generateStrategy.mutateAsync(project.id);
      setNotification({ type: 'success', message: 'İçerik stratejisi oluşturuldu!' });
      await fetchData();
    } catch (err) {
      setNotification({ type: 'error', message: `Hata: ${(err as Error).message}` });
    }
  };

  const filteredStrategies = strategies.filter(s => {
    if (filterPriority === 'all') return true;
    return s.priority === filterPriority;
  });

  const stats = {
    total: strategies.length,
    high: strategies.filter(s => s.priority === 'high').length,
    medium: strategies.filter(s => s.priority === 'medium').length,
    low: strategies.filter(s => s.priority === 'low').length,
    totalTraffic: strategies.reduce((sum, s) => sum + (s.estimated_traffic || 0), 0),
  };

  const priorityConfig = {
    high: { label: 'Yüksek', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: Zap },
    medium: { label: 'Orta', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Target },
    low: { label: 'Düşük', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', icon: Clock },
  };

  const difficultyLabels = {
    easy: { label: 'Kolay', color: 'text-emerald-400' },
    medium: { label: 'Orta', color: 'text-amber-400' },
    hard: { label: 'Zor', color: 'text-red-400' },
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
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Lightbulb className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">İçerik Stratejisi</h1>
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
                disabled={generateStrategy.isPending || !project || !canRunStrategy || validationLoading}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  generateStrategy.isPending || !project || !canRunStrategy || validationLoading
                    ? 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                )}
              >
                {generateStrategy.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : validationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {generateStrategy.isPending ? 'Oluşturuluyor...' : 'Strateji Oluştur'}
              </button>
              {/* Validation Tooltip */}
              {!canRunStrategy && !validationLoading && missingPrerequisites.length > 0 && (
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
            !canRunStrategy
              ? 'bg-amber-500/10 border border-amber-500/20'
              : hasRunStrategy
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-cyan-500/10 border border-cyan-500/20'
          )}>
            {!canRunStrategy ? (
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
            ) : hasRunStrategy ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Strateji Oluşturuldu</p>
                  <p className="text-xs text-muted-foreground">
                    {strategyValidation?.dataCount || 0} keyword için strateji belirlendi.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Info className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-cyan-400">Stratejiye Hazır</p>
                  <p className="text-xs text-muted-foreground">
                    {validation.stats.keywords} keyword için içerik stratejisi oluşturulabilir.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 max-w-3xl">
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
            <p className="text-2xl font-bold text-slate-400">{stats.low}</p>
            <p className="text-xs text-muted-foreground">Düşük</p>
          </div>
          <div className="rounded-xl glass-1 p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.totalTraffic.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Pot. Trafik</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">İçerik stratejisi oluşturuluyor...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
            <p className="text-foreground font-medium">{error}</p>
          </div>
        ) : strategies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-2xl bg-emerald-500/10 mb-4">
              <Lightbulb className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Strateji Henüz Oluşturulmadı</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              AI henüz içerik stratejisini oluşturmadı. Pipeline'dan "Strateji Oluştur" adımını çalıştırın.
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
              {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filterPriority === priority
                      ? 'bg-primary text-white'
                      : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground hover:text-foreground'
                  )}
                >
                  {priority === 'all' ? 'Tümü' : priorityConfig[priority].label}
                </button>
              ))}
            </div>

            {/* Strategy Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredStrategies.map((strategy, index) => {
                const config = priorityConfig[strategy.priority];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={strategy.id}
                    className={cn(
                      'rounded-xl glass-1 p-5 border-l-4',
                      config.color.split(' ')[2]
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('p-1.5 rounded-lg', config.color.split(' ').slice(0, 2).join(' '))}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.color.split(' ').slice(0, 2).join(' '))}>
                          {config.label} Öncelik
                        </span>
                      </div>
                      {strategy.difficulty && (
                        <span className={cn('text-xs font-medium', difficultyLabels[strategy.difficulty].color)}>
                          {difficultyLabels[strategy.difficulty].label}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-foreground mb-2">{strategy.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>

                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{strategy.content_type}</span>
                      {strategy.estimated_traffic && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <TrendingUp className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-blue-400">{strategy.estimated_traffic.toLocaleString()} trafik</span>
                        </>
                      )}
                    </div>

                    {strategy.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {strategy.keywords.slice(0, 3).map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-lg bg-[hsl(var(--glass-bg-3))] text-xs text-muted-foreground"
                          >
                            {kw}
                          </span>
                        ))}
                        {strategy.keywords.length > 3 && (
                          <span className="px-2 py-1 text-xs text-muted-foreground">
                            +{strategy.keywords.length - 3}
                          </span>
                        )}
                      </div>
                    )}
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
