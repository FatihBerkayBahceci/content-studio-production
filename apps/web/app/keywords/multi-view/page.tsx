'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Loader2, ChevronDown, ChevronUp, Download,
  FileSpreadsheet, ArrowLeft, Target, TrendingUp, Hash,
  Calendar, ExternalLink, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

interface KeywordResult {
  keyword: string;
  source: string;
  search_volume?: number | null;
  competition?: string | null;
  competition_index?: number | null;
  cpc?: number | null;
  trend?: string | null;
  intent?: string | null;
  cluster?: string | null;
}

interface ProjectWithKeywords {
  id: number;
  uuid: string;
  name: string;
  project_name?: string;
  main_keyword: string;
  target_country?: string;
  target_language?: string;
  status: string;
  total_keywords_found?: number;
  client_name?: string;
  created_at?: string;
  keywords: KeywordResult[];
  isLoading?: boolean;
  error?: string;
}

export default function MultiViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIds = searchParams.get('projects')?.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) || [];

  const [projects, setProjects] = useState<ProjectWithKeywords[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all projects and their keywords
  useEffect(() => {
    const fetchProjects = async () => {
      if (projectIds.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Initialize projects with loading state
      const initialProjects: ProjectWithKeywords[] = projectIds.map(id => ({
        id,
        uuid: '',
        name: '',
        main_keyword: '',
        status: '',
        keywords: [],
        isLoading: true,
      }));
      setProjects(initialProjects);

      // Expand all by default
      setExpandedProjects(new Set(projectIds));

      // Fetch each project's details and keywords
      const fetchedProjects = await Promise.all(
        projectIds.map(async (projectId) => {
          try {
            // Fetch project details
            const projectRes = await fetch(`/api/projects/${projectId}`);
            const projectData = await projectRes.json();

            if (!projectData.success || !projectData.project) {
              return {
                id: projectId,
                uuid: '',
                name: `Proje #${projectId}`,
                main_keyword: '',
                status: 'error',
                keywords: [],
                error: projectData.error || 'Proje bulunamadı',
              };
            }

            const project = projectData.project;

            // Fetch keywords for this project
            const keywordsRes = await fetch(`/api/projects/${projectId}/keywords?limit=500`);
            const keywordsData = await keywordsRes.json();

            // Map the keyword fields to match our interface
            const keywords = keywordsData.success && keywordsData.data
              ? keywordsData.data.map((kw: any) => ({
                  keyword: kw.keyword,
                  source: kw.source,
                  search_volume: kw.search_volume,
                  competition: kw.competition,
                  competition_index: kw.competition_index,
                  cpc: kw.cpc,
                  trend: kw.trend_direction,
                  intent: kw.search_intent,
                  cluster: kw.keyword_cluster,
                }))
              : [];

            return {
              ...project,
              keywords,
              isLoading: false,
            };
          } catch (err) {
            return {
              id: projectId,
              uuid: '',
              name: `Proje #${projectId}`,
              main_keyword: '',
              status: 'error',
              keywords: [],
              error: 'Yüklenirken hata oluştu',
            };
          }
        })
      );

      setProjects(fetchedProjects);
      setIsLoading(false);
    };

    fetchProjects();
  }, [searchParams]);

  // Toggle project expansion
  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Expand/collapse all
  const expandAll = () => setExpandedProjects(new Set(projects.map(p => p.id)));
  const collapseAll = () => setExpandedProjects(new Set());

  // Export all projects to multi-sheet Excel
  const handleExportExcel = async () => {
    if (projects.length === 0) return;

    setIsExporting(true);

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      projects.forEach((project, index) => {
        if (project.keywords.length === 0) return;

        // Create sheet data
        const headers = ['Keyword', 'Kaynak', 'Hacim', 'Rekabet', 'CPC', 'Intent', 'Cluster'];
        const rows = project.keywords.map(kw => [
          kw.keyword,
          kw.source || '',
          kw.search_volume || '',
          kw.competition || '',
          kw.cpc || '',
          kw.intent || '',
          kw.cluster || '',
        ]);

        const sheetData = [headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Set column widths
        worksheet['!cols'] = [
          { wch: 40 }, // Keyword
          { wch: 15 }, // Source
          { wch: 10 }, // Volume
          { wch: 12 }, // Competition
          { wch: 8 },  // CPC
          { wch: 15 }, // Intent
          { wch: 20 }, // Cluster
        ];

        // Sheet name (max 31 chars, no special chars)
        const sheetName = (project.main_keyword || project.name || `Proje ${index + 1}`)
          .replace(/[\\/*?:\[\]]/g, '')
          .slice(0, 31);

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Generate and download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keywords-multi-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export single project to CSV
  const handleExportProjectCSV = (project: ProjectWithKeywords) => {
    if (project.keywords.length === 0) return;

    const headers = ['Keyword', 'Kaynak', 'Hacim', 'Rekabet', 'CPC', 'Intent', 'Cluster'];
    const rows = project.keywords.map(kw => [
      kw.keyword,
      kw.source || '',
      kw.search_volume || '',
      kw.competition || '',
      kw.cpc || '',
      kw.intent || '',
      kw.cluster || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${project.main_keyword || project.id}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const stats = useMemo(() => {
    const totalKeywords = projects.reduce((sum, p) => sum + (p.keywords?.length || 0), 0);
    const loadedProjects = projects.filter(p => !p.isLoading && !p.error).length;
    return { totalKeywords, loadedProjects };
  }, [projects]);

  if (projectIds.length === 0) {
    return (
      <PageTransition className="min-h-screen">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-4 rounded-2xl bg-[hsl(var(--glass-bg-2))] mb-4">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Proje Seçilmedi</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Görüntülemek için proje seçmeniz gerekiyor.
          </p>
          <Link
            href="/tool1"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Proje Listesine Dön
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen">
      {/* Header */}
      <div className="px-6 py-6 border-b border-[hsl(var(--glass-border-subtle))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/tool1"
              className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Çoklu Proje Görünümü</h1>
              <p className="text-sm text-muted-foreground">
                {projects.length} proje seçildi
                {stats.loadedProjects > 0 && ` - ${stats.totalKeywords.toLocaleString('tr-TR')} toplam keyword`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandedProjects.size === projects.length ? collapseAll : expandAll}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--glass-border-default))] text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandedProjects.size === projects.length ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Tümünü Daralt
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Tümünü Genişlet
                </>
              )}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting || stats.totalKeywords === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Tümünü Excel'e Aktar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Projeler yükleniyor...</p>
          </div>
        ) : (
          projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl glass-2 overflow-hidden"
            >
              {/* Project Header */}
              <div
                onClick={() => toggleProject(project.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {project.project_name || project.name || project.main_keyword}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" />
                        {project.main_keyword}
                      </span>
                      {project.client_name && (
                        <span>• {project.client_name}</span>
                      )}
                      {project.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(project.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {project.isLoading ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : project.error ? (
                    <span className="text-sm text-red-400">{project.error}</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-foreground">
                          {(project.keywords?.length || 0).toLocaleString('tr-TR')} keyword
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportProjectCSV(project);
                        }}
                        className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                        title="CSV İndir"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <Link
                        href={`/keywords/${project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                        title="Detaylı Görünüm"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </>
                  )}
                  {expandedProjects.has(project.id) ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Project Keywords Table */}
              <AnimatePresence>
                {expandedProjects.has(project.id) && !project.isLoading && !project.error && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[hsl(var(--glass-border-subtle))]"
                  >
                    {project.keywords.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Bu projede keyword bulunamadı.
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-auto">
                        <table className="w-full">
                          <thead className="bg-[hsl(var(--glass-bg-1))] sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Keyword
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Kaynak
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Hacim
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Rekabet
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                CPC
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Intent
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                            {project.keywords.slice(0, 50).map((kw, kwIndex) => (
                              <tr
                                key={kwIndex}
                                className="hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                              >
                                <td className="px-4 py-3 text-sm text-foreground font-medium">
                                  {kw.keyword}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {kw.source || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-right">
                                  <span className={cn(
                                    "font-medium",
                                    kw.search_volume && kw.search_volume > 1000
                                      ? "text-emerald-400"
                                      : "text-muted-foreground"
                                  )}>
                                    {kw.search_volume?.toLocaleString('tr-TR') || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium",
                                    kw.competition === 'LOW' && "bg-emerald-500/10 text-emerald-400",
                                    kw.competition === 'MEDIUM' && "bg-amber-500/10 text-amber-400",
                                    kw.competition === 'HIGH' && "bg-red-500/10 text-red-400",
                                    !kw.competition && "text-muted-foreground"
                                  )}>
                                    {kw.competition || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                                  {kw.cpc ? `$${Number(kw.cpc).toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium",
                                    kw.intent === 'informational' && "bg-blue-500/10 text-blue-400",
                                    kw.intent === 'transactional' && "bg-emerald-500/10 text-emerald-400",
                                    kw.intent === 'commercial' && "bg-purple-500/10 text-purple-400",
                                    kw.intent === 'navigational' && "bg-amber-500/10 text-amber-400",
                                    !kw.intent && "text-muted-foreground"
                                  )}>
                                    {kw.intent || '-'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {project.keywords.length > 50 && (
                          <div className="p-4 text-center text-sm text-muted-foreground bg-[hsl(var(--glass-bg-1))]">
                            İlk 50 keyword gösteriliyor.{' '}
                            <Link
                              href={`/keywords/${project.id}`}
                              className="text-primary hover:underline"
                            >
                              Tümünü görüntüle ({project.keywords.length})
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </PageTransition>
  );
}
