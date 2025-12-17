'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Plus, Search, Clock, CheckCircle2, XCircle, Loader2,
  Target, TrendingUp, Users, ChevronRight,
  RefreshCw, Sparkles, Filter, FileText, BarChart3,
  GitBranch, Lightbulb, Zap, Square, CheckSquare, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useClientStore } from '@/lib/stores/client-store';
import { PROJECT_STATUS_LABELS } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'keywords_discovered';

interface Project {
  id: number;
  uuid: string;
  client_id: number;
  name: string;
  project_name?: string;
  main_keyword: string;
  target_country?: string;
  target_language?: string;
  status: string;
  total_keywords_found?: number;
  total_competitors_analyzed?: number;
  total_paa_found?: number;
  client_name?: string;
  created_at?: string;
}

export default function Tool1Page() {
  const router = useRouter();
  const selectedClientId = useClientStore((state) => state.selectedClientId);

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const url = selectedClientId
        ? `/api/projects?client_id=${selectedClientId}`
        : '/api/projects';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.projects) {
        setProjects(data.projects);
        setError(null);
      } else {
        setError(data.error || 'Projeler yüklenemedi');
      }
    } catch (err) {
      setError('Projeler yüklenirken bir hata oluştu');
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedClientId]);

  // Filter projects
  const filteredProjects = projects?.filter((project) => {
    const matchesSearch =
      (project.project_name || project.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.main_keyword || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      project.status === statusFilter ||
      (statusFilter === 'keywords_discovered' && (project.status === 'keywords_discovered' || project.status === 'keywords_filtered'));

    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate stats
  const stats = {
    total: projects?.length || 0,
    keywords: projects?.reduce((sum, p) => sum + (p?.total_keywords_found || 0), 0) || 0,
    completed: projects?.filter(p => p.status === 'completed' || p.status === 'strategy_generated').length || 0,
    inProgress: projects?.filter(p =>
      p.status !== 'pending' &&
      p.status !== 'completed' &&
      p.status !== 'failed' &&
      p.status !== 'strategy_generated'
    ).length || 0,
  };

  // Status filter options with counts
  const statusOptions: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Tümü', count: projects.length },
    { key: 'pending', label: 'Beklemede', count: projects.filter(p => p.status === 'pending').length },
    { key: 'keywords_discovered', label: 'Keywordler', count: projects.filter(p => p.status?.includes('keyword')).length },
    { key: 'processing', label: 'İşleniyor', count: projects.filter(p => p.status === 'processing').length },
    { key: 'completed', label: 'Tamamlandı', count: projects.filter(p => p.status === 'completed' || p.status === 'strategy_generated').length },
  ];

  // Multi-select handlers
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedProjects(new Set());
    }
  };

  const toggleProjectSelection = (projectId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredProjects.map(p => p.id));
    setSelectedProjects(allIds);
  };

  const deselectAll = () => {
    setSelectedProjects(new Set());
  };

  const viewSelectedProjects = () => {
    if (selectedProjects.size === 0) return;
    const ids = Array.from(selectedProjects).join(',');
    router.push(`/keywords/multi-view?projects=${ids}`);
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Header Section */}
      <section className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Keyword Research</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">AI</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.total} proje · {stats.keywords.toLocaleString('tr-TR')} keyword · {stats.completed} tamamlandı · {stats.inProgress} devam ediyor
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link href="/keywords">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                <Zap className="h-4 w-4" />
                <span>Hızlı Arama</span>
              </button>
            </Link>
            <Link href="/tool1/new">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
                <Plus className="h-4 w-4" />
                <span>Yeni Proje</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Proje veya keyword ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--glass-border-default))] bg-[hsl(var(--glass-bg-1))] text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
            {statusOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setStatusFilter(option.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  statusFilter === option.key
                    ? 'bg-[hsl(var(--glass-bg-3))] text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
                {option.count > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    statusFilter === option.key
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted/50 text-muted-foreground'
                  )}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Select Mode Toggle */}
          <button
            onClick={toggleSelectMode}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors",
              isSelectMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-[hsl(var(--glass-border-default))] text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-interactive))]"
            )}
          >
            {isSelectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            Seç
          </button>

          {/* Refresh */}
          <button
            onClick={fetchProjects}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[hsl(var(--glass-border-default))] hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isLoading && "animate-spin")} />
          </button>
        </div>

        {/* Selection Action Bar */}
        {isSelectMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">
                {selectedProjects.size} proje seçildi
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-primary hover:underline"
                >
                  Tümünü Seç ({filteredProjects.length})
                </button>
                {selectedProjects.size > 0 && (
                  <button
                    onClick={deselectAll}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Temizle
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={viewSelectedProjects}
              disabled={selectedProjects.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" />
              Seçilenleri Görüntüle
            </button>
          </motion.div>
        )}
      </section>

      {/* Projects List */}
      <section className="px-6 pb-8">
        <div className="rounded-2xl glass-2 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Projeler yükleniyor...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-3 rounded-xl bg-red-500/10 mb-3">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-foreground font-medium">Yükleme hatası</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-4 px-4 py-2 rounded-lg text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-4 rounded-2xl bg-[hsl(var(--glass-bg-2))] mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium mb-1">
                {searchQuery ? 'Sonuç bulunamadı' : 'Henüz proje yok'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Farklı bir arama terimi deneyin' : 'İlk keyword research projenizi oluşturun'}
              </p>
              {!searchQuery && (
                <div className="flex items-center gap-2">
                  <Link href="/keywords">
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                      <Zap className="h-4 w-4" />
                      <span>Hızlı Arama</span>
                    </button>
                  </Link>
                  <Link href="/tool1/new">
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
                      <Plus className="h-4 w-4" />
                      <span>Yeni Proje</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className={cn(
                "grid gap-4 px-5 py-3 border-b border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))]",
                isSelectMode ? "grid-cols-13" : "grid-cols-12"
              )}>
                {isSelectMode && (
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={selectedProjects.size === filteredProjects.length ? deselectAll : selectAll}
                      className="p-1 rounded hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                    >
                      {selectedProjects.size === filteredProjects.length && filteredProjects.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                )}
                <div className={cn(
                  "flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider",
                  isSelectMode ? "col-span-4" : "col-span-4"
                )}>
                  <Target className="h-3.5 w-3.5" />
                  Proje
                </div>
                <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:block">
                  Keywords
                </div>
                <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:block">
                  Rakip
                </div>
                <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Durum
                </div>
                <div className={cn(
                  "text-xs font-medium text-muted-foreground uppercase tracking-wider text-right",
                  isSelectMode ? "col-span-1" : "col-span-2"
                )}>
                  Tarih
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjects.has(project.id);
                  const RowWrapper = isSelectMode ? 'div' : Link;
                  const rowProps = isSelectMode
                    ? {
                        onClick: (e: React.MouseEvent) => toggleProjectSelection(project.id, e),
                        className: cn(
                          "group grid gap-4 px-5 py-4 items-center transition-colors cursor-pointer",
                          isSelectMode ? "grid-cols-13" : "grid-cols-12",
                          isSelected ? "bg-primary/5" : "hover:bg-[hsl(var(--glass-bg-interactive))]"
                        ),
                      }
                    : {
                        href: `/tool1/${project.uuid || project.id}`,
                        className: "group grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors hover:bg-[hsl(var(--glass-bg-interactive))]",
                      };

                  return (
                    <RowWrapper key={project.id} {...(rowProps as any)}>
                      {/* Checkbox */}
                      {isSelectMode && (
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            onClick={(e) => toggleProjectSelection(project.id, e)}
                            className="p-1 rounded hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Project Name & Keyword */}
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center",
                          isSelected
                            ? "bg-primary/10 border-primary/30"
                            : "bg-gradient-to-br from-primary/10 to-orange-500/10 border-primary/20"
                        )}>
                          <Search className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            "font-medium transition-colors truncate",
                            isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                          )}>
                            {project.project_name || project.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {project.main_keyword}
                            {project.client_name && (
                              <span className="ml-2 text-muted-foreground/70">• {project.client_name}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Keywords Count */}
                      <div className="col-span-2 hidden md:flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className={cn(
                          "text-sm font-medium",
                          (project.total_keywords_found || 0) > 0 ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {(project.total_keywords_found || 0).toLocaleString('tr-TR')}
                        </span>
                      </div>

                      {/* Competitors Count */}
                      <div className="col-span-2 hidden lg:flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className={cn(
                          "text-sm font-medium",
                          (project.total_competitors_analyzed || 0) > 0 ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {project.total_competitors_analyzed || 0}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <StatusBadge status={project.status} keywordCount={project.total_keywords_found} />
                      </div>

                      {/* Date & Actions */}
                      <div className={cn(
                        "flex items-center justify-end gap-2",
                        isSelectMode ? "col-span-1" : "col-span-2"
                      )}>
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {project.created_at
                            ? new Date(project.created_at).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'short',
                              })
                            : '—'}
                        </span>

                        {!isSelectMode && (
                          <div className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-3))] transition-colors opacity-0 group-hover:opacity-100">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </RowWrapper>
                  );
                })}
              </div>

              {/* Table Footer */}
              <div className="px-5 py-3 border-t border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))]">
                <p className="text-xs text-muted-foreground">
                  {filteredProjects.length} proje gösteriliyor
                  {statusFilter !== 'all' && ` (${statusOptions.find(o => o.key === statusFilter)?.label} filtresi)`}
                </p>
              </div>
            </>
          )}
        </div>
      </section>

    </PageTransition>
  );
}

