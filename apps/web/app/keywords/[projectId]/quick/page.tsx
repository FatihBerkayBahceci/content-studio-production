'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  Copy,
  Plus,
  Minus,
  Trash2,
  FileSpreadsheet,
  Sparkles,
  Calendar,
  Building2,
  CheckSquare,
  Square,
  X,
  Zap,
  Download,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { SheetsExportModal, SheetsAdvancedModal } from '@/components/sheets';

interface PageProps {
  params: { projectId: string };
}

interface KeywordResult {
  id?: number;
  keyword: string;
  source?: string;
  search_volume?: number | null;
  keyword_difficulty?: number | null;
  competition?: string | null;
  cpc?: number | null;
  search_intent?: string | null;
}

interface Project {
  id: number;
  uuid: string;
  project_name: string;
  main_keyword: string;
  status: string;
  client_id: number;
  client_name?: string;
  total_keywords_found?: number;
  created_at: string;
}

// Turkish character normalization
const turkishCharMap: { [key: string]: string } = {
  'ı': 'i', 'İ': 'i', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u',
  'ş': 's', 'Ş': 's', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c'
};

function normalizeKeyword(keyword: string): string {
  let normalized = keyword.toLowerCase().trim();
  for (const [turkish, ascii] of Object.entries(turkishCharMap)) {
    normalized = normalized.replace(new RegExp(turkish, 'g'), ascii);
  }
  return normalized.replace(/\s+/g, ' ');
}

