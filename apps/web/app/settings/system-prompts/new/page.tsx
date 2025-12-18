'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, CheckCircle2, XCircle,
  MessageSquare, Sparkles, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

const CATEGORIES = [
  { value: 'keyword', label: 'Keyword', description: 'Keyword araştırma ve analiz promptları' },
  { value: 'seo', label: 'SEO', description: 'SEO optimizasyon promptları' },
  { value: 'content', label: 'İçerik', description: 'Genel içerik üretim promptları' },
  { value: 'blog', label: 'Blog', description: 'Blog yazısı promptları' },
  { value: 'product', label: 'Ürün', description: 'Ürün açıklaması promptları' },
  { value: 'meta', label: 'Meta', description: 'Meta description promptları' },
  { value: 'other', label: 'Diğer', description: 'Diğer amaçlı promptlar' },
];

export default function NewPromptPage() {
  const router = useRouter();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

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
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim() || !formData.prompt_text.trim()) {
      showNotification('error', 'Ad, slug ve prompt metni zorunludur');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/system-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        showNotification('success', 'Prompt oluşturuldu');
        setTimeout(() => {
          router.push('/settings/system-prompts');
        }, 1000);
      } else {
        showNotification('error', data.error || 'Prompt oluşturulamadı');
      }
    } catch (err) {
      showNotification('error', 'İşlem sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
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
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-5"
          >
            <Link
              href="/settings/system-prompts"
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
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/40 to-blue-500/40 rounded-2xl blur-xl" />
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30">
                <Sparkles className="h-8 w-8 text-emerald-400" />
              </div>
            </motion.div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">Yeni System Prompt</h1>
              <p className="text-muted-foreground">AI workflow'ları için yeni bir sistem promptu oluşturun</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <motion.div
            className="rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Temel Bilgiler
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Prompt Adı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Örn: Keyword Discovery Prompt"
                  className="glass-input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Slug <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="keyword-discovery"
                  className="glass-input font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Workflow'larda bu slug ile çağrılır
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-foreground">Açıklama</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bu prompt ne işe yarar? Kısa bir açıklama..."
                className="glass-input"
              />
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-foreground">Kategori</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={cn(
                      'p-3 rounded-xl text-left transition-all border',
                      formData.category === cat.value
                        ? 'bg-primary/20 border-primary/30 text-primary'
                        : 'glass-1 border-transparent hover:border-[hsl(var(--glass-border-subtle))]'
                    )}
                  >
                    <div className="text-sm font-medium">{cat.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-[hsl(var(--glass-border-default))] bg-[hsl(0_0%_3%)] text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Aktif olarak oluştur
                </span>
              </label>
            </div>
          </motion.div>

          {/* Prompt Text */}
          <motion.div
            className="rounded-2xl glass-2 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Prompt Metni
              </h2>
              <div className="text-xs text-muted-foreground">
                {formData.prompt_text.length} karakter
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>İpucu:</strong> Değişkenler için <code className="px-1 py-0.5 rounded bg-blue-500/20">{'{{'} variable {'}}'}</code> formatını kullanabilirsiniz.
                  Örn: <code className="px-1 py-0.5 rounded bg-blue-500/20">{'{{'} main_keyword {'}}'}</code>, <code className="px-1 py-0.5 rounded bg-blue-500/20">{'{{'} target_audience {'}}'}</code>
                </div>
              </div>

              <textarea
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                rows={16}
                placeholder={`Sen bir SEO uzmanısın. Görevin {{ main_keyword }} için detaylı bir keyword analizi yapmak.

Hedef Kitle: {{ target_audience }}
Sektör: {{ industry }}

Lütfen şunları analiz et:
1. Ana keyword'ün arama hacmi ve rekabet durumu
2. İlgili long-tail keyword'ler
3. Kullanıcı arama niyeti (intent)
4. İçerik önerileri

JSON formatında yanıt ver.`}
                className="glass-input resize-none font-mono text-sm leading-relaxed"
              />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/settings/system-prompts"
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              İptal
            </Link>

            <button
              type="submit"
              disabled={saving || !formData.name || !formData.slug || !formData.prompt_text}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500" />
              <div className="absolute inset-0 shadow-[0_0_20px_rgba(16,185,129,0.3)] opacity-0 group-hover:opacity-100 transition-opacity" />
              {saving ? (
                <Loader2 className="relative h-4 w-4 animate-spin" />
              ) : (
                <Save className="relative h-4 w-4" />
              )}
              <span className="relative">{saving ? 'Kaydediliyor...' : 'Promptu Oluştur'}</span>
            </button>
          </motion.div>
        </form>
      </section>
    </PageTransition>
  );
}
