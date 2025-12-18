'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Edit3, Trash2, Power, Loader2,
  CheckCircle2, XCircle, MessageSquare, Search,
  Workflow, ExternalLink, Copy, Eye, FileCode2,
  Sparkles, Filter, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition, staggerContainer, staggerItem } from '@/components/motion';

interface SystemPrompt {
  id: number;
  name: string;
  slug: string;
  category: string;
  prompt_text: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Workflow kullanım haritası
const WORKFLOW_USAGE: Record<string, { workflow: string; description: string }[]> = {
  'keyword-discovery': [
    { workflow: 'WF-101a Keyword Discovery', description: 'Ana keyword keşif süreci' }
  ],
  'keyword-filter': [
    { workflow: 'WF-101b AI Keyword Filter', description: 'AI ile keyword filtreleme' }
  ],
  'content-gap-analyzer': [
    { workflow: 'WF-106 Content Gap Finder', description: 'İçerik boşluğu analizi' }
  ],
  'opportunity-scorer': [
    { workflow: 'WF-107 Opportunity Scorer', description: 'Fırsat puanlama analizi' }
  ],
  'strategy-generator': [
    { workflow: 'WF-109 Strategy Generator', description: 'İçerik stratejisi oluşturma' }
  ],
};

const CATEGORIES = [
  { value: 'all', label: 'Tümü', icon: LayoutGrid },
  { value: 'keyword', label: 'Keyword', icon: Search },
  { value: 'seo', label: 'SEO', icon: Sparkles },
  { value: 'content', label: 'İçerik', icon: FileCode2 },
  { value: 'blog', label: 'Blog', icon: MessageSquare },
  { value: 'product', label: 'Ürün', icon: LayoutGrid },
  { value: 'meta', label: 'Meta', icon: FileCode2 },
  { value: 'other', label: 'Diğer', icon: Filter },
];

const CATEGORY_COLORS: Record<string, string> = {
  keyword: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
  seo: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400',
  content: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
  blog: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
  product: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400',
  meta: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400',
  other: 'from-slate-500/20 to-gray-500/20 border-slate-500/30 text-slate-400',
};

export default function SystemPromptsPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadPrompts = async () => {
    try {
      const res = await fetch('/api/system-prompts');
      const data = await res.json();
      if (data.success) {
        setPrompts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load prompts:', err);
      showNotification('error', 'Promptlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" promptunu silmek istediğinizden emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/system-prompts/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        showNotification('success', 'Prompt silindi');
        loadPrompts();
      } else {
        showNotification('error', data.error || 'Silme işlemi başarısız');
      }
    } catch (err) {
      showNotification('error', 'Silme sırasında hata oluştu');
    }
  };

  const handleToggleActive = async (prompt: SystemPrompt) => {
    try {
      const res = await fetch(`/api/system-prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !prompt.is_active }),
      });
      const data = await res.json();

      if (data.success) {
        showNotification('success', prompt.is_active ? 'Prompt pasif yapıldı' : 'Prompt aktif yapıldı');
        loadPrompts();
      } else {
        showNotification('error', data.error || 'Durum değiştirilemedi');
      }
    } catch (err) {
      showNotification('error', 'İşlem sırasında hata oluştu');
    }
  };

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    showNotification('success', 'Slug kopyalandı');
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const getWorkflowUsage = (slug: string) => {
    return WORKFLOW_USAGE[slug] || [];
  };

  // Filtreleme
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchQuery ||
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // İstatistikler
  const stats = {
    total: prompts.length,
    active: prompts.filter(p => p.is_active).length,
    inactive: prompts.filter(p => !p.is_active).length,
    withWorkflow: prompts.filter(p => getWorkflowUsage(p.slug).length > 0).length,
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              'fixed top-4 left-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-xl',
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
      <section className="relative overflow-hidden border-b border-[hsl(var(--glass-border-subtle))]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-5">
                <Link
                  href="/settings"
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
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-2xl blur-xl" />
                  <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                    <MessageSquare className="h-8 w-8 text-blue-400" />
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold text-foreground">System Prompts</h1>
                  <p className="text-muted-foreground">AI workflow'ları için sistem promptlarını yönetin</p>
                </div>
              </div>

              <Link
                href="/settings/system-prompts/new"
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500" />
                <div className="absolute inset-0 shadow-[0_0_20px_rgba(59,130,246,0.3)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="relative h-4 w-4" />
                <span className="relative">Yeni Prompt</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl glass-1 p-4">
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Toplam Prompt</div>
              </div>
              <div className="rounded-xl glass-1 p-4">
                <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Aktif</div>
              </div>
              <div className="rounded-xl glass-1 p-4">
                <div className="text-2xl font-bold text-amber-400">{stats.inactive}</div>
                <div className="text-sm text-muted-foreground">Pasif</div>
              </div>
              <div className="rounded-xl glass-1 p-4">
                <div className="text-2xl font-bold text-blue-400">{stats.withWorkflow}</div>
                <div className="text-sm text-muted-foreground">Workflow'da Kullanılan</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Prompt ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.value;
              const count = cat.value === 'all'
                ? prompts.length
                : prompts.filter(p => p.category === cat.value).length;

              if (cat.value !== 'all' && count === 0) return null;

              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    isSelected
                      ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                      : 'glass-1 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                  <span className="text-[10px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 p-1 rounded-lg glass-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse" />
                <div className="relative h-12 w-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Promptlar yükleniyor...</p>
            </div>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="relative inline-block mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute inset-0 bg-blue-500/30 rounded-3xl blur-2xl" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-blue-400" />
              </div>
            </motion.div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || selectedCategory !== 'all' ? 'Sonuç bulunamadı' : 'Henüz system prompt yok'}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all'
                ? 'Farklı filtreler deneyin'
                : 'Yeni bir prompt ekleyerek başlayın'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Link
                href="/settings/system-prompts/new"
                className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500" />
                <Plus className="relative h-5 w-5" />
                <span className="relative">İlk Promptu Ekle</span>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            )}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredPrompts.map((prompt) => {
              const workflowUsage = getWorkflowUsage(prompt.slug);
              const categoryColor = CATEGORY_COLORS[prompt.category] || CATEGORY_COLORS.other;

              return (
                <motion.div
                  key={prompt.id}
                  variants={staggerItem}
                  className={cn(
                    'group rounded-2xl transition-all duration-300 overflow-hidden',
                    prompt.is_active
                      ? 'glass-highlight border-emerald-500/20 hover:border-emerald-500/40'
                      : 'glass-2 opacity-70 hover:opacity-100'
                  )}
                >
                  {/* Card Header */}
                  <div className={cn(
                    'p-4 border-b border-[hsl(var(--glass-border-subtle))]',
                    `bg-gradient-to-r ${categoryColor.split(' ').slice(0, 2).join(' ')}`
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{prompt.name}</h3>
                          {prompt.is_active && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                              <Power className="h-2.5 w-2.5" />
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            categoryColor
                          )}>
                            {getCategoryLabel(prompt.category)}
                          </span>
                          <button
                            onClick={() => copySlug(prompt.slug)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            title="Slug'ı kopyala"
                          >
                            <code className="font-mono">{prompt.slug}</code>
                            <Copy className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {prompt.description && (
                      <p className="text-sm text-muted-foreground">{prompt.description}</p>
                    )}

                    {/* Prompt Preview */}
                    <div className="relative">
                      <pre className="text-xs text-muted-foreground bg-[hsl(var(--glass-bg-2))] rounded-lg p-3 overflow-hidden max-h-20 line-clamp-3 whitespace-pre-wrap font-mono">
                        {prompt.prompt_text}
                      </pre>
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[hsl(var(--glass-bg-2))] to-transparent rounded-b-lg" />
                    </div>

                    {/* Workflow Usage */}
                    {workflowUsage.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Workflow className="h-3 w-3" />
                          Kullanıldığı Workflow'lar
                        </div>
                        {workflowUsage.map((wf, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20"
                          >
                            <Sparkles className="h-3 w-3 text-blue-400" />
                            <span className="text-xs font-medium text-blue-400">{wf.workflow}</span>
                            <span className="text-[10px] text-blue-400/60">• {wf.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {workflowUsage.length === 0 && (
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <XCircle className="h-3 w-3 text-amber-400" />
                        <span className="text-xs text-amber-400">Henüz bir workflow'da kullanılmıyor</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 border-t border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(prompt.updated_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(prompt)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            prompt.is_active
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
                          )}
                          title={prompt.is_active ? 'Pasif yap' : 'Aktif yap'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/settings/system-prompts/${prompt.id}`}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Görüntüle & Düzenle"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/settings/system-prompts/${prompt.id}/edit`}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                          title="Editörde Düzenle"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(prompt.id, prompt.name)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </PageTransition>
  );
}