// Enhanced Status Badge Component
function StatusBadge({ status, keywordCount }: { status: string; keywordCount?: number }) {
  const config: Record<string, { icon: React.ElementType; className: string; label: string }> = {
    pending: {
      icon: Clock,
      className: 'bg-slate-500/10 text-slate-400',
      label: 'Beklemede',
    },
    processing: {
      icon: Loader2,
      className: 'bg-blue-500/10 text-blue-400',
      label: 'İşleniyor',
    },
    keywords_discovered: {
      icon: Search,
      className: 'bg-emerald-500/10 text-emerald-400',
      label: 'Keywordler Bulundu',
    },
    keywords_filtered: {
      icon: Filter,
      className: 'bg-cyan-500/10 text-cyan-400',
      label: 'Filtrelendi',
    },
    competitors_analyzed: {
      icon: Users,
      className: 'bg-blue-500/10 text-blue-400',
      label: 'Rakipler Analiz Edildi',
    },
    competitors_scraped: {
      icon: FileText,
      className: 'bg-indigo-500/10 text-indigo-400',
      label: 'İçerikler Çekildi',
    },
    serp_analyzed: {
      icon: BarChart3,
      className: 'bg-purple-500/10 text-purple-400',
      label: 'SERP Analiz Edildi',
    },
    content_gap_analyzed: {
      icon: GitBranch,
      className: 'bg-pink-500/10 text-pink-400',
      label: 'İçerik Boşluğu',
    },
    scores_calculated: {
      icon: Target,
      className: 'bg-amber-500/10 text-amber-400',
      label: 'Skorlar Hesaplandı',
    },
    strategy_generated: {
      icon: Lightbulb,
      className: 'bg-emerald-500/10 text-emerald-400',
      label: 'Strateji Hazır',
    },
    completed: {
      icon: CheckCircle2,
      className: 'bg-emerald-500/10 text-emerald-400',
      label: 'Tamamlandı',
    },
    failed: {
      icon: XCircle,
      className: 'bg-red-500/10 text-red-400',
      label: 'Başarısız',
    },
  };

  // Use PROJECT_STATUS_LABELS as fallback
  const statusConfig = config[status] || {
    icon: Clock,
    className: 'bg-slate-500/10 text-slate-400',
    label: PROJECT_STATUS_LABELS[status] || status,
  };

  const Icon = statusConfig.icon;
  const isAnimated = status === 'processing';

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
      statusConfig.className
    )}>
      <Icon className={cn("h-3 w-3", isAnimated && "animate-spin")} />
      <span className="hidden sm:inline">{statusConfig.label}</span>
      {keywordCount && keywordCount > 0 && status === 'keywords_discovered' && (
        <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
          {keywordCount}
        </span>
      )}
    </span>
  );
}
