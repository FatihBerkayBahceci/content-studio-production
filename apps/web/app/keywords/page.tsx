'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// LocalStorage key for persisting search state
const STORAGE_KEY = 'seo-keywords-search-state';
import {
  Search,
  Loader2,
  Download,
  FileText,
  Globe,
  TrendingUp,
  Target,
  BarChart3,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  Database,
  Zap,
  Brain,
  Filter,
  Save,
  Wand2,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Plus,
  History,
  Star,
  ExternalLink,
  Copy,
  MoreHorizontal,
  Trash2,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowUpDown,
  Layers,
  XCircle,
  Pause,
  Upload,
  FileSpreadsheet,
  Tag,
  Ruler,
  DollarSign,
  HelpCircle,
  Package,
  GitCompare,
} from 'lucide-react';
import { groupKeywords, KeywordGroup, KeywordResult as GroupKeywordResult } from '@/lib/keyword-grouping';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition, staggerContainer, staggerItem } from '@/components/motion';
import { api } from '@/lib/api/client';
import { useClientStore } from '@/lib/stores/client-store';

// Loading steps configuration
const LOADING_STEPS = [
  { id: 'project', icon: Building2, label: 'Proje oluşturuluyor...', duration: 2000 },
  { id: 'suggestions', icon: TrendingUp, label: 'Google Suggestions sorgulanıyor...', duration: 4000 },
  { id: 'dataforseo', icon: Globe, label: 'DataForSEO ile keyword verisi çekiliyor...', duration: 8000 },
  { id: 'merge', icon: Filter, label: 'Keywordler birleştiriliyor ve temizleniyor...', duration: 3000 },
  { id: 'ai_select', icon: Brain, label: 'AI en iyi keywordleri seçiyor...', duration: 6000 },
  { id: 'enrich', icon: Wand2, label: 'Keywordler zenginleştiriliyor...', duration: 5000 },
  { id: 'save', icon: Save, label: 'Veritabanına kaydediliyor...', duration: 2000 },
];

const TIPS = [
  'Uzun kuyruk keywordler genellikle daha düşük rekabet sunar',
  'Search intent analizi, içerik stratejinizi güçlendirir',
  'Kümeleme (clustering) ile topic authority oluşturabilirsiniz',
  'Düşük hacimli keywordler daha hızlı sıralama şansı verir',
  'Her keyword için ayrı içerik yerine topic cluster yaklaşımı deneyin',
];

// Client type
interface Client {
  id: number;
  name: string;
  website?: string;
}

// Keyword result type from API
interface KeywordResult {
  keyword: string;
  source: string;
  search_volume?: number | null;
  competition?: string | null;
  competition_index?: number | null;
  cpc?: number | null;
  trend?: string | null;
  intent?: string | null;
  cluster?: string | null;
}

interface KeywordResearchResponse {
  success: boolean;
  message?: string;
  main_keyword?: string;
  project_id?: number | null;
  stats?: {
    total: number;
    from_google_ads: number;
    from_google_suggest: number;
    from_google_trends: number;
    from_dataforseo: number;
    approved?: number;
    rejected?: number;
    ai_parsed?: boolean;
  };
  keywords?: KeywordResult[];
  clusters?: Record<string, string[]>;
  saved_to_db?: number;
  ai_used?: boolean;
  error?: string;
}

