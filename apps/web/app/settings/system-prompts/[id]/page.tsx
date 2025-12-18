'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, CheckCircle2, XCircle,
  MessageSquare, Sparkles, Info, Power, Copy, Edit3,
  Workflow, Trash2, Clock, Calendar, Eye, EyeOff,
  Code2, AlignLeft, Maximize2, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

interface PageProps {
  params: { id: string };
}

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
  { value: 'keyword', label: 'Keyword' },
  { value: 'seo', label: 'SEO' },
  { value: 'content', label: 'İçerik' },
  { value: 'blog', label: 'Blog' },
  { value: 'product', label: 'Ürün' },
  { value: 'meta', label: 'Meta' },
  { value: 'other', label: 'Diğer' },
];

export default function PromptDetailPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();

  const [prompt, setPrompt] = useState<SystemPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'keyword',
    prompt_text: '',
    description: '',
    is_active: true,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const loadPrompt = async () => {
      try {
        const res = await fetch(`/api/system-prompts/${id}`);
        const data = await res.json();

        if (data.success && data.data) {
          setPrompt(data.data);
          setFormData({
            name: data.data.name,
            slug: data.data.slug,
            category: data.data.category,
            prompt_text: data.data.prompt_text,
            description: data.data.description || '',
            is_active: data.data.is_active,
          });
        } else {
          showNotification('error', 'Prompt bulunamadı');
        }
      } catch (err) {
        showNotification('error', 'Prompt yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadPrompt();
  }, [id]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim() || !formData.prompt_text.trim()) {
      showNotification('error', 'Ad, slug ve prompt metni zorunludur');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/system-prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setPrompt({ ...prompt!, ...formData });
        setIsEditing(false);
        showNotification('success', 'Prompt güncellendi');
      } else {
        showNotification('error', data.error || 'Güncelleme başarısız');
      }
    } catch (err) {
      showNotification('error', 'İşlem sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu promptu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;

    try {
      const res = await fetch(`/api/system-prompts/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        showNotification('success', 'Prompt silindi');
        setTimeout(() => router.push('/settings/system-prompts'), 1000);
      } else {
        showNotification('error', data.error || 'Silme başarısız');
      }
    } catch (err) {
      showNotification('error', 'İşlem sırasında hata oluştu');
    }
  };

  const handleToggleActive = async () => {
    const newStatus = !formData.is_active;
    setFormData({ ...formData, is_active: newStatus });

    try {
      const res = await fetch(`/api/system-prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        setPrompt({ ...prompt!, is_active: newStatus });
        showNotification('success', newStatus ? 'Prompt aktif edildi' : 'Prompt pasif edildi');
      } else {
        setFormData({ ...formData, is_active: !newStatus });
        showNotification('error', 'Durum değiştirilemedi');
      }
    } catch (err) {
      setFormData({ ...formData, is_active: !newStatus });
      showNotification('error', 'İşlem sırasında hata oluştu');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('success', 'Kopyalandı');
  };

  const workflowUsage = prompt ? (WORKFLOW_USAGE[prompt.slug] || []) : [];

  if (loading) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative h-12 w-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Prompt yükleniyor...</p>
        </div>
      </PageTransition>
    );
  }

  if (!prompt) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Prompt bulunamadı</p>
          <Link href="/settings/system-prompts" className="text-primary hover:underline">
            Geri dön
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className={cn("min-h-screen", isFullscreen && "fixed inset-0 z-50 bg-background")}>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              'fixed top-4 left-1/2 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-xl',
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
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/settings/system-prompts"
                className="p-2 rounded-xl glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-xl",
                  formData.is_active
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : "bg-slate-500/20 border border-slate-500/30"
                )}>
                  <MessageSquare className={cn(
                    "h-6 w-6",
                    formData.is_active ? "text-emerald-400" : "text-slate-400"
                  )} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="text-xl font-bold bg-transparent border-b border-primary/30 focus:border-primary outline-none px-1"
                      />
                    ) : (
                      <h1 className="text-xl font-bold text-foreground">{prompt.name}</h1>
                    )}
                    <button
                      onClick={handleToggleActive}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        formData.is_active
                          ? "text-emerald-400 hover:bg-emerald-500/10"
                          : "text-slate-400 hover:bg-slate-500/10"
                      )}
                      title={formData.is_active ? 'Pasif yap' : 'Aktif yap'}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => copyToClipboard(prompt.slug)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <code className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))] font-mono">{prompt.slug}</code>
                      <Copy className="h-3 w-3" />
                    </button>
                    {isEditing ? (
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="text-xs px-2 py-1 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))]"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                        {CATEGORIES.find(c => c.value === prompt.category)?.label || prompt.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setFormData({
                        name: prompt.name,
                        slug: prompt.slug,
                        category: prompt.category,
                        prompt_text: prompt.prompt_text,
                        description: prompt.description || '',
                        is_active: prompt.is_active,
                      });
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white overflow-hidden disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500" />
                    {saving ? (
                      <Loader2 className="relative h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="relative h-4 w-4" />
                    )}
                    <span className="relative">Kaydet</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-xl glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                    title={isFullscreen ? 'Küçült' : 'Tam ekran'}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <Link
                    href={`/settings/system-prompts/${id}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    Düzenle
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className={cn("max-w-6xl mx-auto px-6 py-6", isFullscreen && "max-w-none h-[calc(100%-120px)]")}>
        <div className={cn("grid gap-6", isFullscreen ? "grid-cols-1 h-full" : "lg:grid-cols-3")}>
          {/* Main Editor */}
          <div className={cn("lg:col-span-2", isFullscreen && "h-full")}>
            <div className={cn("rounded-2xl glass-2 overflow-hidden", isFullscreen && "h-full flex flex-col")}>
              {/* Editor Header */}
              <div className="px-4 py-3 border-b border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Prompt Editörü</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formData.prompt_text.length} karakter
                  </span>
                  <button
                    onClick={() => copyToClipboard(formData.prompt_text)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                    title="Kopyala"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Editor Body */}
              <div className={cn("p-4", isFullscreen && "flex-1 overflow-hidden")}>
                {isEditing ? (
                  <textarea
                    value={formData.prompt_text}
                    onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                    className={cn(
                      "w-full glass-input resize-none font-mono text-sm leading-relaxed",
                      isFullscreen ? "h-full" : "min-h-[500px]"
                    )}
                    placeholder="Prompt metnini buraya yazın..."
                  />
                ) : (
                  <pre className={cn(
                    "whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed overflow-auto",
                    isFullscreen ? "h-full" : "min-h-[500px] max-h-[600px]"
                  )}>
                    {prompt.prompt_text}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {!isFullscreen && (
            <div className="space-y-4">
              {/* Description */}
              <div className="rounded-2xl glass-2 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-muted-foreground" />
                  Açıklama
                </h3>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Bu prompt ne işe yarar?"
                    className="w-full glass-input resize-none text-sm"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {prompt.description || 'Açıklama eklenmemiş'}
                  </p>
                )}
              </div>

              {/* Workflow Usage */}
              <div className="rounded-2xl glass-2 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                  Kullanıldığı Workflow'lar
                </h3>
                {workflowUsage.length > 0 ? (
                  <div className="space-y-2">
                    {workflowUsage.map((wf, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-sm font-medium text-blue-400">{wf.workflow}</span>
                        </div>
                        <p className="text-xs text-blue-400/70">{wf.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400">
                      Bu prompt henüz bir workflow'da kullanılmıyor
                    </p>
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="rounded-2xl glass-2 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Bilgiler</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Oluşturulma
                    </span>
                    <span className="text-foreground">
                      {new Date(prompt.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Son Güncelleme
                    </span>
                    <span className="text-foreground">
                      {new Date(prompt.updated_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <code className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))] text-xs font-mono">
                      {prompt.id}
                    </code>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-2xl glass-2 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  İpuçları
                </h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Değişkenler:</strong> <code className="px-1 py-0.5 rounded bg-[hsl(var(--glass-bg-3))]">{'{{'} variable {'}}'}</code> formatını kullanın
                  </p>
                  <p>
                    <strong className="text-foreground">Yaygın değişkenler:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><code className="text-primary">main_keyword</code></li>
                    <li><code className="text-primary">target_audience</code></li>
                    <li><code className="text-primary">industry</code></li>
                    <li><code className="text-primary">language</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
