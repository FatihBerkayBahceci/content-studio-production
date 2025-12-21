'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  Globe,
  TrendingUp,
  Target,
  BarChart3,
  Loader2,
  AlertCircle,
  Copy,
  List,
  LayoutGrid,
  ArrowRight,
  Calendar,
  Building2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  CheckSquare,
  Square,
  ClipboardList,
  ChevronDown,
  Tag,
  Ruler,
  DollarSign,
  HelpCircle,
  Package,
  Database,
  GitCompare,
  Plus,
  X,
  Trash2,
  Car,
  Star,
  Zap,
  Heart,
  Shield,
  Clock,
  MapPin,
  Users,
  ShoppingCart,
  Settings,
  Columns,
  Focus,
  PanelLeftClose,
  PanelLeft,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { groupKeywords } from '@/lib/keyword-grouping';
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
  keyword_cluster?: string | null;
  opportunity_score?: number | null;
  content_priority?: string | null;
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

interface AICategory {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
  description?: string;
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

// Icon mapping
const getGroupIcon = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    'tag': Tag, 'ruler': Ruler, 'dollar-sign': DollarSign, 'help-circle': HelpCircle,
    'git-compare': GitCompare, 'package': Package, 'building-2': Building2, 'car': Car,
    'star': Star, 'zap': Zap, 'heart': Heart, 'shield': Shield, 'clock': Clock,
    'map-pin': MapPin, 'users': Users, 'shopping-cart': ShoppingCart, 'trending-up': TrendingUp,
    'search': Search, 'settings': Settings, 'target': Target, 'globe': Globe,
    'database': Database, 'sparkles': Sparkles,
  };
  return iconMap[iconName] || Package;
};

// Badge Components
function DifficultyBadge({ value }: { value?: number | null }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground text-xs">-</span>;
  const color = value <= 30 ? 'emerald' : value <= 60 ? 'amber' : 'red';
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border', colors[color])}>
      {value}
    </span>
  );
}

function OpportunityBadge({ value }: { value?: number | null }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground text-xs">-</span>;
  const color = value >= 70 ? 'emerald' : value >= 40 ? 'amber' : 'red';
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border', colors[color])}>
      {value}
    </span>
  );
}

function CompetitionBadge({ competition }: { competition?: string | null }) {
  if (!competition) return <span className="text-muted-foreground text-xs">-</span>;
  const colors: Record<string, string> = {
    'LOW': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'MEDIUM': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'HIGH': 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const labels: Record<string, string> = { 'LOW': 'Düşük', 'MEDIUM': 'Orta', 'HIGH': 'Yüksek' };
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium border', colors[competition.toUpperCase()] || 'bg-muted/20 text-muted-foreground')}>
      {labels[competition.toUpperCase()] || competition}
    </span>
  );
}

function IntentBadge({ intent }: { intent?: string | null }) {
  if (!intent) return <span className="text-muted-foreground text-xs">-</span>;
  const colors: Record<string, string> = {
    'informational': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'transactional': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'commercial': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'navigational': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  const labels: Record<string, string> = {
    'informational': 'Info', 'transactional': 'Trans', 'commercial': 'Comm', 'navigational': 'Nav',
  };
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium border', colors[intent.toLowerCase()] || 'bg-muted/20 text-muted-foreground')}>
      {labels[intent.toLowerCase()] || intent}
    </span>
  );
}