// Country options
const countries = [
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

// Bulk operation types
interface BulkKeywordStatus {
  keyword: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  projectId?: number;
  keywordsFound?: number;
  error?: string;
}

const MAX_BULK_KEYWORDS = 100;
const MAX_CONCURRENT_REQUESTS = 3;

export default function KeywordsPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('TR');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<KeywordResearchResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'keyword' | 'volume' | 'cpc'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const tableRef = useRef<HTMLDivElement>(null);

  // Client & Project state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  // Global store for cross-page client sync (so /tool1 can see projects created here)
  const setGlobalClientId = useClientStore((state) => state.setSelectedClientId);

  // Loading animation state
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Bulk mode state
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [bulkKeywords, setBulkKeywords] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<BulkKeywordStatus[]>([]);
  const [bulkCancelled, setBulkCancelled] = useState(false);
  const bulkCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch recent projects directly from API (not n8n)
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Raw keywords for grouped view
  const [rawKeywords, setRawKeywords] = useState<GroupKeywordResult[]>([]);
  const [isLoadingRaw, setIsLoadingRaw] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set());
  const [stateLoaded, setStateLoaded] = useState(false);

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.results) setResults(state.results);
        if (state.createdProjectId) setCreatedProjectId(state.createdProjectId);
        if (state.rawKeywords) setRawKeywords(state.rawKeywords);
        if (state.selectedClientId) setSelectedClientId(state.selectedClientId);
        if (state.keyword) setKeyword(state.keyword);
      }
    } catch (err) {
      console.error('Failed to load saved state:', err);
    }
    setStateLoaded(true);
  }, []);

  // Sync selectedClientId to global store (so /tool1 page can see projects created here)
  useEffect(() => {
    if (selectedClientId) {
      setGlobalClientId(selectedClientId);
    }
  }, [selectedClientId, setGlobalClientId]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (!stateLoaded) return; // Don't save until initial load is complete

    const stateToSave = {
      results,
      createdProjectId,
      rawKeywords,
      selectedClientId,
      keyword,
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  }, [results, createdProjectId, rawKeywords, selectedClientId, keyword, stateLoaded]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        if (data.success && data.projects) {
          setRecentProjects(data.projects.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [createdProjectId]); // Refetch when new project created

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        if (data.success && data.clients) {
          setClients(data.clients);
          // Only set default if no persisted selection
          if (data.clients.length > 0 && !selectedClientId) {
            setSelectedClientId(data.clients[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setIsLoadingClients(false);
      }
    };
    if (stateLoaded) {
      fetchClients();
    }
  }, [stateLoaded]);

  // Loading animation effect
  useEffect(() => {
    if (isLoading) {
      setCurrentStep(0);
      setCurrentTip(Math.floor(Math.random() * TIPS.length));

      let stepIndex = 0;
      const advanceStep = () => {
        if (stepIndex < LOADING_STEPS.length - 1) {
          stepIndex++;
          setCurrentStep(stepIndex);
          loadingIntervalRef.current = setTimeout(advanceStep, LOADING_STEPS[stepIndex].duration);
        }
      };
      loadingIntervalRef.current = setTimeout(advanceStep, LOADING_STEPS[0].duration);

      tipIntervalRef.current = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length);
      }, 5000);
    } else {
      if (loadingIntervalRef.current) {
        clearTimeout(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
        tipIntervalRef.current = null;
      }
    }

    return () => {
      if (loadingIntervalRef.current) clearTimeout(loadingIntervalRef.current);
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    };
  }, [isLoading]);

  const handleSearch = async (searchKeyword?: string) => {
    const keywordToSearch = searchKeyword || keyword;

    if (isLoading) return;

    if (!keywordToSearch.trim() || keywordToSearch.trim().length < 2) {
      setError('Keyword en az 2 karakter olmalı');
      return;
    }

    if (!selectedClientId) {
      setError('Lütfen bir müşteri seçin');
      return;
    }

    if (searchKeyword) {
      setKeyword(searchKeyword);
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setCreatedProjectId(null);

    try {
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          name: `Keyword Research: ${keywordToSearch.trim()}`,
          main_keyword: keywordToSearch.trim(),
          target_country: country,
          target_language: country === 'TR' ? 'tr' : 'en',
        }),
      });
      const projectData = await projectResponse.json();

      if (!projectData.success || !projectData.project?.id) {
        throw new Error(projectData.error || 'Proje oluşturulamadı');
      }
      const projectId = projectData.project.id;
      setCreatedProjectId(projectId);

      const response = await api.post<KeywordResearchResponse>('/keyword-research', {
        keyword: keywordToSearch.trim(),
        country: country,
        language: country === 'TR' ? 'tr' : 'en',
        project_id: projectId,
        client_id: selectedClientId,
      }, { timeout: 300000 });

      if (response.success) {
        if (!response.keywords || !Array.isArray(response.keywords)) {
          const fixedResponse = response as any;
          if (fixedResponse.data?.keywords) {
            response.keywords = fixedResponse.data.keywords;
          } else if (fixedResponse.json?.keywords) {
            response.keywords = fixedResponse.json.keywords;
          }
        }
        setResults(response);

        // Update project status to 'keywords_discovered' and total_keywords_found
        if (response.keywords && response.keywords.length > 0) {
          try {
            await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'keywords_discovered',
                total_keywords_found: response.keywords.length,
              }),
            });

          } catch (e) {
            console.error('Failed to update project status:', e);
          }

          // Redirect to project detail page
          router.push(`/keywords/${projectId}`);
          return;
        }
      } else {
        setError(response.error || 'Bir hata oluştu');
      }
    } catch (err: any) {
      setError(err.message || 'API hatası');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  // Parse bulk keywords from textarea
  const parseBulkKeywords = (text: string): string[] => {
    return text
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(k => k.length >= 2)
      .slice(0, MAX_BULK_KEYWORDS);
  };

  const bulkKeywordList = useMemo(() => parseBulkKeywords(bulkKeywords), [bulkKeywords]);

  // Process single keyword in bulk mode
  const processKeyword = async (kw: string): Promise<BulkKeywordStatus> => {
    try {
      // Create project
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          name: `Keyword Research: ${kw}`,
          main_keyword: kw,
          target_country: country,
          target_language: country === 'TR' ? 'tr' : 'en',
        }),
      });
      const projectData = await projectResponse.json();

      if (!projectData.success || !projectData.project?.id) {
        throw new Error(projectData.error || 'Proje oluşturulamadı');
      }

      const projectId = projectData.project.id;

      // Run keyword research
      const response = await api.post<KeywordResearchResponse>('/keyword-research', {
        keyword: kw,
        country: country,
        language: country === 'TR' ? 'tr' : 'en',
        project_id: projectId,
        client_id: selectedClientId,
      }, { timeout: 300000 });

      if (response.success && response.keywords?.length) {
        // Update project status
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'keywords_discovered',
            total_keywords_found: response.keywords.length,
          }),
        });

        return {
          keyword: kw,
          status: 'completed',
          projectId,
          keywordsFound: response.keywords.length,
        };
      } else {
        throw new Error(response.error || 'Keyword bulunamadı');
      }
    } catch (err: any) {
      return {
        keyword: kw,
        status: 'error',
        error: err.message || 'Bilinmeyen hata',
      };
    }
  };

  // Bulk search with concurrency control
  const handleBulkSearch = async () => {
    if (isBulkProcessing || bulkKeywordList.length === 0 || !selectedClientId) return;

    setIsBulkProcessing(true);
    setBulkCancelled(false);
    bulkCancelledRef.current = false;
    setResults(null);
    setError(null);

    // Initialize status for all keywords
    const initialStatus: BulkKeywordStatus[] = bulkKeywordList.map(kw => ({
      keyword: kw,
      status: 'pending',
    }));
    setBulkStatus(initialStatus);

    // Process keywords with concurrency limit
    const queue = [...bulkKeywordList];
    const processing: Promise<void>[] = [];

    const processNext = async () => {
      if (bulkCancelledRef.current || queue.length === 0) return;

      const kw = queue.shift()!;

      // Update status to processing
      setBulkStatus(prev => prev.map(s =>
        s.keyword === kw ? { ...s, status: 'processing' } : s
      ));

      const result = await processKeyword(kw);

      // Update status with result
      setBulkStatus(prev => prev.map(s =>
        s.keyword === kw ? result : s
      ));

      // Process next in queue
      if (!bulkCancelledRef.current && queue.length > 0) {
        await processNext();
      }
    };

    // Start concurrent workers
    for (let i = 0; i < Math.min(MAX_CONCURRENT_REQUESTS, bulkKeywordList.length); i++) {
      processing.push(processNext());
    }

    await Promise.all(processing);

    setIsBulkProcessing(false);

    // Refresh recent projects
    const response = await fetch('/api/projects');
    const data = await response.json();
    if (data.success && data.projects) {
      setRecentProjects(data.projects.slice(0, 5));
    }
  };

  // Cancel bulk processing
  const handleCancelBulk = () => {
    setBulkCancelled(true);
    bulkCancelledRef.current = true;
  };

  // Handle file import (Excel/CSV)
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isExcel) {
      setError('Sadece CSV veya Excel (.xlsx, .xls) dosyaları destekleniyor');
      return;
    }

    try {
      if (isCSV) {
        // Parse CSV
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        const keywords: string[] = [];

        for (const line of lines) {
          // Handle both comma and semicolon separators
          const cells = line.split(/[,;]/);
          // Take first column as keyword (skip header if it looks like one)
          const firstCell = cells[0]?.trim();
          if (firstCell && firstCell.length >= 2 &&
              !firstCell.toLowerCase().includes('keyword') &&
              !firstCell.toLowerCase().includes('anahtar')) {
            keywords.push(firstCell);
          }
        }

        if (keywords.length === 0) {
          setError('Dosyada geçerli keyword bulunamadı');
          return;
        }

        const uniqueKeywords = Array.from(new Set(keywords)).slice(0, MAX_BULK_KEYWORDS);
        setBulkKeywords(uniqueKeywords.join('\n'));
        setInputMode('bulk');
      } else {
        // Parse Excel using SheetJS (xlsx)
        // Dynamic import to avoid bundling if not needed
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

        const keywords: string[] = [];
        for (const row of jsonData) {
          // Take first column
          const firstCell = row[0]?.toString()?.trim();
          if (firstCell && firstCell.length >= 2 &&
              !firstCell.toLowerCase().includes('keyword') &&
              !firstCell.toLowerCase().includes('anahtar')) {
            keywords.push(firstCell);
          }
        }

        if (keywords.length === 0) {
          setError('Excel dosyasında geçerli keyword bulunamadı');
          return;
        }

        const uniqueKeywords = Array.from(new Set(keywords)).slice(0, MAX_BULK_KEYWORDS);
        setBulkKeywords(uniqueKeywords.join('\n'));
        setInputMode('bulk');
      }
    } catch (err: any) {
      console.error('File import error:', err);
      setError('Dosya okunamadı: ' + (err.message || 'Bilinmeyen hata'));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Bulk stats
  const bulkStats = useMemo(() => {
    const completed = bulkStatus.filter(s => s.status === 'completed').length;
    const errors = bulkStatus.filter(s => s.status === 'error').length;
    const processing = bulkStatus.filter(s => s.status === 'processing').length;
    const pending = bulkStatus.filter(s => s.status === 'pending').length;
    const totalKeywords = bulkStatus.reduce((sum, s) => sum + (s.keywordsFound || 0), 0);
    return { completed, errors, processing, pending, totalKeywords };
  }, [bulkStatus]);

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let keywords = results?.keywords?.filter(kw =>
      !searchQuery || kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Sort
    keywords = [...keywords].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'volume':
          aVal = a.search_volume || 0;
          bVal = b.search_volume || 0;
          break;
        case 'cpc':
          aVal = a.cpc || 0;
          bVal = b.cpc || 0;
          break;
        default:
          aVal = a.keyword.toLowerCase();
          bVal = b.keyword.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return keywords;
  }, [results?.keywords, searchQuery, sortBy, sortOrder]);

  // Grouped raw keywords
  const groupedKeywords = useMemo(() => {
    return groupKeywords(rawKeywords);
  }, [rawKeywords]);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Toggle subgroup expansion
  const toggleSubgroup = (subgroupKey: string) => {
    setExpandedSubgroups(prev => {
      const next = new Set(prev);
      if (next.has(subgroupKey)) {
        next.delete(subgroupKey);
      } else {
        next.add(subgroupKey);
      }
      return next;
    });
  };

  // Fetch raw keywords when project is created
  const fetchRawKeywords = async (projectId: number) => {
    setIsLoadingRaw(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords-raw`);
      const data = await response.json();
      if (data.success && data.data) {
        setRawKeywords(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch raw keywords:', err);
    } finally {
      setIsLoadingRaw(false);
    }
  };

  // Get icon for group
  const getGroupIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'tag': <Tag className="h-4 w-4" />,
      'ruler': <Ruler className="h-4 w-4" />,
      'dollar-sign': <DollarSign className="h-4 w-4" />,
      'help-circle': <HelpCircle className="h-4 w-4" />,
      'package': <Package className="h-4 w-4" />,
      'git-compare': <GitCompare className="h-4 w-4" />,
    };
    return icons[iconName] || <Package className="h-4 w-4" />;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredKeywords.length) return;

    const headers = ['Keyword', 'Source', 'Search Volume', 'Competition', 'CPC', 'Intent', 'Cluster'];
    const rows = filteredKeywords.map(kw => [
      kw.keyword,
      kw.source,
      kw.search_volume || '',
      kw.competition || '',
      kw.cpc || '',
      kw.intent || '',
      kw.cluster || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${keyword}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!filteredKeywords.length) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Keyword Research - ${keyword}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f97316; color: white; padding: 12px 8px; text-align: left; }
          td { padding: 10px 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>Keyword Research Report</h1>
        <div class="meta">
          <strong>Ana Keyword:</strong> ${keyword}<br>
          <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}<br>
          <strong>Toplam Keyword:</strong> ${filteredKeywords.length}
        </div>
        <table>
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Kaynak</th>
              <th>Hacim</th>
              <th>Rekabet</th>
              <th>CPC</th>
              <th>Intent</th>
            </tr>
          </thead>
          <tbody>
            ${filteredKeywords.map(kw => `
              <tr>
                <td>${kw.keyword}</td>
                <td>${kw.source}</td>
                <td>${kw.search_volume?.toLocaleString() || '-'}</td>
                <td>${kw.competition || '-'}</td>
                <td>{kw.cpc ? '$' + Number(kw.cpc).toFixed(2) : '-'}</td>
                <td>${kw.intent || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-[120px]" />
        </div>

        <div className="px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-xl" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary to-orange-500">
                  <Search className="h-6 w-6 text-white" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Keyword Research</h1>
                <p className="text-muted-foreground">
                  Google Ads, Suggestions, Trends ve DataForSEO — tek aramayla
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Card */}
            <motion.div
              className="rounded-2xl glass-2 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Mode Toggle & Client Selection Row */}
              <div className="flex items-center justify-between mb-5">
                {/* Input Mode Toggle */}
                <div className="flex items-center gap-2 bg-[hsl(var(--glass-bg-3))] p-1 rounded-lg">
                  <button
                    onClick={() => setInputMode('single')}
                    disabled={isBulkProcessing}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      inputMode === 'single'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Search className="h-4 w-4" />
                    Tekli
                  </button>
                  <button
                    onClick={() => setInputMode('bulk')}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      inputMode === 'bulk'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Layers className="h-4 w-4" />
                    Toplu
                    <span className="px-1.5 py-0.5 rounded bg-primary/20 text-xs">
                      {inputMode === 'bulk' ? bulkKeywordList.length : 0}/{MAX_BULK_KEYWORDS}
                    </span>
                  </button>
                </div>

                {/* Client Selection */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Müşteri</span>
                  </div>
                  {isLoadingClients ? (
                    <div className="h-10 w-48 bg-muted/30 rounded-xl animate-pulse" />
                  ) : clients.length === 0 ? (
                    <Link href="/clients/new" className="text-sm text-primary hover:underline flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      Müşteri Ekle
                    </Link>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedClientId || ''}
                        onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
                        className={cn(
                          "appearance-none cursor-pointer",
                          "pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium",
                          "bg-[hsl(0,0%,8%)] text-white",
                          "border border-[hsl(0,0%,20%)] hover:border-primary/50",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                          "min-w-[220px] transition-all duration-200",
                          !selectedClientId && "text-gray-400"
                        )}
                      >
                        <option value="" className="bg-[hsl(0,0%,10%)] text-gray-400">Müşteri seçin...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id} className="bg-[hsl(0,0%,10%)] text-white py-2">
                            {client.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area - Single or Bulk */}
              {inputMode === 'single' ? (
                /* Single Keyword Input */
                <div className="relative mb-4">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/10">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ana keyword'ünüzü yazın..."
                    className="w-full pl-16 pr-36 py-4 rounded-xl bg-[hsl(var(--glass-bg-1))] border-2 border-[hsl(var(--glass-border-subtle))] text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-[hsl(var(--glass-bg-3))] border-none text-sm focus:ring-2 focus:ring-primary/50"
                      disabled={isLoading}
                    >
                      {countries.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSearch()}
                      disabled={isLoading || !keyword.trim() || !selectedClientId}
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Ara
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Bulk Keywords Input */
                <div className="mb-4">
                  <div className="relative">
                    <textarea
                      value={bulkKeywords}
                      onChange={(e) => setBulkKeywords(e.target.value)}
                      placeholder={`Her satıra bir keyword yazın (max ${MAX_BULK_KEYWORDS})...\n\ndijital pazarlama\nseo optimizasyonu\ne-ticaret sitesi\n...`}
                      className="w-full h-40 p-4 rounded-xl bg-[hsl(var(--glass-bg-1))] border-2 border-[hsl(var(--glass-border-subtle))] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                      disabled={isBulkProcessing}
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-[hsl(var(--glass-bg-3))] border-none text-sm focus:ring-2 focus:ring-primary/50"
                        disabled={isBulkProcessing}
                      >
                        {countries.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {bulkKeywordList.length} keyword tanımlandı
                      </span>
                      {/* File Import Button */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isBulkProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--glass-bg-3))] hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground transition-colors"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Excel/CSV İçe Aktar
                      </button>
                      {bulkKeywordList.length > 0 && (
                        <button
                          onClick={() => setBulkKeywords('')}
                          className="text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Temizle
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleBulkSearch}
                      disabled={isBulkProcessing || bulkKeywordList.length === 0 || !selectedClientId}
                      className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isBulkProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Layers className="h-4 w-4" />
                          {bulkKeywordList.length} Keyword Araştır
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                  >
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {results && results.keywords && results.keywords.length > 0 && createdProjectId && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <div>
                          <p className="text-emerald-400 font-medium">
                            {results.keywords.length} keyword bulundu ve kaydedildi
                          </p>
                          <p className="text-emerald-400/70 text-sm">
                            {clients.find(c => c.id === selectedClientId)?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/keywords/${results.project_id || createdProjectId}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                        >
                          Sonuçlara Git
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/tool1/${results.project_id || createdProjectId}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors"
                        >
                          Tam Pipeline
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bulk Processing Progress */}
              <AnimatePresence>
                {(isBulkProcessing || (bulkStatus.length > 0 && !isBulkProcessing && bulkStats.completed > 0)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 rounded-xl glass-2 p-6"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isBulkProcessing ? "bg-primary/10" : "bg-emerald-500/10"
                        )}>
                          {isBulkProcessing ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {isBulkProcessing ? 'Toplu İşlem Devam Ediyor' : 'Toplu İşlem Tamamlandı'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {bulkStats.completed + bulkStats.errors}/{bulkStatus.length} keyword işlendi
                            {bulkStats.totalKeywords > 0 && ` • ${bulkStats.totalKeywords} toplam keyword`}
                          </p>
                        </div>
                      </div>
                      {isBulkProcessing && (
                        <button
                          onClick={handleCancelBulk}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                        >
                          <Pause className="h-4 w-4" />
                          Durdur
                        </button>
                      )}
                      {!isBulkProcessing && (
                        <button
                          onClick={() => setBulkStatus([])}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--glass-bg-3))] text-muted-foreground hover:text-foreground transition-colors text-sm"
                        >
                          <XCircle className="h-4 w-4" />
                          Kapat
                        </button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-2 rounded-full bg-[hsl(var(--glass-bg-3))] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-orange-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${((bulkStats.completed + bulkStats.errors) / bulkStatus.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--glass-bg-3))]">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Bekliyor: {bulkStats.pending}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--glass-bg-3))]">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm text-muted-foreground">İşleniyor: {bulkStats.processing}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--glass-bg-3))]">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-sm text-muted-foreground">Tamamlandı: {bulkStats.completed}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--glass-bg-3))]">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-sm text-muted-foreground">Hata: {bulkStats.errors}</span>
                      </div>
                    </div>

                    {/* Keyword List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {bulkStatus.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            item.status === 'completed' ? "bg-emerald-500/5 border border-emerald-500/20" :
                            item.status === 'error' ? "bg-red-500/5 border border-red-500/20" :
                            item.status === 'processing' ? "bg-primary/5 border border-primary/20" :
                            "bg-[hsl(var(--glass-bg-3))] border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {item.status === 'pending' && (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                            {item.status === 'processing' && (
                              <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            )}
                            {item.status === 'completed' && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            )}
                            {item.status === 'error' && (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                            <span className={cn(
                              "font-medium",
                              item.status === 'completed' ? "text-foreground" :
                              item.status === 'error' ? "text-red-400" :
                              item.status === 'processing' ? "text-foreground" :
                              "text-muted-foreground"
                            )}>
                              {item.keyword}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {item.status === 'completed' && item.keywordsFound && (
                              <span className="text-sm text-emerald-400">
                                {item.keywordsFound} keyword
                              </span>
                            )}
                            {item.status === 'error' && item.error && (
                              <span className="text-sm text-red-400 truncate max-w-48">
                                {item.error}
                              </span>
                            )}
                            {item.status === 'completed' && item.projectId && (
                              <Link
                                href={`/keywords/${item.projectId}`}
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                Görüntüle
                                <ChevronRight className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Completed Actions */}
                    {!isBulkProcessing && bulkStats.completed > 0 && (
                      <div className="mt-4 pt-4 border-t border-[hsl(var(--glass-border-subtle))]">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {bulkStats.completed} proje başarıyla oluşturuldu
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setBulkKeywords('');
                                setBulkStatus([]);
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--glass-bg-3))] text-muted-foreground hover:text-foreground transition-colors text-sm"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Yeni Toplu İşlem
                            </button>
                            <Link
                              href="/tool1"
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                            >
                              Tüm Projeleri Gör
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Loading State */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative rounded-2xl glass-2 p-8 md:p-12 overflow-hidden"
                >
                  {/* Main Loading Animation */}
                  <div className="flex flex-col items-center justify-center mb-8">
                    <div className="relative mb-6">
                      <motion.div
                        className="absolute inset-0 bg-primary/20 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-primary/30 rounded-full"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                      />
                      <motion.div
                        className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      >
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        >
                          {(() => {
                            const StepIcon = LOADING_STEPS[currentStep].icon;
                            return <StepIcon className="h-9 w-9 text-white" />;
                          })()}
                        </motion.div>
                      </motion.div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <p className="text-lg font-semibold text-foreground mb-1">
                          {LOADING_STEPS[currentStep].label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Adım {currentStep + 1} / {LOADING_STEPS.length}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Progress Steps */}
                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="flex items-center justify-between">
                      {LOADING_STEPS.map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                          <div key={step.id} className="flex items-center">
                            <motion.div
                              className={cn(
                                'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
                                isCompleted && 'bg-primary text-white',
                                isActive && 'bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 ring-offset-[hsl(var(--glass-bg-2))]',
                                !isCompleted && !isActive && 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground'
                              )}
                              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <StepIcon className="h-5 w-5" />
                              )}
                            </motion.div>
                            {index < LOADING_STEPS.length - 1 && (
                              <div className="w-6 md:w-12 h-0.5 mx-1">
                                <motion.div
                                  className="h-full bg-primary rounded-full origin-left"
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                                  transition={{ duration: 0.3 }}
                                />
                                <div className="h-full -mt-0.5 bg-[hsl(var(--glass-border-subtle))] rounded-full" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="max-w-xl mx-auto">
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                            SEO İpucu
                          </p>
                          <AnimatePresence mode="wait">
                            <motion.p
                              key={currentTip}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.4 }}
                              className="text-sm text-muted-foreground"
                            >
                              {TIPS[currentTip]}
                            </motion.p>
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>



            {/* Empty State */}
            {!results && !isLoading && !error && (
              <motion.div
                className="rounded-2xl glass-2 p-12 flex flex-col items-center justify-center text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                  <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-orange-500/10 border border-primary/20">
                    <Search className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Keyword Araştırmasına Başla</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Yukarıdaki arama kutusuna ana keyword'ünüzü yazın. Google Ads, Suggestions, Trends ve DataForSEO verilerini tek seferde çekeceğiz.
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-primary" />
                    Hızlı sonuç
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-emerald-400" />
                    Otomatik kayıt
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Brain className="h-4 w-4 text-purple-400" />
                    AI filtreleme
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Projects */}
            <motion.div
              className="rounded-2xl glass-2 p-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Son Projeler
                </h3>
                <Link href="/tool1" className="text-xs text-primary hover:underline">
                  Tümü
                </Link>
              </div>

              {isLoadingProjects ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="space-y-2">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/keywords/${project.uuid || project.id}`}
                      className="group block p-3 rounded-xl hover:bg-[hsl(var(--glass-bg-interactive))] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {project.main_keyword}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {project.total_keywords_found || 0} keyword
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Henüz proje yok
                </p>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="rounded-2xl glass-2 p-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Hızlı İşlemler
              </h3>
              <div className="space-y-2">
                <Link
                  href="/tool1/new"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[hsl(var(--glass-bg-interactive))] transition-all group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      Yeni Proje
                    </p>
                    <p className="text-xs text-muted-foreground">Detaylı araştırma</p>
                  </div>
                </Link>
                <Link
                  href="/clients"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[hsl(var(--glass-bg-interactive))] transition-all group"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      Müşteriler
                    </p>
                    <p className="text-xs text-muted-foreground">{clients.length} müşteri</p>
                  </div>
                </Link>
                <Link
                  href="/tool1"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[hsl(var(--glass-bg-interactive))] transition-all group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      Tüm Projeler
                    </p>
                    <p className="text-xs text-muted-foreground">Araştırma geçmişi</p>
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Pro Tips */}
            <motion.div
              className="rounded-2xl bg-gradient-to-br from-primary/10 to-orange-500/10 border border-primary/20 p-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Pro İpucu</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Long-tail keywordler genellikle daha düşük rekabet ve daha yüksek dönüşüm oranı sunar. 3+ kelimelik aramaları deneyin.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'primary' | 'cyan';
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    primary: 'text-primary bg-primary/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  };

  return (
    <div className="rounded-xl glass-1 p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('p-1.5 rounded-lg', colors[color])}>
          <Icon className={cn('h-3.5 w-3.5', colors[color].split(' ')[0])} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value.toLocaleString()}</p>
    </div>
  );
}

// Source Badge Component
function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    'google_ads': 'bg-blue-500/20 text-blue-400',
    'google_suggestions': 'bg-emerald-500/20 text-emerald-400',
    'google_trends': 'bg-purple-500/20 text-purple-400',
    'dataforseo': 'bg-amber-500/20 text-amber-400',
  };

  const labels: Record<string, string> = {
    'google_ads': 'Ads',
    'google_suggestions': 'Suggest',
    'google_trends': 'Trends',
    'dataforseo': 'DFS',
  };

  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded text-xs font-medium',
      colors[source] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground'
    )}>
      {labels[source] || source}
    </span>
  );
}

// Competition Badge Component
function CompetitionBadge({ competition }: { competition?: string | null }) {
  if (!competition) return <span className="text-muted-foreground text-xs">-</span>;

  const colors: Record<string, string> = {
    'LOW': 'bg-emerald-500/20 text-emerald-400',
    'MEDIUM': 'bg-amber-500/20 text-amber-400',
    'HIGH': 'bg-red-500/20 text-red-400',
  };

  const labels: Record<string, string> = {
    'LOW': 'Düşük',
    'MEDIUM': 'Orta',
    'HIGH': 'Yüksek',
  };

  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded text-xs font-medium',
      colors[competition.toUpperCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground'
    )}>
      {labels[competition.toUpperCase()] || competition}
    </span>
  );
}

// Intent Badge Component
function IntentBadge({ intent }: { intent?: string | null }) {
  if (!intent) return <span className="text-muted-foreground text-xs">-</span>;

  const colors: Record<string, string> = {
    'informational': 'bg-blue-500/20 text-blue-400',
    'transactional': 'bg-emerald-500/20 text-emerald-400',
    'commercial': 'bg-purple-500/20 text-purple-400',
    'navigational': 'bg-amber-500/20 text-amber-400',
  };

  const labels: Record<string, string> = {
    'informational': 'Info',
    'transactional': 'Trans',
    'commercial': 'Comm',
    'navigational': 'Nav',
  };

  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded text-xs font-medium',
      colors[intent.toLowerCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground'
    )}>
      {labels[intent.toLowerCase()] || intent}
    </span>
  );
}

// Difficulty Badge Component
function DifficultyBadge({ value }: { value?: number | null }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground text-xs">-</span>;

  const getColor = () => {
    if (value <= 30) return 'bg-emerald-500/20 text-emerald-400';
    if (value <= 60) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', getColor())}>
      {value}
    </span>
  );
}

// Opportunity Badge Component
function OpportunityBadge({ value }: { value?: number | null }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground text-xs">-</span>;

  const getColor = () => {
    if (value >= 70) return 'bg-emerald-500/20 text-emerald-400';
    if (value >= 40) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', getColor())}>
      {value}
    </span>
  );
}
