'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, CheckCircle2, XCircle,
  MessageSquare, Sparkles, Info, Power, Copy,
  Workflow, Code2, Eye, EyeOff, Maximize2, Minimize2,
  Undo2, Redo2, WrapText, Type, Hash, Braces
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

const WORKFLOW_USAGE: Record<string, { workflow: string; description: string }[]> = {
  'keyword-discovery': [{ workflow: 'WF-101a Keyword Discovery', description: 'Ana keyword keşif süreci' }],
  'keyword-filter': [{ workflow: 'WF-101b AI Keyword Filter', description: 'AI ile keyword filtreleme' }],
  'content-gap-analyzer': [{ workflow: 'WF-106 Content Gap Finder', description: 'İçerik boşluğu analizi' }],
  'opportunity-scorer': [{ workflow: 'WF-107 Opportunity Scorer', description: 'Fırsat puanlama analizi' }],
  'strategy-generator': [{ workflow: 'WF-109 Strategy Generator', description: 'İçerik stratejisi oluşturma' }],
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

const VARIABLES = [
  { name: 'main_keyword', desc: 'Ana anahtar kelime' },
  { name: 'target_audience', desc: 'Hedef kitle' },
  { name: 'industry', desc: 'Sektör/endüstri' },
  { name: 'language', desc: 'Hedef dil' },
  { name: 'domain', desc: 'Website domain' },
  { name: 'keywords', desc: 'Keyword listesi' },
];

export default function PromptEditPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState<SystemPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'keyword',
    prompt_text: '',
    description: '',
    is_active: true,
  });

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
          setHistory([data.data.prompt_text]);
          setHistoryIndex(0);
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

  const handleTextChange = (newText: string) => {
    setFormData({ ...formData, prompt_text: newText });
    setHasChanges(true);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    if (newHistory.length > 50) newHistory.shift(); // Keep last 50
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFormData({ ...formData, prompt_text: history[newIndex] });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFormData({ ...formData, prompt_text: history[newIndex] });
    }
  };

  const insertVariable = (varName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.prompt_text;
    const variable = `{{ ${varName} }}`;

    const newText = text.substring(0, start) + variable + text.substring(end);
    handleTextChange(newText);

    // Set cursor position after variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

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
        setHasChanges(false);
        showNotification('success', 'Prompt kaydedildi');
      } else {
        showNotification('error', data.error || 'Kaydetme başarısız');
      }
    } catch (err) {
      showNotification('error', 'İşlem sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('success', 'Kopyalandı');
  };

  // Highlight variables in preview
  const renderPreview = (text: string) => {
    return text.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      '<span class="px-1.5 py-0.5 rounded bg-primary/30 text-primary font-semibold">{{ $1 }}</span>'
    );
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
    <PageTransition className={cn("min-h-screen", isFullscreen && "fixed inset-0 z-50 bg-background overflow-hidden")}>
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
      <header className="border-b border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))]">
        <div className={cn("px-4 py-3", !isFullscreen && "max-w-7xl mx-auto")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/settings/system-prompts/${id}`}
                className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </Link>

              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <div>
                  <h1 className="text-sm font-semibold text-foreground">{prompt.name}</h1>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-muted-foreground font-mono">{prompt.slug}</code>
                    {hasChanges && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
                        Kaydedilmemiş değişiklikler
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg glass-1">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded hover:bg-[hsl(var(--glass-bg-interactive))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Geri Al (Ctrl+Z)"
                >
                  <Undo2 className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 rounded hover:bg-[hsl(var(--glass-bg-interactive))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="İleri Al (Ctrl+Y)"
                >
                  <Redo2 className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="w-px h-4 bg-[hsl(var(--glass-border-subtle))] mx-1" />
                <button
                  onClick={() => setWordWrap(!wordWrap)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    wordWrap ? "bg-primary/20 text-primary" : "hover:bg-[hsl(var(--glass-bg-interactive))] text-muted-foreground"
                  )}
                  title="Kelime Kaydırma"
                >
                  <WrapText className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    showPreview ? "bg-primary/20 text-primary" : "hover:bg-[hsl(var(--glass-bg-interactive))] text-muted-foreground"
                  )}
                  title="Önizleme"
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                  title={isFullscreen ? 'Küçült' : 'Tam Ekran'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={cn(
        "flex",
        isFullscreen ? "h-[calc(100vh-57px)]" : "max-w-7xl mx-auto px-4 py-4 min-h-[calc(100vh-120px)]"
      )}>
        {/* Editor Panel */}
        <div className={cn(
          "flex-1 flex flex-col",
          !isFullscreen && "rounded-2xl glass-2 overflow-hidden"
        )}>
          {/* Variable Insert Bar */}
          <div className="px-4 py-2 border-b border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-2))] flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
              <Braces className="h-3 w-3" />
              Değişken Ekle:
            </span>
            {VARIABLES.map(v => (
              <button
                key={v.name}
                onClick={() => insertVariable(v.name)}
                className="flex-shrink-0 px-2 py-1 rounded text-xs font-mono bg-[hsl(var(--glass-bg-3))] hover:bg-primary/20 hover:text-primary transition-colors"
                title={v.desc}
              >
                {v.name}
              </button>
            ))}
          </div>

          {/* Editor / Preview */}
          <div className="flex-1 flex overflow-hidden">
            {/* Text Editor */}
            <div className={cn("flex-1 flex flex-col", showPreview && "border-r border-[hsl(var(--glass-border-subtle))]")}>
              <textarea
                ref={textareaRef}
                value={formData.prompt_text}
                onChange={(e) => handleTextChange(e.target.value)}
                className={cn(
                  "flex-1 w-full p-4 bg-transparent text-sm text-foreground font-mono leading-relaxed resize-none focus:outline-none",
                  !wordWrap && "whitespace-pre overflow-x-auto"
                )}
                placeholder="Prompt metnini buraya yazın..."
                spellCheck={false}
              />
              <div className="px-4 py-2 border-t border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-2))] flex items-center justify-between text-xs text-muted-foreground">
                <span>{formData.prompt_text.length} karakter</span>
                <span>{formData.prompt_text.split(/\s+/).filter(Boolean).length} kelime</span>
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="flex-1 flex flex-col bg-[hsl(var(--glass-bg-1))]">
                <div className="px-4 py-2 border-b border-[hsl(var(--glass-border-subtle))] text-xs font-medium text-muted-foreground">
                  Önizleme
                </div>
                <div
                  className="flex-1 p-4 overflow-auto text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderPreview(formData.prompt_text).replace(/\n/g, '<br>') }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Only show when not fullscreen */}
        {!isFullscreen && (
          <div className="w-72 ml-4 space-y-4 flex-shrink-0">
            {/* Meta */}
            <div className="rounded-xl glass-2 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Ayarlar</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ad</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setHasChanges(true); }}
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => { setFormData({ ...formData, category: e.target.value }); setHasChanges(true); }}
                    className="w-full glass-input text-sm"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setHasChanges(true); }}
                    rows={2}
                    className="w-full glass-input text-sm resize-none"
                    placeholder="Kısa açıklama..."
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => { setFormData({ ...formData, is_active: e.target.checked }); setHasChanges(true); }}
                    className="h-4 w-4 rounded border-[hsl(var(--glass-border-default))] bg-[hsl(0_0%_3%)] text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-muted-foreground">Aktif</span>
                </label>
              </div>
            </div>

            {/* Workflow Usage */}
            {workflowUsage.length > 0 && (
              <div className="rounded-xl glass-2 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                  Workflow'lar
                </h3>
                <div className="space-y-2">
                  {workflowUsage.map((wf, i) => (
                    <div key={i} className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="text-xs font-medium text-blue-400">{wf.workflow}</div>
                      <div className="text-[10px] text-blue-400/60">{wf.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="rounded-xl glass-2 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-400" />
                Kısayollar
              </h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))] text-[10px]">Ctrl+S</kbd> Kaydet</p>
                <p><kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))] text-[10px]">Ctrl+Z</kbd> Geri Al</p>
                <p><kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))] text-[10px]">Ctrl+Y</kbd> İleri Al</p>
                <p><kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))] text-[10px]">F11</kbd> Tam Ekran</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