export default function KeywordProPage({ params }: PageProps) {
  const { projectId } = params;
  const router = useRouter();

  // Core state
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [rawKeywords, setRawKeywords] = useState<KeywordResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'keyword' | 'volume' | 'cpc' | 'difficulty'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection
  const [selectedKeywords, setSelectedKeywords] = useState<Set<number>>(new Set());

  // Raw keywords
  const [rawSearchQuery, setRawSearchQuery] = useState('');
  const [isAddingKeyword, setIsAddingKeyword] = useState<string | null>(null);
  const [isDeletingKeyword, setIsDeletingKeyword] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // AI Categorization
  const [aiCategories, setAiCategories] = useState<AICategory[]>([]);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [aiCategorized, setAiCategorized] = useState(false);

  // Sheets modals
  const [showSheetsExportModal, setShowSheetsExportModal] = useState(false);
  const [showSheetsAdvancedModal, setShowSheetsAdvancedModal] = useState(false);

  // Side panel
  const [showRawPanel, setShowRawPanel] = useState(true);
  const [rawDisplayCount, setRawDisplayCount] = useState(5);

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
          setStats(keywordsData.stats);
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

        // Check AI categorization
        try {
          const catRes = await fetch(`/api/projects/${projectId}/keywords-categorize`);
          const catData = await catRes.json();
          if (catData.success && catData.categorization_done && catData.categories) {
            setAiCategories(catData.categories);
            setAiCategorized(true);
          }
        } catch (e) {}

      } catch (err) {
        setError('Veriler yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let filtered = keywords.filter(kw =>
      !searchQuery || kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    );
    filtered = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'volume': aVal = a.search_volume || 0; bVal = b.search_volume || 0; break;
        case 'cpc': aVal = a.cpc || 0; bVal = b.cpc || 0; break;
        case 'difficulty': aVal = a.keyword_difficulty || 0; bVal = b.keyword_difficulty || 0; break;
        default: aVal = a.keyword.toLowerCase(); bVal = b.keyword.toLowerCase();
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return filtered;
  }, [keywords, searchQuery, sortBy, sortOrder]);

  // Grouped keywords
  const groupedKeywords = useMemo(() => {
    if (aiCategorized && aiCategories.length > 0) {
      return aiCategories.map(cat => ({
        id: cat.id, name: cat.name, icon: cat.icon,
        keywords: rawKeywords.filter(kw => cat.keywords.some(k => k.toLowerCase() === kw.keyword.toLowerCase())),
        totalVolume: rawKeywords.filter(kw => cat.keywords.some(k => k.toLowerCase() === kw.keyword.toLowerCase()))
          .reduce((sum, kw) => sum + (kw.search_volume || 0), 0)
      }));
    }
    return groupKeywords(rawKeywords);
  }, [rawKeywords, aiCategorized, aiCategories]);

  // Filtered raw keywords
  const filteredRawKeywords = useMemo(() => {
    const mainKeywordSet = new Set(keywords.map(k => normalizeKeyword(k.keyword)));
    let categoryKeywords: Set<string> | null = null;
    if (selectedCategory) {
      const selectedGroup = groupedKeywords.find(g => g.id === selectedCategory);
      if (selectedGroup) categoryKeywords = new Set(selectedGroup.keywords.map(k => normalizeKeyword(k.keyword)));
    }
    return rawKeywords
      .filter(kw => {
        const normalizedKw = normalizeKeyword(kw.keyword);
        if (mainKeywordSet.has(normalizedKw)) return false;
        if (rawSearchQuery && !kw.keyword.toLowerCase().includes(rawSearchQuery.toLowerCase())) return false;
        if (categoryKeywords && !categoryKeywords.has(normalizedKw)) return false;
        return true;
      })
      .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));
  }, [rawKeywords, keywords, rawSearchQuery, selectedCategory, groupedKeywords]);

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

  // AI Categorization
  const runAiCategorization = async () => {
    if (rawKeywords.length === 0 || isAiCategorizing) return;
    setIsAiCategorizing(true);
    setSelectedCategory(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords-categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: rawKeywords.slice(0, 500).map(kw => ({
            id: kw.id, keyword: kw.keyword, search_volume: kw.search_volume, cpc: kw.cpc, competition: kw.competition
          }))
        })
      });
      const data = await response.json();
      if (data.success && data.categories) {
        setAiCategories(data.categories);
        setAiCategorized(true);
      }
    } catch (err) {}
    setIsAiCategorizing(false);
  };

  // Selection
  const toggleKeywordSelection = (id: number) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedKeywords(newSelected);
  };

  const selectAllKeywords = () => {
    setSelectedKeywords(new Set(filteredKeywords.map((kw, idx) => kw.id || idx)));
  };

  const deselectAllKeywords = () => setSelectedKeywords(new Set());

  const copySelectedAsTable = () => {
    const selected = filteredKeywords.filter((kw, idx) => selectedKeywords.has(kw.id || idx));
    if (selected.length === 0) return;
    const rows = selected.map(kw => [kw.keyword, kw.search_volume || ''].join('\t'));
    navigator.clipboard.writeText(['Keyword\tHacim', ...rows].join('\n'));
  };

  // Export
  const handleExportCSV = () => {
    if (!filteredKeywords.length) return;
    const headers = ['Keyword', 'Hacim', 'Zorluk', 'Rekabet', 'CPC', 'Intent', 'Fırsat'];
    const rows = filteredKeywords.map(kw => [
      kw.keyword, kw.search_volume || '', kw.keyword_difficulty || '',
      kw.competition || '', kw.cpc || '', kw.search_intent || '', kw.opportunity_score || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `keywords-${project?.main_keyword || projectId}.csv`;
    a.click();
  };

  const formatCpc = (cpc: any) => {
    if (cpc === null || cpc === undefined) return null;
    const num = typeof cpc === 'string' ? parseFloat(cpc) : cpc;
    return isNaN(num) ? null : num;
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[hsl(var(--glass-border-subtle))] bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/keywords" className="p-2 rounded-xl glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">{project?.main_keyword}</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {project?.created_at ? new Date(project.created_at).toLocaleDateString('tr-TR') : '-'}
                    {project?.client_name && (
                      <>
                        <span>•</span>
                        <Building2 className="h-3 w-3" />
                        {project.client_name}
                      </>
                    )}
                    <span>•</span>
                    <span className="text-primary font-medium">{keywords.length} keyword</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Main Keywords */}
        <div className={cn("flex-1 flex flex-col min-w-0 transition-all", showRawPanel ? "mr-0" : "")}>
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-[hsl(var(--glass-border-subtle))] flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ara..."
                  className="pl-9 pr-4 py-2 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))] text-sm w-48 focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
              </div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-') as [typeof sortBy, 'asc' | 'desc'];
                  setSortBy(by);
                  setSortOrder(order);
                }}
                className="px-3 py-2 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))] text-sm [&>option]:bg-zinc-900 [&>option]:text-white"
              >
                <option value="volume-desc">Hacim ↓</option>
                <option value="volume-asc">Hacim ↑</option>
                <option value="difficulty-asc">Zorluk ↑</option>
                <option value="difficulty-desc">Zorluk ↓</option>
                <option value="cpc-desc">CPC ↓</option>
                <option value="keyword-asc">A-Z</option>
              </select>
              <span className="text-sm text-muted-foreground">{filteredKeywords.length} sonuç</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Selection */}
              <button
                onClick={selectedKeywords.size === filteredKeywords.length && filteredKeywords.length > 0 ? deselectAllKeywords : selectAllKeywords}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))] hover:bg-[hsl(var(--glass-bg-2))] text-sm transition-colors"
              >
                {selectedKeywords.size > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                {selectedKeywords.size > 0 ? `${selectedKeywords.size} seçili` : 'Tümü'}
              </button>
              {selectedKeywords.size > 0 && (
                <button onClick={copySelectedAsTable}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                  <ClipboardList className="h-4 w-4" /> Kopyala
                </button>
              )}
              <div className="h-6 w-px bg-[hsl(var(--glass-border-subtle))]" />
              <button onClick={handleExportCSV} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="CSV">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={() => setShowSheetsExportModal(true)} disabled={selectedKeywords.size === 0}
                className="p-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50" title="Sheets">
                <FileSpreadsheet className="h-4 w-4" />
              </button>
              <button onClick={() => setShowSheetsAdvancedModal(true)} disabled={selectedKeywords.size === 0}
                className="p-2 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-50" title="Gelişmiş">
                <Settings className="h-4 w-4" />
              </button>
              <div className="h-6 w-px bg-[hsl(var(--glass-border-subtle))]" />
              <button onClick={() => setShowRawPanel(!showRawPanel)}
                className={cn("p-2 rounded-xl transition-colors", showRawPanel ? "bg-primary/10 text-primary" : "bg-[hsl(var(--glass-bg-1))] text-muted-foreground hover:text-foreground")}
                title={showRawPanel ? "Paneli gizle" : "Paneli göster"}>
                {showRawPanel ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto px-6 py-4">
            {keywords.length === 0 ? (
              <div className="rounded-2xl glass-2 p-12 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-2xl bg-amber-500/10 mb-4">
                  <AlertCircle className="h-10 w-10 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Henüz Keyword Yok</h3>
                <p className="text-muted-foreground max-w-md mb-4">Sağdaki panelden keyword ekleyebilirsiniz.</p>
                <button onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white">
                  <RefreshCw className="h-4 w-4" /> Yenile
                </button>
              </div>
            ) : (
              <div className="rounded-2xl glass-2 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[hsl(var(--glass-bg-3))] border-b border-[hsl(var(--glass-border-subtle))]">
                      <tr>
                        <th className="px-3 py-3 text-center w-10">
                          <button onClick={selectedKeywords.size === filteredKeywords.length ? deselectAllKeywords : selectAllKeywords}>
                            {selectedKeywords.size === filteredKeywords.length && filteredKeywords.length > 0
                              ? <CheckSquare className="h-4 w-4 text-primary" />
                              : <Square className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Keyword</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase w-24">Hacim</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase w-20">KD</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase w-20">Rekabet</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase w-20">CPC</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase w-20">Intent</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase w-20">Fırsat</th>
                        <th className="px-3 py-3 text-center w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                      {filteredKeywords.map((kw, index) => (
                        <tr key={kw.id || index}
                          className={cn("group hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors",
                            selectedKeywords.has(kw.id || index) && "bg-primary/5")}>
                          <td className="px-3 py-2.5 text-center">
                            <button onClick={() => toggleKeywordSelection(kw.id || index)}>
                              {selectedKeywords.has(kw.id || index)
                                ? <CheckSquare className="h-4 w-4 text-primary" />
                                : <Square className="h-4 w-4 text-muted-foreground" />}
                            </button>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-medium text-foreground">{kw.keyword}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-foreground">
                            {kw.search_volume?.toLocaleString() || '-'}
                          </td>
                          <td className="px-3 py-2.5 text-center"><DifficultyBadge value={kw.keyword_difficulty} /></td>
                          <td className="px-3 py-2.5 text-center"><CompetitionBadge competition={kw.competition} /></td>
                          <td className="px-3 py-2.5 text-right">
                            {formatCpc(kw.cpc) ? <span className="text-emerald-400 font-medium">${formatCpc(kw.cpc)!.toFixed(2)}</span> : <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center"><IntentBadge intent={kw.search_intent} /></td>
                          <td className="px-3 py-2.5 text-center"><OpportunityBadge value={kw.opportunity_score} /></td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => navigator.clipboard.writeText(kw.keyword)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all" title="Kopyala">
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => removeKeywordFromMain(kw)} disabled={isDeletingKeyword === kw.id}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all" title="Sil">
                                {isDeletingKeyword === kw.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Raw Keywords */}
        <AnimatePresence>
          {showRawPanel && rawKeywords.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-l border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))] flex flex-col overflow-hidden"
            >
              {/* Panel Header */}
              <div className="p-4 border-b border-[hsl(var(--glass-border-subtle))] flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm">Diğer Kelimeler</span>
                    {aiCategorized && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary">AI</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{filteredRawKeywords.length}</span>
                </div>

                {/* Category Chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedCategory && (
                    <button onClick={() => { setSelectedCategory(null); setRawDisplayCount(5); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20">
                      <X className="h-3 w-3" /> Temizle
                    </button>
                  )}
                  {groupedKeywords.slice(0, 4).map((group) => {
                    const GroupIcon = getGroupIcon(group.icon);
                    const isSelected = selectedCategory === group.id;
                    return (
                      <button key={group.id} onClick={() => { setSelectedCategory(isSelected ? null : group.id); setRawDisplayCount(5); }}
                        className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all",
                          isSelected ? "bg-primary/20 text-primary ring-1 ring-primary/50" : "bg-[hsl(var(--glass-bg-3))] text-muted-foreground hover:text-foreground")}>
                        <GroupIcon className="h-3 w-3" />
                        {group.keywords.length}
                      </button>
                    );
                  })}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={rawSearchQuery}
                    onChange={(e) => { setRawSearchQuery(e.target.value); setRawDisplayCount(5); }}
                    placeholder="Ara..."
                    className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-xs focus:ring-1 focus:ring-primary/30"
                  />
                  {rawSearchQuery && (
                    <button onClick={() => { setRawSearchQuery(''); setRawDisplayCount(5); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* AI Button */}
                {!aiCategorized && (
                  <button onClick={runAiCategorization} disabled={isAiCategorizing}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
                    {isAiCategorizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isAiCategorizing ? 'Analiz ediliyor...' : 'AI ile Kategorile'}
                  </button>
                )}
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto">
                {filteredRawKeywords.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    {rawSearchQuery ? 'Sonuç bulunamadı' : 'Tüm kelimeler ana listede'}
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                      {filteredRawKeywords.slice(0, rawDisplayCount).map((kw, index) => {
                        const isAdding = isAddingKeyword === kw.keyword;
                        return (
                          <div key={kw.id || index} className="px-4 py-2.5 hover:bg-[hsl(var(--glass-bg-2))] transition-colors group">
                            <div className="flex items-center gap-2">
                              <button onClick={() => addKeywordToMain(kw)} disabled={isAdding}
                                className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 flex-shrink-0">
                                {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-foreground truncate">{kw.keyword}</div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{kw.search_volume?.toLocaleString() || '-'}</span>
                                  {kw.cpc && <span className="text-emerald-400">${Number(kw.cpc).toFixed(2)}</span>}
                                  {kw.competition && (
                                    <span className={cn(
                                      kw.competition === 'LOW' ? 'text-emerald-400' :
                                      kw.competition === 'HIGH' ? 'text-red-400' : 'text-amber-400'
                                    )}>{kw.competition}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Load More Button */}
                    {rawDisplayCount < filteredRawKeywords.length && (
                      <div className="p-4 border-t border-[hsl(var(--glass-border-subtle))]">
                        <button
                          onClick={() => setRawDisplayCount(prev => prev + 5)}
                          className="w-full py-2.5 rounded-xl bg-[hsl(var(--glass-bg-2))] hover:bg-[hsl(var(--glass-bg-3))] border border-[hsl(var(--glass-border-subtle))] text-sm font-medium text-foreground transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Daha Fazla Yükle
                          <span className="text-xs text-muted-foreground">
                            ({rawDisplayCount}/{filteredRawKeywords.length})
                          </span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sheets Modals */}
      <SheetsExportModal
        open={showSheetsExportModal}
        onOpenChange={setShowSheetsExportModal}
        projectId={projectId}
        clientId={project?.client_id ?? null}
        selectedKeywords={filteredKeywords.filter((kw, idx) => selectedKeywords.has(kw.id || idx))}
      />
      <SheetsAdvancedModal
        open={showSheetsAdvancedModal}
        onOpenChange={setShowSheetsAdvancedModal}
        clientId={project?.client_id ?? null}
        selectedKeywords={filteredKeywords.filter((kw, idx) => selectedKeywords.has(kw.id || idx))}
      />
    </div>
  );
}