export default function KeywordQuickPage({ params }: PageProps) {
  const { projectId } = params;

  // Core state
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [rawKeywords, setRawKeywords] = useState<KeywordResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Selection
  const [selectedKeywords, setSelectedKeywords] = useState<Set<number>>(new Set());

  // Actions
  const [isAddingKeyword, setIsAddingKeyword] = useState<string | null>(null);
  const [isDeletingKeyword, setIsDeletingKeyword] = useState<number | null>(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // Pagination
  const [mainDisplayCount, setMainDisplayCount] = useState(10);
  const [suggestionsDisplayCount, setSuggestionsDisplayCount] = useState(5);

  // Export modals
  const [showSheetsExportModal, setShowSheetsExportModal] = useState(false);
  const [showSheetsAdvancedModal, setShowSheetsAdvancedModal] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectRes = await fetch(`/api/projects/${projectId}`);
        const projectData = await projectRes.json();
        if (!projectData.success) {
          setError(projectData.error || 'Proje bulunamadı');
          setIsLoading(false);
          return;
        }
        setProject(projectData.project);

        // Fetch keywords with retry
        let keywordsData: any = { success: false, data: [] };
        for (let i = 0; i < 5; i++) {
          const keywordsRes = await fetch(`/api/projects/${projectId}/keywords`);
          keywordsData = await keywordsRes.json();
          if (keywordsData.success && keywordsData.data?.length > 0) break;
          await new Promise(r => setTimeout(r, 1500));
        }

        if (keywordsData.success && keywordsData.data?.length > 0) {
          setKeywords(keywordsData.data);
        }

        // Fetch raw keywords
        for (let i = 0; i < 3; i++) {
          const rawRes = await fetch(`/api/projects/${projectId}/keywords-raw`);
          const rawData = await rawRes.json();
          if (rawData.success && rawData.data?.length > 0) {
            setRawKeywords(rawData.data);
            break;
          }
          await new Promise(r => setTimeout(r, 1500));
        }

      } catch (err) {
        setError('Veriler yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // Filter keywords
  const filteredKeywords = useMemo(() => {
    return keywords
      .filter(kw => !searchQuery || kw.keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));
  }, [keywords, searchQuery]);

  // Suggestions (raw keywords not in main list)
  const suggestions = useMemo(() => {
    const mainKeywordSet = new Set(keywords.map(k => normalizeKeyword(k.keyword)));
    return rawKeywords
      .filter(kw => {
        const normalizedKw = normalizeKeyword(kw.keyword);
        if (mainKeywordSet.has(normalizedKw)) return false;
        if (searchQuery && !kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));
  }, [rawKeywords, keywords, searchQuery]);

  // Add keyword
  const addKeywordToMain = async (kw: KeywordResult) => {
    if (!project) return;
    setIsAddingKeyword(kw.keyword);
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: kw.keyword, search_volume: kw.search_volume,
          cpc: kw.cpc, competition: kw.competition, source: 'manual'
        })
      });
      const data = await response.json();
      if (data.success) {
        setKeywords(prev => [...prev, { ...kw, id: data.id, source: 'manual' }]);
      }
    } catch (err) {}
    setIsAddingKeyword(null);
  };

  // Remove keyword
  const removeKeywordFromMain = async (kw: KeywordResult) => {
    if (!project || !kw.id) return;
    setIsDeletingKeyword(kw.id);
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords?id=${kw.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setKeywords(prev => prev.filter(k => k.id !== kw.id));
        setSelectedKeywords(prev => { const next = new Set(prev); next.delete(kw.id!); return next; });
      }
    } catch (err) {}
    setIsDeletingKeyword(null);
  };

  // Remove selected keywords
  const removeSelectedKeywords = async () => {
    if (selectedKeywords.size === 0) return;
    setIsDeletingSelected(true);

    const selectedIds = Array.from(selectedKeywords);
    for (const id of selectedIds) {
      const kw = keywords.find(k => k.id === id);
      if (kw) {
        try {
          const response = await fetch(`/api/projects/${projectId}/keywords?id=${id}`, { method: 'DELETE' });
          const data = await response.json();
          if (data.success) {
            setKeywords(prev => prev.filter(k => k.id !== id));
          }
        } catch (err) {}
      }
    }

    setSelectedKeywords(new Set());
    setIsDeletingSelected(false);
  };

  // Add all suggestions
  const addAllSuggestions = async () => {
    const visibleSuggestions = suggestions.slice(0, suggestionsDisplayCount);
    for (const kw of visibleSuggestions) {
      await addKeywordToMain(kw);
    }
  };

  // Selection
  const toggleKeywordSelection = (id: number) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedKeywords(newSelected);
  };

  const selectAllKeywords = () => {
    setSelectedKeywords(new Set(filteredKeywords.slice(0, mainDisplayCount).map((kw) => kw.id!).filter(Boolean)));
  };

  const deselectAllKeywords = () => setSelectedKeywords(new Set());

  // Copy selected
  const copySelected = () => {
    const selected = keywords.filter(kw => selectedKeywords.has(kw.id!));
    if (selected.length === 0) return;
    const text = selected.map(kw => `${kw.keyword}\t${kw.search_volume || ''}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  // Export CSV
  const handleExportCSV = () => {
    const selected = keywords.filter(kw => selectedKeywords.has(kw.id!));
    if (selected.length === 0) return;
    const headers = ['Keyword', 'Hacim', 'CPC', 'Rekabet'];
    const rows = selected.map(kw => [
      kw.keyword,
      kw.search_volume || '',
      kw.cpc || '',
      kw.competition || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `keywords-${project?.main_keyword || projectId}.csv`;
    a.click();
  };

  // Format volume
  const formatVolume = (vol: number | null | undefined) => {
    if (!vol) return '-';
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <div className="relative h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 rounded-2xl bg-red-500/10 inline-block mb-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Hata</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/keywords" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white">
            <ArrowLeft className="h-4 w-4" /> Geri Dön
          </Link>
        </div>
      </div>
    );
  }

  const displayedKeywords = filteredKeywords.slice(0, mainDisplayCount);
  const displayedSuggestions = suggestions.slice(0, suggestionsDisplayCount);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[hsl(var(--glass-border-subtle))] bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/keywords" className="p-2 rounded-xl glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h1 className="text-lg font-bold text-foreground">{project?.main_keyword}</h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <Calendar className="h-3 w-3" />
                {project?.created_at ? new Date(project.created_at).toLocaleDateString('tr-TR') : '-'}
                {project?.client_name && (
                  <>
                    <span>•</span>
                    <Building2 className="h-3 w-3" />
                    {project.client_name}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Side by Side Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Main Keywords */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[hsl(var(--glass-border-subtle))]">
          {/* Left Header */}
          <div className="flex-shrink-0 p-4 border-b border-[hsl(var(--glass-border-subtle))]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Seçilen Keywordler</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {keywords.length}
                </span>
              </div>
              <button
                onClick={displayedKeywords.length > 0 && selectedKeywords.size === displayedKeywords.filter(k => k.id).length ? deselectAllKeywords : selectAllKeywords}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {selectedKeywords.size > 0 ? 'Seçimi Kaldır' : 'Tümünü Seç'}
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setMainDisplayCount(10); setSuggestionsDisplayCount(5); }}
                placeholder="Keyword ara..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))] text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setMainDisplayCount(10); setSuggestionsDisplayCount(5); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Left Body */}
          <div className="flex-1 overflow-y-auto">
            {keywords.length === 0 ? (
              <div className="p-8 text-center">
                <div className="p-3 rounded-xl bg-amber-500/10 inline-block mb-3">
                  <AlertCircle className="h-6 w-6 text-amber-400" />
                </div>
                <p className="text-sm text-muted-foreground">Henüz keyword eklenmemiş</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                  {displayedKeywords.map((kw) => {
                    const isDeleting = isDeletingKeyword === kw.id;
                    const isSelected = kw.id ? selectedKeywords.has(kw.id) : false;
                    return (
                      <motion.div
                        key={kw.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 transition-colors",
                          isSelected ? "bg-primary/5" : "hover:bg-[hsl(var(--glass-bg-interactive))]"
                        )}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => kw.id && toggleKeywordSelection(kw.id)}
                          className="flex-shrink-0"
                        >
                          {isSelected
                            ? <CheckSquare className="h-5 w-5 text-primary" />
                            : <Square className="h-5 w-5 text-muted-foreground" />}
                        </button>

                        {/* Keyword */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate block">{kw.keyword}</span>
                        </div>

                        {/* Volume */}
                        <span className="flex-shrink-0 text-sm font-semibold text-foreground min-w-[50px] text-right">
                          {formatVolume(kw.search_volume)}
                        </span>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeKeywordFromMain(kw)}
                          disabled={isDeleting}
                          className="flex-shrink-0 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Load More for Main */}
                {mainDisplayCount < filteredKeywords.length && (
                  <div className="p-4 border-t border-[hsl(var(--glass-border-subtle))]">
                    <button
                      onClick={() => setMainDisplayCount(prev => prev + 10)}
                      className="w-full py-2.5 rounded-xl bg-[hsl(var(--glass-bg-2))] hover:bg-[hsl(var(--glass-bg-3))] text-sm font-medium text-foreground transition-colors flex items-center justify-center gap-2"
                    >
                      Daha Fazla Yükle
                      <span className="text-xs text-muted-foreground">
                        ({mainDisplayCount}/{filteredKeywords.length})
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Suggestions */}
        <div className="w-[400px] flex-shrink-0 flex flex-col bg-[hsl(var(--glass-bg-1))]">
          {/* Right Header */}
          <div className="flex-shrink-0 p-4 border-b border-[hsl(var(--glass-border-subtle))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-foreground">Öneriler</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                  {suggestions.length}
                </span>
              </div>
              {displayedSuggestions.length > 0 && (
                <button
                  onClick={addAllSuggestions}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Tümünü Ekle
                </button>
              )}
            </div>
          </div>

          {/* Right Body */}
          <div className="flex-1 overflow-y-auto">
            {suggestions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Tüm öneriler eklendi</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                  {displayedSuggestions.map((kw, index) => {
                    const isAdding = isAddingKeyword === kw.keyword;
                    return (
                      <motion.div
                        key={kw.id || index}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
                      >
                        {/* Add Button */}
                        <button
                          onClick={() => addKeywordToMain(kw)}
                          disabled={isAdding}
                          className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </button>

                        {/* Keyword */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-foreground truncate block">{kw.keyword}</span>
                        </div>

                        {/* Volume */}
                        <span className="flex-shrink-0 text-sm font-medium text-muted-foreground min-w-[50px] text-right">
                          {formatVolume(kw.search_volume)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Load More for Suggestions */}
                {suggestionsDisplayCount < suggestions.length && (
                  <div className="p-4 border-t border-[hsl(var(--glass-border-subtle))]">
                    <button
                      onClick={() => setSuggestionsDisplayCount(prev => prev + 5)}
                      className="w-full py-2.5 rounded-xl bg-[hsl(var(--glass-bg-2))] hover:bg-[hsl(var(--glass-bg-3))] text-sm font-medium text-foreground transition-colors flex items-center justify-center gap-2"
                    >
                      Daha Fazla Yükle
                      <span className="text-xs text-muted-foreground">
                        ({suggestionsDisplayCount}/{suggestions.length})
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedKeywords.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 shadow-2xl">
              {/* Selection Count */}
              <span className="text-sm font-medium text-foreground">
                {selectedKeywords.size} seçili
              </span>

              <div className="h-5 w-px bg-zinc-700" />

              {/* Copy Button */}
              <button
                onClick={copySelected}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-zinc-800 transition-colors"
                title="Kopyala"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Kopyala</span>
              </button>

              {/* CSV Export Button */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="CSV İndir"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              {/* Sheets Export Button */}
              <button
                onClick={() => setShowSheetsExportModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-green-400 hover:bg-green-500/10 transition-colors"
                title="Sheets'e Aktar"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Sheets</span>
              </button>

              {/* Advanced Export Button */}
              <button
                onClick={() => setShowSheetsAdvancedModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
                title="Gelişmiş Aktarım"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Gelişmiş</span>
              </button>

              {/* Delete Button */}
              <button
                onClick={removeSelectedKeywords}
                disabled={isDeletingSelected}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                title="Seçilenleri Sil"
              >
                {isDeletingSelected ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="hidden sm:inline">Sil</span>
              </button>

              <div className="h-5 w-px bg-zinc-700" />

              {/* Close Button */}
              <button
                onClick={deselectAllKeywords}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sheets Export Modal */}
      <SheetsExportModal
        open={showSheetsExportModal}
        onOpenChange={setShowSheetsExportModal}
        projectId={projectId}
        clientId={project?.client_id ?? null}
        selectedKeywords={keywords.filter(kw => selectedKeywords.has(kw.id!))}
      />

      {/* Sheets Advanced Modal */}
      <SheetsAdvancedModal
        open={showSheetsAdvancedModal}
        onOpenChange={setShowSheetsAdvancedModal}
        clientId={project?.client_id ?? null}
        selectedKeywords={keywords.filter(kw => selectedKeywords.has(kw.id!))}
      />
    </div>
  );
}
