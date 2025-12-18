'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Loader2, CheckCircle2, XCircle, RefreshCw, Download,
  Users, FileSearch, Sparkles, ChevronRight,
  Brain, Lightbulb, Search, Filter, Target, Zap, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useKeywordProject, useExportKeywordReport, useDiscoverKeywords,
  useFilterKeywords, useAnalyzeCompetitors, useScrapeCompetitors,
  useDetectSerpFeatures, useAnalyzeContentGap, useCalculateOpportunityScore,
  useGenerateStrategy,
} from '@/lib/hooks/use-tool1';
import { useTokenStats } from '@/lib/hooks/use-token-stats';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

interface PageProps {
  params: { projectId: string };
}

type PipelineStep = 'discovery' | 'filter' | 'competitors' | 'scraping' | 'serp' | 'contentGap' | 'opportunity' | 'strategy' | 'export';

interface StepStatus {
  status: 'pending' | 'running' | 'completed' | 'error';
  count?: number;
  message?: string;
}

export default function KeywordProjectDetailPage({ params }: PageProps) {
  const { projectId } = params;
  const { data, isLoading, error, refetch } = useKeywordProject(projectId);
  const exportReport = useExportKeywordReport();
  const discoverKeywords = useDiscoverKeywords();
  const filterKeywords = useFilterKeywords();
  const analyzeCompetitors = useAnalyzeCompetitors();
  const scrapeCompetitors = useScrapeCompetitors();
  const detectSerpFeatures = useDetectSerpFeatures();
  const analyzeContentGap = useAnalyzeContentGap();
  const calculateOpportunityScore = useCalculateOpportunityScore();
  const generateStrategy = useGenerateStrategy();

  const [currentStep, setCurrentStep] = useState<PipelineStep | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const project = data?.success ? data.data : null;

  // Token stats for this project
  const numericProjectId = project?.id;
  const { data: tokenStatsData } = useTokenStats(
    numericProjectId ? { project_id: numericProjectId } : undefined
  );
  const tokenStats = tokenStatsData?.success ? tokenStatsData.data?.summary : null;

  const getStepStatuses = (): Record<PipelineStep, StepStatus> => {
    if (!project) {
      return {
        discovery: { status: 'pending' }, filter: { status: 'pending' },
        competitors: { status: 'pending' }, scraping: { status: 'pending' },
        serp: { status: 'pending' }, contentGap: { status: 'pending' },
        opportunity: { status: 'pending' }, strategy: { status: 'pending' },
        export: { status: 'pending' },
      };
    }

    const keywordsFound = project.total_keywords_found || 0;
    const competitorsAnalyzed = project.total_competitors_analyzed || 0;
    const serpDone = project.total_paa_found !== undefined && project.total_paa_found !== null;

    const status = project.status as string;
    const discoveryDone = status === 'keywords_discovered' || status === 'keywords_filtered' || status === 'processing' || keywordsFound > 0;
    const filterDone = status === 'keywords_filtered' || competitorsAnalyzed > 0;

    return {
      discovery: { status: discoveryDone ? 'completed' : currentStep === 'discovery' ? 'running' : 'pending', count: keywordsFound },
      filter: { status: filterDone ? 'completed' : currentStep === 'filter' ? 'running' : 'pending' },
      competitors: { status: competitorsAnalyzed > 0 ? 'completed' : currentStep === 'competitors' ? 'running' : 'pending', count: competitorsAnalyzed },
      scraping: { status: competitorsAnalyzed > 0 ? (currentStep === 'scraping' ? 'running' : 'completed') : 'pending' },
      serp: { status: serpDone ? 'completed' : currentStep === 'serp' ? 'running' : 'pending', count: project.total_paa_found || 0 },
      contentGap: { status: keywordsFound > 0 && serpDone ? 'completed' : currentStep === 'contentGap' ? 'running' : 'pending' },
      opportunity: { status: status === 'scores_calculated' || status === 'completed' ? 'completed' : currentStep === 'opportunity' ? 'running' : 'pending' },
      strategy: { status: status === 'completed' ? 'completed' : currentStep === 'strategy' ? 'running' : 'pending' },
      export: { status: currentStep === 'export' ? 'running' : 'pending' },
    };
  };

  const stepStatuses = getStepStatuses();

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const runFullAnalysis = async () => {
    if (!project) return;
    try {
      setCurrentStep('discovery');
      await discoverKeywords.mutateAsync(project.id);
      await refetch();

      setCurrentStep('filter');
      await filterKeywords.mutateAsync(project.id);
      await refetch();

      setCurrentStep('competitors');
      await analyzeCompetitors.mutateAsync(project.id);
      await refetch();

      setCurrentStep('scraping');
      await scrapeCompetitors.mutateAsync(project.id);
      await refetch();

      setCurrentStep('serp');
      await detectSerpFeatures.mutateAsync(project.id);
      await refetch();

      setCurrentStep('contentGap');
      await analyzeContentGap.mutateAsync(project.id);
      await refetch();

      setCurrentStep('opportunity');
      await calculateOpportunityScore.mutateAsync(project.id);
      await refetch();

      setCurrentStep('strategy');
      await generateStrategy.mutateAsync(project.id);
      await refetch();

      setCurrentStep(null);
      showNotification('success', 'Tüm analizler tamamlandı!');
    } catch (err) {
      setCurrentStep(null);
      showNotification('error', `Hata: ${(err as Error).message}`);
      refetch();
    }
  };

  const runStep = async (step: PipelineStep) => {
    if (!project) return;
    try {
      setCurrentStep(step);
      switch (step) {
        case 'discovery': await discoverKeywords.mutateAsync(project.id); break;
        case 'filter': await filterKeywords.mutateAsync(project.id); break;
        case 'competitors': await analyzeCompetitors.mutateAsync(project.id); break;
        case 'scraping': await scrapeCompetitors.mutateAsync(project.id); break;
        case 'serp': await detectSerpFeatures.mutateAsync(project.id); break;
        case 'contentGap': await analyzeContentGap.mutateAsync(project.id); break;
        case 'opportunity': await calculateOpportunityScore.mutateAsync(project.id); break;
        case 'strategy': await generateStrategy.mutateAsync(project.id); break;
        case 'export': await exportReport.mutateAsync({ projectId: project.id, format: 'csv' }); break;
      }
      setCurrentStep(null);
      showNotification('success', 'İşlem tamamlandı!');
      refetch();
    } catch (err) {
      setCurrentStep(null);
      showNotification('error', `Hata: ${(err as Error).message}`);
    }
  };

  const isRunning = currentStep !== null;
  const completedSteps = Object.entries(stepStatuses).filter(([key, s]) => key !== 'export' && s.status === 'completed').length;
  const progress = (completedSteps / 8) * 100;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-xl bg-red-500/10 mb-3">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-foreground font-medium mb-1">Proje bulunamadı</p>
          <Link href="/tool1" className="text-sm text-primary hover:underline">
            Projelere Dön
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'discovery', title: 'Keyword Keşfi', desc: 'İlgili arama terimlerini keşfet', icon: Search, status: stepStatuses.discovery },
    { key: 'filter', title: 'AI Filtreleme', desc: 'Düşük potansiyelli keywordleri ele', icon: Filter, status: stepStatuses.filter, ai: true },
    { key: 'competitors', title: 'Rakip Tespiti', desc: 'SERP rakiplerini belirle', icon: Users, status: stepStatuses.competitors },
    { key: 'scraping', title: 'İçerik Tarama', desc: 'Rakip içeriklerini analiz et', icon: FileSearch, status: stepStatuses.scraping },
    { key: 'serp', title: 'SERP Analizi', desc: 'Featured snippets, PAA tespit et', icon: Sparkles, status: stepStatuses.serp },
    { key: 'contentGap', title: 'Content Gap', desc: 'İçerik fırsatlarını bul', icon: Brain, status: stepStatuses.contentGap, ai: true },
    { key: 'opportunity', title: 'Fırsat Skoru', desc: 'Zorluk ve potansiyel skorla', icon: Target, status: stepStatuses.opportunity, ai: true },
    { key: 'strategy', title: 'SEO Strateji', desc: 'İçerik stratejisi oluştur', icon: Lightbulb, status: stepStatuses.strategy, ai: true },
  ] as const;

  const allStepsCompleted = steps.every(s => s.status.status === 'completed');

  return (
    <PageTransition className="min-h-screen flex flex-col">
      {/* Toast */}
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
          >
            {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <section className="px-6 py-6 border-b border-[hsl(var(--glass-border-subtle))]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/tool1" className="hover:text-foreground transition-colors">
            Keyword Research
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{project.project_name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">{project.project_name}</h1>
                {isRunning && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-semibold text-blue-500">İşleniyor</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {project.main_keyword}
                {project.client_name && <span className="ml-2">• {project.client_name}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{project.total_keywords_found || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Keywords</p>
              </div>
              <div className="w-px h-8 bg-[hsl(var(--glass-border-subtle))]" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{project.total_competitors_analyzed || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rakip</p>
              </div>
              <div className="w-px h-8 bg-[hsl(var(--glass-border-subtle))]" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{project.total_paa_found || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PAA</p>
              </div>
              {tokenStats && tokenStats.total_tokens > 0 && (
                <>
                  <div className="w-px h-8 bg-[hsl(var(--glass-border-subtle))]" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-400">
                      {Number(tokenStats.total_tokens) >= 1000
                        ? `${(Number(tokenStats.total_tokens) / 1000).toFixed(1)}K`
                        : tokenStats.total_tokens}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Token</p>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl border border-[hsl(var(--glass-border-default))] hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>

            {project.status === 'completed' && (
              <button
                onClick={() => exportReport.mutate({ projectId: project.id })}
                disabled={exportReport.isPending}
                className="p-2.5 rounded-xl border border-[hsl(var(--glass-border-default))] hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                {exportReport.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Download className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}

            <button
              onClick={runFullAnalysis}
              disabled={isRunning || project.status === 'completed'}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isRunning || project.status === 'completed'
                  ? 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              )}
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {isRunning ? 'Çalışıyor...' : 'Tam Analiz'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--glass-bg-2))] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{completedSteps}/8</span>
        </div>
      </section>

      {/* Pipeline */}
      <section className="flex-1 px-6 py-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-muted-foreground">AI Pipeline</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="h-3 w-3" />
            8 adım
          </span>
        </div>

        {/* Pipeline Grid */}
        <div className="grid grid-cols-2 gap-3">
          {steps.map((step, index) => {
            const stepKey = step.key as PipelineStep;
            const isActive = currentStep === stepKey;
            const prevStep = index > 0 ? steps[index - 1] : null;
            const canRun = !isRunning && (prevStep === null || prevStep.status.status === 'completed');

            return (
              <StepCard
                key={step.key}
                step={step}
                stepNumber={index + 1}
                isActive={isActive}
                canRun={canRun}
                onRun={() => runStep(stepKey)}
                projectId={projectId}
              />
            );
          })}
        </div>

        {/* Results & Export */}
        <div className="mt-6 pt-6 border-t border-[hsl(var(--glass-border-subtle))]">
          <div className="flex items-center justify-between">
            {/* Quick Links */}
            {((project.total_keywords_found ?? 0) > 0 || (project.total_competitors_analyzed ?? 0) > 0) && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Sonuçlar:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/keywords/${projectId}`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-1))] hover:bg-[hsl(var(--glass-bg-interactive))] border border-[hsl(var(--glass-border-subtle))] transition-colors"
                  >
                    Keywords
                  </Link>
                  <Link
                    href={`/tool1/${projectId}/filter`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-1))] hover:bg-[hsl(var(--glass-bg-interactive))] border border-[hsl(var(--glass-border-subtle))] transition-colors"
                  >
                    Filtreleme
                  </Link>
                  <Link
                    href={`/tool1/${projectId}/competitors`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-1))] hover:bg-[hsl(var(--glass-bg-interactive))] border border-[hsl(var(--glass-border-subtle))] transition-colors"
                  >
                    Rakipler
                  </Link>
                  <Link
                    href={`/tool1/${projectId}/serp`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-1))] hover:bg-[hsl(var(--glass-bg-interactive))] border border-[hsl(var(--glass-border-subtle))] transition-colors"
                  >
                    SERP
                  </Link>
                  <Link
                    href={`/tool1/${projectId}/content-gap`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-1))] hover:bg-[hsl(var(--glass-bg-interactive))] border border-[hsl(var(--glass-border-subtle))] transition-colors"
                  >
                    Content Gap
                  </Link>
                  <Link
                    href={`/tool1/${projectId}/opportunity`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-1))] hover:bg-[hsl(var(--glass-bg-interactive))] border border-[hsl(var(--glass-border-subtle))] transition-colors"
                  >
                    Fırsat Skoru
                  </Link>
                  <Link
                    href={`/tool1/${projectId}/strategy`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-1))] hover:bg-[hsl(var(--glass-bg-interactive))] border border-[hsl(var(--glass-border-subtle))] transition-colors"
                  >
                    Strateji
                  </Link>
                </div>
              </div>
            )}

            {/* Report & Export Button */}
            {allStepsCompleted ? (
              <Link
                href={`/tool1/${projectId}/report`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-500/90 text-white transition-colors"
              >
                <Download className="h-4 w-4" />
                Raporu Görüntüle
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                Tüm adımlar tamamlandığında rapor görüntülenebilir
              </div>
            )}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

// Step Card Component
function StepCard({
  step,
  stepNumber,
  isActive,
  canRun,
  onRun,
  projectId,
}: {
  step: { key: string; title: string; desc: string; icon: React.ElementType; status: StepStatus; ai?: boolean };
  stepNumber: number;
  isActive: boolean;
  canRun: boolean;
  onRun: () => void;
  projectId: string;
}) {
  const Icon = step.icon;
  const status = step.status.status;

  const statusStyles = {
    pending: 'bg-[hsl(var(--glass-bg-1))] border-[hsl(var(--glass-border-subtle))]',
    running: 'bg-[hsl(var(--glass-bg-2))] border-primary shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    completed: 'bg-[hsl(var(--glass-bg-1))] border-emerald-500/30',
    error: 'bg-[hsl(var(--glass-bg-1))] border-red-500/30',
  };

  const iconStyles = {
    pending: 'text-muted-foreground',
    running: 'text-primary',
    completed: 'text-emerald-500',
    error: 'text-red-500',
  };

  const detailLinks: Record<string, string> = {
    discovery: `/keywords/${projectId}`,
    filter: `/tool1/${projectId}/filter`,
    competitors: `/tool1/${projectId}/competitors`,
    scraping: `/tool1/${projectId}/competitors`,
    serp: `/tool1/${projectId}/serp`,
    contentGap: `/tool1/${projectId}/content-gap`,
    opportunity: `/tool1/${projectId}/opportunity`,
    strategy: `/tool1/${projectId}/strategy`,
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border px-4 py-3 transition-all',
        statusStyles[status]
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0', iconStyles[status])}>
          {isActive ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : status === 'completed' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono text-muted-foreground/70">{stepNumber}.</span>
            <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
            {step.ai && (
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">AI</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{step.desc}</p>
        </div>

        {/* Action */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {step.status.count !== undefined && step.status.count > 0 && (
            <span className="text-xs font-medium text-foreground bg-[hsl(var(--glass-bg-2))] px-2 py-1 rounded-lg">
              {step.status.count}
            </span>
          )}
          {status === 'completed' ? (
            <Link
              href={detailLinks[step.key]}
              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={onRun}
              disabled={!canRun}
              className={cn(
                'p-2 rounded-lg transition-colors',
                canRun
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground/50 cursor-not-allowed'
              )}
            >
              <Play className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
