'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Download,
  ExternalLink,
  BarChart3,
  Target,
  Users,
  HelpCircle,
  TrendingUp,
  Zap,
  FileJson,
  FileCode,
  Table2,
  CheckCircle2,
  Globe,
  Building2,
  MapPin,
  Languages,
  Search,
  Video,
  Image,
  Map,
  Info,
  AlertTriangle,
  BookOpen,
  FileQuestion,
  ArrowUpRight,
  Layers,
  Clock,
  Award,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useReportData, useKeywordProject, useExportKeywordReport, useExportReportHtml } from '@/lib/hooks/use-tool1';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

interface PageProps {
  params: { projectId: string };
}

export default function ReportPage({ params }: PageProps) {
  const { projectId } = params;
  // Support both numeric ID and UUID - pass to API as string
  const { data: projectData } = useKeywordProject(projectId);
  // Get numeric ID from project data for report API, or try parsing directly
  const numericProjectId = projectData?.data?.id || (parseInt(projectId, 10) || null);
  const { data: reportData, isLoading, error } = useReportData(numericProjectId);
  const exportReport = useExportKeywordReport();
  const exportHtml = useExportReportHtml();

  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities'>('overview');

  const project = projectData?.success ? projectData.data : null;
  // API returns { success, project, statistics, ... } directly, not wrapped in data
  // Cast to any to access the direct properties from n8n response
  const report = reportData?.success ? (reportData as any) : null;

  const handleExport = (format: 'csv' | 'json' | 'html') => {
    if (!numericProjectId) return;
    exportReport.mutate({ projectId: numericProjectId, format });
  };

  const handleOpenHtml = () => {
    if (!numericProjectId) return;
    exportHtml.mutate(numericProjectId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative h-12 w-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Rapor yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <PageTransition className="space-y-6">
        <section className="px-6 py-6">
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="p-4 rounded-xl bg-red-500/10">
              <FileText className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-muted-foreground">Rapor verisi bulunamadı. Önce tüm analiz adımlarını tamamlayın.</p>
            <Link
              href={`/tool1/${projectId}`}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              Projeye Dön
            </Link>
          </div>
        </section>
      </PageTransition>
    );
  }

  // Map API response to expected stats structure
  const stats = {
    total_keywords: report.statistics?.total_keywords || 0,
    filtered_keywords: report.statistics?.total_keywords || 0,
    total_competitors: report.statistics?.total_competitors || 0,
    unique_competitors: report.statistics?.total_competitors || 0,
    total_paa_questions: report.statistics?.total_paa_questions || 0,
    avg_word_count: report.statistics?.avg_competitor_word_count || 0,
    high_priority: report.priority_breakdown?.high || 0,
    medium_priority: report.priority_breakdown?.medium || 0,
    low_priority: report.priority_breakdown?.low || 0,
    low_hanging_fruits: report.priority_breakdown?.high || 0,
    pillar_pages: report.content_plan?.pillar_pages || 0,
    cluster_pages: report.content_plan?.cluster_pages || 0,
    avg_volume: report.statistics?.avg_volume || 0,
    avg_difficulty: report.statistics?.avg_difficulty || 0,
    avg_opportunity: report.statistics?.avg_opportunity_score || 0,
  };

  // Create top_opportunities from raw_data.keywords sorted by opportunity_score
  const topOpportunities = (report.raw_data?.keywords || [])
    .filter((k: any) => k.opportunity_score)
    .sort((a: any, b: any) => parseFloat(b.opportunity_score) - parseFloat(a.opportunity_score))
    .slice(0, 10)
    .map((k: any) => ({
      keyword: k.keyword,
      volume: k.search_volume || 0,
      difficulty: k.keyword_difficulty || 0,
      opportunity_score: parseFloat(k.opportunity_score) || 0,
      intent: k.search_intent,
      priority: k.content_priority,
      page_type: k.page_type,
      content_format: k.content_format,
    }));

  // SERP Features data
  const serpFeatures = report.serp_features || {};

  // Content Format Distribution
  const contentFormats = report.content_format_distribution || {};

  // Clusters data
  const clusters = report.clusters || {};

  // Content Plan
  const contentPlan = report.content_plan || {};

  // Top Competitors (get top 10 unique domains by word count)
  const topCompetitors = (() => {
    const competitors = report.raw_data?.competitors || [];
    const seenDomains = new Set<string>();
    return competitors
      .filter((c: any) => {
        if (c.id === 0 || !c.competitor_domain) return false;
        if (seenDomains.has(c.competitor_domain)) return false;
        seenDomains.add(c.competitor_domain);
        return true;
      })
      .sort((a: any, b: any) => (b.word_count || 0) - (a.word_count || 0))
      .slice(0, 10);
  })();

  // Generated timestamp
  const generatedAt = report.generated_at;

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-[hsl(var(--glass-border-subtle))]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />
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
              <div className="absolute inset-0 bg-emerald-500/40 rounded-2xl blur-xl" />
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <FileText className="h-6 w-6 text-emerald-400" />
              </div>
            </motion.div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Analiz Raporu</h1>
              <p className="text-sm text-muted-foreground">
                {report.project?.name || project?.project_name || '-'} - {report.project?.main_keyword || project?.main_keyword || '-'}
              </p>
            </div>

            {/* Generated timestamp */}
            {generatedAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{new Date(generatedAt).toLocaleString('tr-TR')}</span>
              </div>
            )}
          </motion.div>

          {/* Project Info Bar */}
          <motion.div
            className="flex items-center gap-6 mt-4 pt-4 border-t border-[hsl(var(--glass-border-subtle))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Müşteri:</span>
              <span className="text-foreground font-medium">{report.project?.client_name || project?.client_name || '-'}</span>
            </div>
            {(report.project?.clientDomain || (project as any)?.clientDomain || (project as any)?.client_domain) && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={report.project?.clientDomain || (project as any)?.clientDomain || (project as any)?.client_domain}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {(report.project?.clientDomain || (project as any)?.clientDomain || (project as any)?.client_domain || '').replace(/^https?:\/\//, '')}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{report.project?.targetCountry || project?.targetCountry || 'TR'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{report.project?.targetLanguage || project?.targetLanguage || 'tr'}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className={cn(
                'px-2 py-1 rounded-lg text-xs font-medium',
                (report.project?.status || project?.status) === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              )}>
                {(report.project?.status || project?.status) === 'completed' ? 'Tamamlandı' : (report.project?.status || project?.status || '-')}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Export Buttons */}
      <section className="px-6">
        <motion.div
          className="rounded-2xl glass-2 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Raporu Dışa Aktar</h3>
          <div className="grid grid-cols-4 gap-4">
            <ExportButton
              icon={ExternalLink}
              label="HTML Rapor"
              description="Tarayıcıda görüntüle"
              color="blue"
              onClick={handleOpenHtml}
              loading={exportHtml.isPending}
            />
            <ExportButton
              icon={FileCode}
              label="HTML İndir"
              description="Biçimlendirilmiş rapor"
              color="purple"
              onClick={() => handleExport('html')}
              loading={exportReport.isPending && exportReport.variables?.format === 'html'}
            />
            <ExportButton
              icon={Table2}
              label="CSV İndir"
              description="Tablo verileri"
              color="emerald"
              onClick={() => handleExport('csv')}
              loading={exportReport.isPending && exportReport.variables?.format === 'csv'}
            />
            <ExportButton
              icon={FileJson}
              label="JSON İndir"
              description="Ham veri"
              color="amber"
              onClick={() => handleExport('json')}
              loading={exportReport.isPending && exportReport.variables?.format === 'json'}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Overview */}
      <section className="px-6">
        <motion.div
          className="grid grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StatCard
            label="Toplam Keyword"
            value={stats.total_keywords}
            subValue={`${stats.filtered_keywords} filtrelenmiş`}
            icon={BarChart3}
            color="blue"
          />
          <StatCard
            label="Rakip Analizi"
            value={stats.total_competitors}
            subValue={`${stats.unique_competitors} unique domain`}
            icon={Users}
            color="purple"
          />
          <StatCard
            label="PAA Soruları"
            value={stats.total_paa_questions}
            subValue="People Also Ask"
            icon={HelpCircle}
            color="pink"
          />
          <StatCard
            label="Ort. Kelime Sayısı"
            value={stats.avg_word_count}
            subValue="Rakip içerikler"
            icon={FileText}
            color="emerald"
          />
        </motion.div>
      </section>

      {/* Priority & Page Types */}
      <section className="px-6">
        <motion.div
          className="grid grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Priority Distribution */}
          <div className="rounded-2xl glass-2 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Öncelik Dağılımı</h3>
            <div className="space-y-4">
              <PriorityBar label="Yüksek Öncelik" value={stats.high_priority} total={stats.total_keywords} color="red" />
              <PriorityBar label="Orta Öncelik" value={stats.medium_priority} total={stats.total_keywords} color="amber" />
              <PriorityBar label="Düşük Öncelik" value={stats.low_priority} total={stats.total_keywords} color="emerald" />
              <div className="pt-4 border-t border-[hsl(var(--glass-border-subtle))]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Low-Hanging Fruits</span>
                  <span className="text-lg font-bold text-primary">{stats.low_hanging_fruits}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Page Types */}
          <div className="rounded-2xl glass-2 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Sayfa Tipleri</h3>
            <div className="space-y-4">
              <PageTypeCard label="Pillar Sayfaları" value={stats.pillar_pages} icon={Target} color="purple" />
              <PageTypeCard label="Cluster Sayfaları" value={stats.cluster_pages} icon={TrendingUp} color="blue" />
            </div>
            <div className="mt-6 pt-4 border-t border-[hsl(var(--glass-border-subtle))]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Ort. Volume</p>
                  <p className="text-xl font-bold text-foreground">{Math.round(stats.avg_volume).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ort. Difficulty</p>
                  <p className="text-xl font-bold text-foreground">{Math.round(stats.avg_difficulty)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Intent Distribution & Content Format Distribution */}
      <section className="px-6">
        <motion.div
          className="grid grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Intent Distribution */}
          {report.intent_distribution && Object.keys(report.intent_distribution).length > 0 && (
            <div className="rounded-2xl glass-2 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Search Intent Dağılımı</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(report.intent_distribution).map(([intent, count]) => (
                  <IntentCard key={intent} intent={intent} count={count as number} total={stats.total_keywords} />
                ))}
              </div>
            </div>
          )}

          {/* Content Format Distribution */}
          {Object.keys(contentFormats).length > 0 && (
            <div className="rounded-2xl glass-2 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">İçerik Formatları</h3>
              <div className="space-y-3">
                {Object.entries(contentFormats).map(([format, count]) => (
                  <ContentFormatBar
                    key={format}
                    format={format}
                    count={count as number}
                    total={stats.total_keywords}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* SERP Features */}
      {serpFeatures && Object.keys(serpFeatures).length > 0 && (
        <section className="px-6">
          <motion.div
            className="rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-foreground">SERP Özellikleri</h3>
              {serpFeatures.analyzed_at && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Analiz: {new Date(serpFeatures.analyzed_at).toLocaleDateString('tr-TR')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              <SerpFeatureCard
                icon={BookOpen}
                label="Featured Snippet"
                active={serpFeatures.has_featured_snippet}
                detail={serpFeatures.featured_snippet_type !== 'none' ? serpFeatures.featured_snippet_type : undefined}
              />
              <SerpFeatureCard
                icon={FileQuestion}
                label="PAA (İlgili Sorular)"
                active={serpFeatures.has_paa}
                detail={serpFeatures.paa_count > 0 ? `${serpFeatures.paa_count} soru` : undefined}
              />
              <SerpFeatureCard
                icon={Video}
                label="Video Sonuçları"
                active={serpFeatures.has_video_results}
              />
              <SerpFeatureCard
                icon={Image}
                label="Görsel Paketi"
                active={serpFeatures.has_image_pack}
              />
              <SerpFeatureCard
                icon={Map}
                label="Local Pack"
                active={serpFeatures.has_local_pack}
              />
              <SerpFeatureCard
                icon={Info}
                label="Knowledge Panel"
                active={serpFeatures.has_knowledge_panel}
              />
              <div className="col-span-2 rounded-xl glass-1 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn(
                      'h-5 w-5',
                      serpFeatures.zero_click_risk === 'high' ? 'text-red-400' :
                      serpFeatures.zero_click_risk === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                    )} />
                    <span className="text-sm text-muted-foreground">Zero-Click Riski</span>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded-lg text-sm font-semibold',
                    serpFeatures.zero_click_risk === 'high' ? 'bg-red-500/20 text-red-400' :
                    serpFeatures.zero_click_risk === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  )}>
                    {serpFeatures.zero_click_risk === 'high' ? 'Yüksek' :
                     serpFeatures.zero_click_risk === 'medium' ? 'Orta' : 'Düşük'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Content Plan Summary */}
      {contentPlan && Object.keys(contentPlan).length > 0 && (
        <section className="px-6">
          <motion.div
            className="rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Layers className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-foreground">İçerik Planı</h3>
            </div>
            <div className="grid grid-cols-5 gap-4 mb-6">
              <ContentPlanCard
                label="Toplam İçerik"
                value={contentPlan.total_content_pieces || 0}
                color="blue"
              />
              <ContentPlanCard
                label="Pillar Sayfa"
                value={contentPlan.pillar_pages || 0}
                color="purple"
              />
              <ContentPlanCard
                label="Cluster Sayfa"
                value={contentPlan.cluster_pages || 0}
                color="cyan"
              />
              <ContentPlanCard
                label="Hedef Kelime"
                value={contentPlan.total_word_target || 0}
                suffix="kelime"
                color="emerald"
              />
              <ContentPlanCard
                label="Yüksek Öncelik"
                value={contentPlan.estimated_articles?.high_priority || 0}
                suffix="makale"
                color="red"
              />
            </div>

            {/* Pillar-Cluster Map */}
            {contentPlan.pillar_cluster_map && Object.keys(contentPlan.pillar_cluster_map).length > 0 && (
              <div className="border-t border-[hsl(var(--glass-border-subtle))] pt-6">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">Pillar-Cluster Yapısı</h4>
                <div className="space-y-4">
                  {Object.entries(contentPlan.pillar_cluster_map).map(([pillarKeyword, data]: [string, any]) => (
                    <div key={pillarKeyword} className="rounded-xl glass-1 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Target className="h-5 w-5 text-purple-400" />
                        <span className="font-semibold text-foreground">{pillarKeyword}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">Pillar</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {data.clusters?.length || 0} cluster
                        </span>
                      </div>
                      {data.clusters && data.clusters.length > 0 && (
                        <div className="flex flex-wrap gap-2 ml-8">
                          {data.clusters.slice(0, 6).map((cluster: any, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs"
                            >
                              {cluster.keyword}
                            </span>
                          ))}
                          {data.clusters.length > 6 && (
                            <span className="px-2 py-1 rounded-lg bg-[hsl(var(--glass-bg-3))] text-muted-foreground text-xs">
                              +{data.clusters.length - 6} daha
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* Keyword Clusters */}
      {clusters && Object.keys(clusters).length > 0 && (
        <section className="px-6">
          <motion.div
            className="rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-foreground">Keyword Cluster'ları</h3>
              <span className="text-xs text-muted-foreground">
                {Object.keys(clusters).length} cluster
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(clusters).map(([clusterName, keywords]) => (
                <div key={clusterName} className="rounded-xl glass-1 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-foreground">{clusterName}</span>
                    <span className="text-xs text-muted-foreground">
                      {(keywords as string[]).length} keyword
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(keywords as string[]).slice(0, 8).map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs"
                      >
                        {kw}
                      </span>
                    ))}
                    {(keywords as string[]).length > 8 && (
                      <span className="px-2 py-0.5 rounded bg-[hsl(var(--glass-bg-3))] text-muted-foreground text-xs">
                        +{(keywords as string[]).length - 8}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Top Opportunities */}
      {topOpportunities && topOpportunities.length > 0 && (
        <section className="px-6 pb-6">
          <motion.div
            className="rounded-2xl glass-2 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="px-6 py-4 border-b border-[hsl(var(--glass-border-subtle))] flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-foreground">En İyi Fırsatlar</h3>
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold">
                Top {topOpportunities.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[hsl(var(--glass-bg-3))]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Keyword</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Volume</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Difficulty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Fırsat</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Intent</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Öncelik</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Sayfa Tipi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                  {topOpportunities.map((opp: any, index: number) => (
                    <tr key={index} className="hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{opp.keyword}</td>
                      <td className="px-4 py-3 text-right text-foreground">{opp.volume?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <DifficultyBadge value={opp.difficulty} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <OpportunityBadge value={opp.opportunity_score} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <IntentBadge intent={opp.intent} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PriorityBadge priority={opp.priority} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PageTypeBadge pageType={opp.page_type} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>
      )}

      {/* Top Competitors */}
      {topCompetitors && topCompetitors.length > 0 && (
        <section className="px-6">
          <motion.div
            className="rounded-2xl glass-2 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="px-6 py-4 border-b border-[hsl(var(--glass-border-subtle))] flex items-center gap-3">
              <Award className="h-5 w-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-foreground">Top Rakipler</h3>
              <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-semibold">
                Top {topCompetitors.length}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                Ortalama Kelime: {stats.avg_word_count.toLocaleString()}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[hsl(var(--glass-bg-3))]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Sıra</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Domain</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Başlık</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Kelime</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">H1</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">H2</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">H3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                  {topCompetitors.map((comp: any, index: number) => (
                    <tr key={comp.id || index} className="hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                          index < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground'
                        )}>
                          {comp.serp_position || index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={comp.competitor_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          {comp.competitor_domain}
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground line-clamp-1" title={comp.title}>
                          {comp.title || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'font-semibold',
                          (comp.word_count || 0) >= 3000 ? 'text-emerald-400' :
                          (comp.word_count || 0) >= 1500 ? 'text-amber-400' : 'text-muted-foreground'
                        )}>
                          {(comp.word_count || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {comp.h1_count ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {comp.h2_count ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {comp.h3_count ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>
      )}

      {/* Quick Links */}
      <section className="px-6 pb-6">
        <motion.div
          className="rounded-2xl glass-1 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Detaylı Görünümler</h3>
          <div className="flex items-center gap-3">
            <Link
              href={`/tool1/${projectId}/keywords`}
              className="px-4 py-2 rounded-xl glass-2 hover:bg-[hsl(var(--glass-bg-interactive))] text-sm font-medium transition-colors"
            >
              Tüm Keywords
            </Link>
            <Link
              href={`/tool1/${projectId}/competitors`}
              className="px-4 py-2 rounded-xl glass-2 hover:bg-[hsl(var(--glass-bg-interactive))] text-sm font-medium transition-colors"
            >
              Rakip Analizi
            </Link>
            <Link
              href={`/tool1/${projectId}/serp`}
              className="px-4 py-2 rounded-xl glass-2 hover:bg-[hsl(var(--glass-bg-interactive))] text-sm font-medium transition-colors"
            >
              SERP & PAA
            </Link>
          </div>
        </motion.div>
      </section>
    </PageTransition>
  );
}

function ExportButton({
  icon: Icon,
  label,
  description,
  color,
  onClick,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  color: 'blue' | 'purple' | 'emerald' | 'amber';
  onClick: () => void;
  loading?: boolean;
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    purple: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors',
        colors[color],
        loading && 'opacity-50 cursor-not-allowed'
      )}
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Icon className="h-6 w-6" />
      )}
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  subValue: string;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'pink' | 'emerald';
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    pink: 'text-pink-400 bg-pink-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
  };

  return (
    <div className="rounded-xl glass-1 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('p-2 rounded-lg', colors[color])}>
          <Icon className={cn('h-4 w-4', colors[color].split(' ')[0])} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
    </div>
  );
}

function PriorityBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: 'red' | 'amber' | 'emerald';
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colors = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[hsl(var(--glass-bg-3))] overflow-hidden">
        <div className={cn('h-full rounded-full', colors[color])} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function PageTypeCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'purple' | 'blue';
}) {
  const colors = {
    purple: 'text-purple-400 bg-purple-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl glass-1">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', colors[color])}>
          <Icon className={cn('h-4 w-4', colors[color].split(' ')[0])} />
        </div>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="text-xl font-bold text-foreground">{value}</span>
    </div>
  );
}

function IntentCard({ intent, count, total }: { intent: string; count: number; total: number }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors: Record<string, string> = {
    informational: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    transactional: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    commercial: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    navigational: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  };

  return (
    <div className={cn('rounded-xl p-4 border', colors[intent.toLowerCase()] || 'bg-[hsl(var(--glass-bg-1))] border-[hsl(var(--glass-border-subtle))]')}>
      <p className="text-sm font-medium capitalize">{intent}</p>
      <p className="text-2xl font-bold mt-1">{count}</p>
      <p className="text-xs text-muted-foreground">%{percentage}</p>
    </div>
  );
}

function DifficultyBadge({ value }: { value?: number }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground">-</span>;
  const color = value <= 30 ? 'emerald' : value <= 60 ? 'amber' : 'red';
  const colors = { emerald: 'bg-emerald-500/20 text-emerald-400', amber: 'bg-amber-500/20 text-amber-400', red: 'bg-red-500/20 text-red-400' };
  return <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[color])}>{value}</span>;
}

function OpportunityBadge({ value }: { value?: number }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground">-</span>;
  const color = value >= 70 ? 'emerald' : value >= 40 ? 'amber' : 'red';
  const colors = { emerald: 'bg-emerald-500/20 text-emerald-400', amber: 'bg-amber-500/20 text-amber-400', red: 'bg-red-500/20 text-red-400' };
  return <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[color])}>{value}</span>;
}

function IntentBadge({ intent }: { intent?: string }) {
  if (!intent) return <span className="text-muted-foreground">-</span>;
  const colors: Record<string, string> = { informational: 'bg-blue-500/20 text-blue-400', transactional: 'bg-emerald-500/20 text-emerald-400', commercial: 'bg-purple-500/20 text-purple-400', navigational: 'bg-amber-500/20 text-amber-400' };
  const labels: Record<string, string> = { informational: 'Info', transactional: 'Trans', commercial: 'Comm', navigational: 'Nav' };
  return <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[intent.toLowerCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground')}>{labels[intent.toLowerCase()] || intent}</span>;
}

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return <span className="text-muted-foreground">-</span>;
  const colors: Record<string, string> = { high: 'bg-red-500/20 text-red-400', medium: 'bg-amber-500/20 text-amber-400', low: 'bg-emerald-500/20 text-emerald-400' };
  const labels: Record<string, string> = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' };
  return <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[priority.toLowerCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground')}>{labels[priority.toLowerCase()] || priority}</span>;
}

function PageTypeBadge({ pageType }: { pageType?: string }) {
  if (!pageType) return <span className="text-muted-foreground">-</span>;
  const colors: Record<string, string> = { pillar: 'bg-purple-500/20 text-purple-400', cluster: 'bg-blue-500/20 text-blue-400', standalone: 'bg-emerald-500/20 text-emerald-400' };
  return <span className={cn('inline-flex px-2 py-1 rounded-lg text-xs font-semibold', colors[pageType.toLowerCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground')}>{pageType}</span>;
}

function SerpFeatureCard({
  icon: Icon,
  label,
  active,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean | number;
  detail?: string;
}) {
  const isActive = active === true || active === 1;
  return (
    <div className={cn(
      'rounded-xl glass-1 p-4 transition-colors',
      isActive ? 'border border-cyan-500/30' : ''
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className={cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
            {label}
          </p>
          {detail && (
            <p className="text-xs text-muted-foreground">{detail}</p>
          )}
        </div>
        <div className={cn(
          'w-3 h-3 rounded-full',
          isActive ? 'bg-cyan-400' : 'bg-[hsl(var(--glass-bg-3))]'
        )} />
      </div>
    </div>
  );
}

function ContentFormatBar({
  format,
  count,
  total,
}: {
  format: string;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const formatLabels: Record<string, string> = {
    guide: 'Rehber',
    how_to: 'Nasıl Yapılır',
    blog: 'Blog Yazısı',
    comparison: 'Karşılaştırma',
    listicle: 'Liste',
    review: 'İnceleme',
    unassigned: 'Belirlenmemiş',
  };
  const formatColors: Record<string, string> = {
    guide: 'bg-purple-500',
    how_to: 'bg-blue-500',
    blog: 'bg-emerald-500',
    comparison: 'bg-amber-500',
    listicle: 'bg-pink-500',
    review: 'bg-cyan-500',
    unassigned: 'bg-gray-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground capitalize">
          {formatLabels[format.toLowerCase()] || format}
        </span>
        <span className="text-sm font-medium text-foreground">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-[hsl(var(--glass-bg-3))] overflow-hidden">
        <div
          className={cn('h-full rounded-full', formatColors[format.toLowerCase()] || 'bg-gray-500')}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ContentPlanCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: 'blue' | 'purple' | 'cyan' | 'emerald' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <div className={cn('rounded-xl p-4 border', colors[color])}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold">
        {value.toLocaleString()}
        {suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
