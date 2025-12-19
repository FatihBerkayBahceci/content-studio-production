'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Globe, Save, Loader2, Settings,
  Users, Bot, CheckCircle2, XCircle, Trash2,
  AlertTriangle, Plus, X, MessageSquare, Edit3, Power,
  ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClient, useUpdateClient, useDeleteClient } from '@/lib/hooks/use-clients';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { SheetsConfigForm, SheetsConfigList } from '@/components/sheets';
import type { SheetsConfig } from '@/lib/api/sheets-config';

interface PageProps {
  params: { clientId: string };
}

type TabType = 'general' | 'prompts' | 'content' | 'ai' | 'competitors' | 'sheets';

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'Genel', icon: Building2 },
  { id: 'prompts', label: 'Promptlar', icon: MessageSquare },
  { id: 'content', label: 'İçerik', icon: Settings },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'competitors', label: 'Rakipler', icon: Users },
  { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
];

interface ClientPrompt {
  id: number;
  client_id: number;
  prompt_name: string;
  prompt_text: string;
  is_active: boolean;
  sort_order: number;
}

const MAX_PROMPTS = 10;

const AI_MODELS = [
  { value: '', label: 'Varsayılanı Kullan' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
];

const INDUSTRIES = [
  'E-commerce', 'Technology', 'Finance', 'Healthcare', 'Education',
  'Manufacturing', 'Real Estate', 'Retail', 'Services', 'Other'
];

export default function ClientDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { clientId } = params;
  const { data, isLoading, error, refetch } = useClient(clientId);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    industry: '',
    default_language: 'tr',
    default_country: 'TR',
    is_active: true,
    system_prompt_id: null as number | null,
    tone_of_voice: 'professional',
    writing_style: '',
    target_audience: '',
    brand_keywords: [] as string[],
    forbidden_words: [] as string[],
    keyword_density_min: 0.5,
    keyword_density_max: 2.5,
    internal_links_per_1000_words: 3,
    ai_model_preference: '',
    ai_temperature: 0.7,
    enable_ai_analysis: true,
    competitor_domains: [] as string[],
    competitor_count: 3,
    cache_duration_days: 60,
    enable_ahrefs_api: false,
  });

  const [newBrandKeyword, setNewBrandKeyword] = useState('');
  const [newForbiddenWord, setNewForbiddenWord] = useState('');
  const [newCompetitor, setNewCompetitor] = useState('');
  const [prompts, setPrompts] = useState<ClientPrompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<ClientPrompt | null>(null);
  const [newPrompt, setNewPrompt] = useState({ name: '', text: '' });
  const [showNewPromptForm, setShowNewPromptForm] = useState(false);

  // Sheets config state
  const [showSheetsConfigForm, setShowSheetsConfigForm] = useState(false);
  const [editingSheetsConfig, setEditingSheetsConfig] = useState<SheetsConfig | null>(null);

  const client = data?.success ? data.data : null;

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        slug: client.slug || '',
        domain: client.domain || '',
        industry: client.industry || '',
        default_language: client.default_language || 'tr',
        default_country: client.default_country || 'TR',
        is_active: client.is_active ?? true,
        system_prompt_id: client.system_prompt_id || null,
        tone_of_voice: client.tone_of_voice || 'professional',
        writing_style: client.writing_style || '',
        target_audience: client.target_audience || '',
        brand_keywords: client.brand_keywords || [],
        forbidden_words: client.forbidden_words || [],
        keyword_density_min: client.keyword_density_min ?? 0.5,
        keyword_density_max: client.keyword_density_max ?? 2.5,
        internal_links_per_1000_words: client.internal_links_per_1000_words ?? 3,
        ai_model_preference: client.ai_model_preference || '',
        ai_temperature: client.ai_temperature ?? 0.7,
        enable_ai_analysis: client.enable_ai_analysis ?? true,
        competitor_domains: client.competitor_domains || [],
        competitor_count: client.competitor_count ?? 3,
        cache_duration_days: client.cache_duration_days ?? 60,
        enable_ahrefs_api: client.enable_ahrefs_api ?? false,
      });
    }
  }, [client]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!client) return;
    setIsSaving(true);
    try {
      await updateClient.mutateAsync({ clientId: client.id, data: formData });
      showNotification('success', 'Değişiklikler kaydedildi');
      setHasChanges(false);
      refetch();
    } catch (err) {
      showNotification('error', 'Kaydetme hatası: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await deleteClient.mutateAsync(client.id);
      router.push('/clients');
    } catch (err) {
      showNotification('error', 'Silme hatası: ' + (err as Error).message);
    }
  };

  const addToArray = (field: 'brand_keywords' | 'forbidden_words' | 'competitor_domains', value: string) => {
    if (!value.trim()) return;
    const current = formData[field] as string[];
    if (!current.includes(value.trim())) {
      handleChange(field, [...current, value.trim()]);
    }
    if (field === 'brand_keywords') setNewBrandKeyword('');
    if (field === 'forbidden_words') setNewForbiddenWord('');
    if (field === 'competitor_domains') setNewCompetitor('');
  };

  const removeFromArray = (field: 'brand_keywords' | 'forbidden_words' | 'competitor_domains', value: string) => {
    const current = formData[field] as string[];
    handleChange(field, current.filter(v => v !== value));
  };

  const loadPrompts = async () => {
    if (!client) return;
    setPromptsLoading(true);
    try {
      const res = await fetch(`/api/n8n/client-prompts-list/client-prompts/list/${client.id}`);
      const data = await res.json();
      if (data.success) setPrompts(data.data || []);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setPromptsLoading(false);
    }
  };

  useEffect(() => {
    if (client) loadPrompts();
  }, [client?.id]);

  const handleAddPrompt = async () => {
    if (!client || !newPrompt.name.trim() || !newPrompt.text.trim()) return;
    if (prompts.length >= MAX_PROMPTS) {
      showNotification('error', `Maksimum ${MAX_PROMPTS} prompt ekleyebilirsiniz`);
      return;
    }
    try {
      const res = await fetch('/api/n8n/client-prompts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          prompt_name: newPrompt.name.trim(),
          prompt_text: newPrompt.text.trim(),
          is_active: prompts.length === 0 ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Prompt eklendi');
        setNewPrompt({ name: '', text: '' });
        setShowNewPromptForm(false);
        loadPrompts();
      } else {
        showNotification('error', data.error || 'Prompt eklenemedi');
      }
    } catch (err) {
      showNotification('error', 'Prompt eklenirken hata oluştu');
    }
  };

  const handleUpdatePrompt = async () => {
    if (!editingPrompt) return;
    try {
      const res = await fetch(`/api/n8n/client-prompts-update/client-prompts/update/${editingPrompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_name: editingPrompt.prompt_name,
          prompt_text: editingPrompt.prompt_text,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Prompt güncellendi');
        setEditingPrompt(null);
        loadPrompts();
      } else {
        showNotification('error', data.error || 'Prompt güncellenemedi');
      }
    } catch (err) {
      showNotification('error', 'Prompt güncellenirken hata oluştu');
    }
  };

  const handleDeletePrompt = async (promptId: number) => {
    if (!confirm('Bu promptu silmek istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/n8n/client-prompts-delete/client-prompts/delete/${promptId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Prompt silindi');
        loadPrompts();
      } else {
        showNotification('error', data.error || 'Prompt silinemedi');
      }
    } catch (err) {
      showNotification('error', 'Prompt silinirken hata oluştu');
    }
  };

  const handleSetActivePrompt = async (promptId: number) => {
    if (!client) return;
    try {
      const res = await fetch(`/api/n8n/client-prompts-set-active/client-prompts/set-active/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Aktif prompt değiştirildi');
        loadPrompts();
      } else {
        showNotification('error', data.error || 'Aktif prompt değiştirilemedi');
      }
    } catch (err) {
      showNotification('error', 'İşlem sırasında hata oluştu');
    }
  };

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

  if (error || !client) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-xl bg-red-500/10 mb-3">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-foreground font-medium mb-1">Müşteri bulunamadı</p>
          <Link href="/clients" className="text-sm text-primary hover:underline">
            Müşterilere Dön
          </Link>
        </div>
      </div>
    );
  }

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
          <Link href="/clients" className="hover:text-foreground transition-colors">
            Müşteriler
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{client.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold',
              formData.is_active
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  formData.is_active
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {formData.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              {client.domain && (
                <a
                  href={client.domain.startsWith('http') ? client.domain : `https://${client.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {client.domain}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-3.5 w-3.5" />
                Kaydedilmemiş
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                hasChanges
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground cursor-not-allowed'
              )}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Kaydet
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-foreground bg-[hsl(var(--glass-bg-2))]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-1))]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="px-6 py-6">
        <div className="max-w-3xl">
          {/* General Tab */}
          {activeTab === 'general' && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Section title="Temel Bilgiler">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Müşteri Adı" required>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="form-input"
                    />
                  </Field>
                  <Field label="URL Slug" required>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
                      className="form-input"
                    />
                  </Field>
                </div>
                <Field label="Web Sitesi">
                  <input
                    type="url"
                    value={formData.domain}
                    onChange={(e) => handleChange('domain', e.target.value)}
                    placeholder="https://example.com"
                    className="form-input"
                  />
                </Field>
                <Field label="Sektör">
                  <select
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Seçiniz...</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </Field>
              </Section>

              <Section title="Bölge Ayarları">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Varsayılan Ülke">
                    <select
                      value={formData.default_country}
                      onChange={(e) => handleChange('default_country', e.target.value)}
                      className="form-input"
                    >
                      <option value="TR">Türkiye</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="DE">Germany</option>
                    </select>
                  </Field>
                  <Field label="Varsayılan Dil">
                    <select
                      value={formData.default_language}
                      onChange={(e) => handleChange('default_language', e.target.value)}
                      className="form-input"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </Field>
                </div>
              </Section>

              <Section title="Durum">
                <ToggleField
                  checked={formData.is_active}
                  onChange={(v) => handleChange('is_active', v)}
                  label="Müşteri aktif"
                  description="Pasif müşteriler projelerde görünmez"
                />
              </Section>

              <Section title="Tehlikeli Bölge" variant="danger">
                <p className="text-sm text-muted-foreground mb-4">
                  Bu işlem geri alınamaz. Müşteriyle ilişkili tüm projeler de silinecektir.
                </p>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Müşteriyi Sil
                </button>
              </Section>
            </motion.div>
          )}

          {/* Prompts Tab */}
          {activeTab === 'prompts' && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Section
                title="AI Promptları"
                description={`Yapay zeka içerik üretiminde kullanılacak promptlar (${prompts.length}/${MAX_PROMPTS})`}
              >
                {promptsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prompts.length > 0 ? (
                      prompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className={cn(
                            'rounded-xl p-4 transition-colors',
                            prompt.is_active
                              ? 'bg-emerald-500/5 border border-emerald-500/20'
                              : 'bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]'
                          )}
                        >
                          {editingPrompt?.id === prompt.id ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingPrompt.prompt_name}
                                onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_name: e.target.value })}
                                className="form-input w-full"
                                placeholder="Prompt adı"
                              />
                              <textarea
                                value={editingPrompt.prompt_text}
                                onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_text: e.target.value })}
                                rows={5}
                                className="form-input w-full resize-none"
                                placeholder="Prompt içeriği..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleUpdatePrompt}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                  Kaydet
                                </button>
                                <button
                                  onClick={() => setEditingPrompt(null)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-2))] hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                                >
                                  İptal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">{prompt.prompt_name}</h4>
                                  {prompt.is_active && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                                      <Power className="h-3 w-3" />
                                      Aktif
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {!prompt.is_active && (
                                    <button
                                      onClick={() => handleSetActivePrompt(prompt.id)}
                                      className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                      title="Aktif yap"
                                    >
                                      <Power className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setEditingPrompt(prompt)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
                                    title="Düzenle"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePrompt(prompt.id)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Sil"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                                {prompt.prompt_text}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Henüz prompt eklenmemiş</p>
                      </div>
                    )}

                    {showNewPromptForm ? (
                      <div className="rounded-xl border border-dashed border-[hsl(var(--glass-border-default))] p-4 space-y-3">
                        <input
                          type="text"
                          value={newPrompt.name}
                          onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                          className="form-input w-full"
                          placeholder="Prompt adı (örn: Blog Yazısı, Ürün Açıklaması)"
                        />
                        <textarea
                          value={newPrompt.text}
                          onChange={(e) => setNewPrompt({ ...newPrompt, text: e.target.value })}
                          rows={5}
                          className="form-input w-full resize-none"
                          placeholder="Prompt içeriğini buraya yazın..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddPrompt}
                            disabled={!newPrompt.name.trim() || !newPrompt.text.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Ekle
                          </button>
                          <button
                            onClick={() => {
                              setShowNewPromptForm(false);
                              setNewPrompt({ name: '', text: '' });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-2))] hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      prompts.length < MAX_PROMPTS && (
                        <button
                          onClick={() => setShowNewPromptForm(true)}
                          className="w-full py-3 rounded-xl border border-dashed border-[hsl(var(--glass-border-default))] text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                          <Plus className="h-4 w-4 inline-block mr-1.5" />
                          Yeni Prompt Ekle
                        </button>
                      )
                    )}
                  </div>
                )}
              </Section>
            </motion.div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Section title="Marka Kelimeleri" description="İçeriklerde kullanılması önerilen kelimeler">
                <TagInput
                  items={formData.brand_keywords}
                  value={newBrandKeyword}
                  onChange={setNewBrandKeyword}
                  onAdd={() => addToArray('brand_keywords', newBrandKeyword)}
                  onRemove={(v) => removeFromArray('brand_keywords', v)}
                  placeholder="Yeni kelime ekle..."
                  variant="success"
                />
              </Section>

              <Section title="Yasaklı Kelimeler" description="İçeriklerde kullanılmaması gereken kelimeler">
                <TagInput
                  items={formData.forbidden_words}
                  value={newForbiddenWord}
                  onChange={setNewForbiddenWord}
                  onAdd={() => addToArray('forbidden_words', newForbiddenWord)}
                  onRemove={(v) => removeFromArray('forbidden_words', v)}
                  placeholder="Yasaklı kelime ekle..."
                  variant="danger"
                />
              </Section>
            </motion.div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Section title="AI Model Ayarları">
                <Field label="Tercih Edilen Model">
                  <select
                    value={formData.ai_model_preference}
                    onChange={(e) => handleChange('ai_model_preference', e.target.value)}
                    className="form-input"
                  >
                    {AI_MODELS.map(model => (
                      <option key={model.value} value={model.value}>{model.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Temperature" hint="0 = Tutarlı, 1 = Yaratıcı">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.ai_temperature}
                      onChange={(e) => handleChange('ai_temperature', parseFloat(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-mono w-12 text-right text-foreground">{formData.ai_temperature}</span>
                  </div>
                </Field>
              </Section>

              <Section title="AI Özellikleri">
                <ToggleField
                  checked={formData.enable_ai_analysis}
                  onChange={(v) => handleChange('enable_ai_analysis', v)}
                  label="AI Analiz"
                  description="Content gap ve fırsat skoru analizi"
                />
              </Section>
            </motion.div>
          )}

          {/* Competitors Tab */}
          {activeTab === 'competitors' && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Section title="Rakip Domainleri" description="SERP analizinde takip edilecek rakip siteler">
                <TagInput
                  items={formData.competitor_domains}
                  value={newCompetitor}
                  onChange={setNewCompetitor}
                  onAdd={() => addToArray('competitor_domains', newCompetitor)}
                  onRemove={(v) => removeFromArray('competitor_domains', v)}
                  placeholder="rakip.com"
                  variant="info"
                />
              </Section>

              <Section title="Analiz Ayarları">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Rakip Sayısı" hint="SERP'te analiz edilecek rakip sayısı">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.competitor_count}
                      onChange={(e) => handleChange('competitor_count', parseInt(e.target.value))}
                      className="form-input w-32"
                    />
                  </Field>
                  <Field label="Cache Süresi (Gün)" hint="API sonuçlarının cache'de tutulma süresi">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.cache_duration_days}
                      onChange={(e) => handleChange('cache_duration_days', parseInt(e.target.value))}
                      className="form-input w-32"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="API Entegrasyonları">
                <ToggleField
                  checked={formData.enable_ahrefs_api}
                  onChange={(v) => handleChange('enable_ahrefs_api', v)}
                  label="Ahrefs API"
                  description="Backlink ve DR verileri için Ahrefs kullan"
                />
              </Section>
            </motion.div>
          )}

          {/* Sheets Tab */}
          {activeTab === 'sheets' && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {showSheetsConfigForm || editingSheetsConfig ? (
                <Section
                  title={editingSheetsConfig ? 'Konfigürasyonu Düzenle' : 'Yeni Sheets Konfigürasyonu'}
                  description="Google Sheets bağlantısı ve sütun eşleştirmesi"
                >
                  <SheetsConfigForm
                    clientId={client.id}
                    editConfig={editingSheetsConfig}
                    onSuccess={() => {
                      setShowSheetsConfigForm(false);
                      setEditingSheetsConfig(null);
                    }}
                    onCancel={() => {
                      setShowSheetsConfigForm(false);
                      setEditingSheetsConfig(null);
                    }}
                  />
                </Section>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Google Sheets Entegrasyonu</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Anahtar kelime verilerini Google Sheets'e aktarmak için konfigürasyonlar
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSheetsConfigForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Yeni Ekle
                    </button>
                  </div>

                  <SheetsConfigList
                    clientId={client.id}
                    onEdit={(config) => setEditingSheetsConfig(config)}
                    onDuplicate={(config) => {
                      // Create a copy with modified name
                      const duplicatedConfig = {
                        ...config,
                        id: undefined,
                        config_name: `${config.config_name} (Kopya)`,
                        is_default: false,
                      };
                      setEditingSheetsConfig(duplicatedConfig as any);
                    }}
                  />
                </>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}

// Section Component
function Section({
  title,
  description,
  variant,
  children
}: {
  title: string;
  description?: string;
  variant?: 'danger';
  children: React.ReactNode
}) {
  return (
    <div className={cn(
      'rounded-2xl p-6',
      variant === 'danger'
        ? 'bg-red-500/5 border border-red-500/20'
        : 'glass-2'
    )}>
      <h3 className={cn(
        'text-sm font-semibold mb-1',
        variant === 'danger' ? 'text-red-400' : 'text-foreground'
      )}>
        {title}
      </h3>
      {description && <p className="text-xs text-muted-foreground mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Field Component
function Field({
  label,
  hint,
  required,
  children
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Toggle Field Component
function ToggleField({
  checked,
  onChange,
  label,
  description
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="pt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative w-10 h-6 rounded-full transition-colors',
            checked ? 'bg-primary' : 'bg-[hsl(var(--glass-bg-3))]'
          )}
        >
          <span className={cn(
            'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
            checked && 'translate-x-4'
          )} />
        </button>
      </div>
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </label>
  );
}

// Tag Input Component
function TagInput({
  items,
  value,
  onChange,
  onAdd,
  onRemove,
  placeholder,
  variant
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: string) => void;
  placeholder: string;
  variant: 'success' | 'danger' | 'info';
}) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          placeholder={placeholder}
          className="form-input flex-1"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border', variants[variant])}>
              {item}
              <button onClick={() => onRemove(item)} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
