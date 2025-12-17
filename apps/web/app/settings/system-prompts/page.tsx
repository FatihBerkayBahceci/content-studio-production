'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Edit3, Trash2, Power, Save, X, Loader2,
  CheckCircle2, XCircle, MessageSquare, Settings
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

const CATEGORIES = [
  { value: 'content', label: 'Genel İçerik' },
  { value: 'blog', label: 'Blog Yazısı' },
  { value: 'product', label: 'Ürün Açıklaması' },
  { value: 'meta', label: 'Meta Description' },
  { value: 'seo', label: 'SEO' },
  { value: 'keyword', label: 'Keyword' },
  { value: 'other', label: 'Diğer' },
];

export default function SystemPromptsPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'content',
    prompt_text: '',
    description: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingPrompt ? formData.slug : generateSlug(name),
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      category: 'content',
      prompt_text: '',
      description: '',
      is_active: true,
    });
    setEditingPrompt(null);
    setShowForm(false);
  };

  const handleEdit = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      slug: prompt.slug,
      category: prompt.category,
      prompt_text: prompt.prompt_text,
      description: prompt.description || '',
      is_active: prompt.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim() || !formData.prompt_text.trim()) {
      showNotification('error', 'Ad, slug ve prompt metni zorunludur');
      return;
    }

    setSaving(true);

    try {
      const url = editingPrompt
        ? `/api/system-prompts/${editingPrompt.id}`
        : '/api/system-prompts';

      const res = await fetch(url, {
        method: editingPrompt ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        showNotification('success', editingPrompt ? 'Prompt güncellendi' : 'Prompt oluşturuldu');
        resetForm();
        loadPrompts();
      } else {
        showNotification('error', data.error || 'İşlem başarısız');
      }
    } catch (err) {
      showNotification('error', 'İşlem sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu promptu silmek istediğinizden emin misiniz?')) return;

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

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value;
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
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
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
                <div className="absolute inset-0 bg-blue-500/40 rounded-2xl blur-xl" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <MessageSquare className="h-8 w-8 text-blue-400" />
                </div>
              </motion.div>

              <div>
                <h1 className="text-2xl font-bold text-foreground">System Prompts</h1>
                <p className="text-muted-foreground">AI için genel sistem promptlarını yönetin</p>
              </div>
            </div>

            {!showForm && (
              <motion.button
                onClick={() => setShowForm(true)}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <div className="absolute inset-0 shadow-[0_0_20px_rgba(59,130,246,0.3)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="relative h-4 w-4" />
                <span className="relative">Yeni Prompt</span>
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="rounded-2xl glass-2 p-6 overflow-hidden"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  {editingPrompt ? 'Prompt Düzenle' : 'Yeni System Prompt'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Ad <span className="text-blue-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Blog İçerik Promptu"
                        className="glass-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Slug <span className="text-blue-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                        placeholder="blog-icerik-promptu"
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Kategori</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="glass-input"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Açıklama</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Kısa açıklama..."
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Prompt Metni <span className="text-blue-400">*</span>
                    </label>
                    <textarea
                      value={formData.prompt_text}
                      onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                      rows={8}
                      placeholder="AI'ya verilecek sistem promptunu buraya yazın..."
                      className="glass-input resize-none font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-[hsl(var(--glass-border-default))] bg-[hsl(0_0%_3%)] text-blue-500 focus:ring-blue-500/20"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Aktif</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      type="submit"
                      disabled={saving}
                      className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500" />
                      {saving ? <Loader2 className="relative h-4 w-4 animate-spin" /> : <Save className="relative h-4 w-4" />}
                      <span className="relative">{editingPrompt ? 'Güncelle' : 'Oluştur'}</span>
                    </motion.button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                    >
                      <X className="h-4 w-4" />
                      İptal
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompt List */}
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
          ) : prompts.length === 0 ? (
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
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-blue-400" />
                </div>
              </motion.div>
              <p className="text-lg font-semibold text-foreground mb-2">Henüz system prompt yok</p>
              <p className="text-sm text-muted-foreground mb-6">Yeni bir prompt ekleyerek başlayın</p>
              <motion.button
                onClick={() => setShowForm(true)}
                className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <Plus className="relative h-5 w-5" />
                <span className="relative">İlk Promptu Ekle</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {prompts.map((prompt) => (
                <motion.div
                  key={prompt.id}
                  variants={staggerItem}
                  className={cn(
                    'rounded-2xl p-5 transition-colors',
                    prompt.is_active
                      ? 'glass-highlight border-emerald-500/30'
                      : 'glass-2'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{prompt.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {getCategoryLabel(prompt.category)}
                        </span>
                        {prompt.is_active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                            <Power className="h-3 w-3" />
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Slug: <code className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))] text-foreground">{prompt.slug}</code>
                        {prompt.description && <span className="ml-2">• {prompt.description}</span>}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                        {prompt.prompt_text}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggleActive(prompt)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          prompt.is_active
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
                        )}
                        title={prompt.is_active ? 'Pasif yap' : 'Aktif yap'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(prompt)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Düzenle"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
