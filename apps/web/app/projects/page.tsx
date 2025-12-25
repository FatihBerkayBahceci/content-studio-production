'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  FolderKanban, Search, MoreHorizontal, Pencil, Trash2,
  CheckCircle2, Clock, AlertCircle, Layers, FileText,
  ChevronDown, X, Check, Globe, Calendar, Hash,
  ArrowRight, Zap, Target, LayoutGrid, List, Plus,
  ChevronRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

interface Client {
  id: number;
  name: string;
  domain?: string;
  is_active?: boolean;
}

interface Project {
  id: number;
  uuid: string;
  client_id: number;
  name: string;
  main_keyword: string;
  project_type: 'single' | 'bulk';
  status: string;
  total_keywords_found: number | null;
  target_country: string;
  target_language: string;
  created_at: string;
  client_name: string;
  seed_keywords?: string[] | string;
  bulk_stats?: {
    total_seeds?: number;
    total_approved?: number;
    total_rejected?: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Bekliyor', color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: Clock },
  processing: { label: 'İşleniyor', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: Zap },
  keywords_discovered: { label: 'Tamamlandı', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: CheckCircle2 },
  completed: { label: 'Tamamlandı', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: CheckCircle2 },
  failed: { label: 'Hata', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: AlertCircle },
};

const COUNTRY_FLAGS: Record<string, string> = {
  TR: '🇹🇷',
  US: '🇺🇸',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
};

export default function ProjectsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'single' | 'bulk'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchProjects(selectedClientId);
    } else {
      setProjects([]);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success && data.data) {
        setClients(data.data);
        if (data.data.length > 0 && !selectedClientId) {
          setSelectedClientId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async (clientId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects?client_id=${clientId}`);
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async (projectId: number) => {
    if (!editName.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_name: editName.trim() }),
      });

      if (res.ok) {
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, name: editName.trim() } : p
        ));
      }
    } catch (error) {
      console.error('Failed to update project name:', error);
    } finally {
      setEditingProject(null);
      setEditName('');
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!confirm('Bu projeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
    setMenuOpen(null);
  };

  const startEditing = (project: Project) => {
    setEditingProject(project.id);
    setEditName(project.name);
    setMenuOpen(null);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.main_keyword.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || project.project_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: projects.length,
    single: projects.filter(p => p.project_type === 'single').length,
    bulk: projects.filter(p => p.project_type === 'bulk').length,
    completed: projects.filter(p => p.status === 'completed' || p.status === 'keywords_discovered').length,
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Header Section - Minimal */}
      <section className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projeler</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} proje · {stats.completed} tamamlandı
            </p>
          </div>

          {/* New Project Button */}
          <Link href="/keywords/agent">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
              <Plus className="h-4 w-4" />
              <span>Yeni Proje</span>
            </button>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Client Dropdown */}
          <div className="relative min-w-[200px]">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={selectedClientId || ''}
              onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl border border-[hsl(var(--glass-border-default))] bg-[hsl(var(--glass-bg-1))] text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="">Müşteri Seçin</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

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

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
            {(['all', 'single', 'bulk'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                  filterType === type
                    ? 'bg-[hsl(var(--glass-bg-3))] text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {type === 'all' && 'Tümü'}
                {type === 'single' && (
                  <>
                    <Target className="h-3.5 w-3.5" />
                    Tekil
                  </>
                )}
                {type === 'bulk' && (
                  <>
                    <Layers className="h-3.5 w-3.5" />
                    Toplu
                  </>
                )}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid'
                  ? 'bg-[hsl(var(--glass-bg-3))] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Kart Görünümü"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-[hsl(var(--glass-bg-3))] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Liste Görünümü"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="px-6 pb-8">
        {!selectedClientId ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-2xl bg-[hsl(var(--glass-bg-2))] mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">Müşteri Seçin</p>
            <p className="text-sm text-muted-foreground">
              Projeleri görüntülemek için bir müşteri seçin
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-2xl bg-[hsl(var(--glass-bg-2))] mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {searchQuery || filterType !== 'all' ? 'Sonuç bulunamadı' : 'Henüz proje yok'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || filterType !== 'all'
                ? 'Farklı bir arama terimi deneyin'
                : 'İlk projenizi oluşturarak başlayın'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <Link href="/keywords/agent">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Yeni Proje</span>
                </button>
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid/Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => {
                const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                const isEditing = editingProject === project.id;
                const countryFlag = COUNTRY_FLAGS[project.target_country] || '🌍';
                const isBulk = project.project_type === 'bulk';

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      'group relative rounded-2xl p-5 transition-all',
                      'bg-white/[0.02] backdrop-blur-xl border border-white/[0.08]',
                      'hover:bg-white/[0.04] hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/20'
                    )}
                  >
                    {/* Type Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                        isBulk
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-blue-500/10 text-blue-400'
                      )}>
                        {isBulk ? <Layers className="h-3 w-3" /> : <Target className="h-3 w-3" />}
                        {isBulk ? 'Toplu' : 'Tekil'}
                      </span>

                      {/* Menu Button */}
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.1] text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                          {menuOpen === project.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 top-full mt-1 w-40 bg-[hsl(var(--glass-bg-3))] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                            >
                              <button
                                onClick={() => startEditing(project)}
                                className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/[0.05] flex items-center gap-2.5 transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                Yeniden Adlandır
                              </button>
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Projeyi Sil
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Project Name */}
                    <div className="mb-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateName(project.id);
                              if (e.key === 'Escape') setEditingProject(null);
                            }}
                            autoFocus
                            className="flex-1 bg-[hsl(var(--glass-bg-2))] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <button
                            onClick={() => handleUpdateName(project.id)}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingProject(null)}
                            className="p-1.5 text-muted-foreground hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-semibold text-foreground text-lg truncate">
                          {project.name}
                        </h3>
                      )}
                    </div>

                    {/* Main Keyword */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <Hash className="h-3.5 w-3.5" />
                      <span className="truncate">{project.main_keyword}</span>
                    </div>

                    {/* Stats Pills */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {/* Status */}
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
                        statusConfig.bgColor,
                        statusConfig.color
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>

                      {/* Keywords Count */}
                      {project.total_keywords_found && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-white/[0.05] text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          {project.total_keywords_found}
                        </span>
                      )}

                      {/* Country */}
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-white/[0.05] text-muted-foreground">
                        {countryFlag} {project.target_country}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.created_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>

                      <Link href={`/keywords/agent/${project.uuid}`}>
                        <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                          Görüntüle
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* List/Table View */
          <div className="rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.06] bg-[hsl(var(--glass-bg-1))]">
              <div className="col-span-4 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <FolderKanban className="h-3.5 w-3.5" />
                Proje
              </div>
              <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:block">
                Tip
              </div>
              <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Durum
              </div>
              <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:block">
                Keywords
              </div>
              <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                Tarih
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/[0.06]">
              {filteredProjects.map((project) => {
                const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                const isBulk = project.project_type === 'bulk';
                const countryFlag = COUNTRY_FLAGS[project.target_country] || '🌍';

                return (
                  <Link
                    key={project.id}
                    href={`/keywords/agent/${project.uuid}`}
                    className="group grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors hover:bg-[hsl(var(--glass-bg-interactive))]"
                  >
                    {/* Project Name */}
                    <div className="col-span-4 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                          isBulk ? 'bg-purple-500/10' : 'bg-blue-500/10'
                        )}>
                          {isBulk ? (
                            <Layers className="h-4 w-4 text-purple-400" />
                          ) : (
                            <Target className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {project.main_keyword}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-2 hidden md:block">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
                        isBulk
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-blue-500/10 text-blue-400'
                      )}>
                        {isBulk ? 'Toplu' : 'Tekil'}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
                        statusConfig.bgColor,
                        statusConfig.color
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Keywords Count */}
                    <div className="col-span-2 hidden lg:block">
                      <span className="text-sm text-muted-foreground">
                        {project.total_keywords_found || '-'}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">
                          {countryFlag}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </PageTransition>
  );
}
