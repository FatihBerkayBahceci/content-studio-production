'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  Globe,
  TrendingUp,
  AlertCircle,
  Building2,
  CheckCircle2,
  Zap,
  Brain,
  Filter,
  Save,
  Wand2,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Plus,
  History,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  XCircle,
  Pause,
  Upload,
  FileSpreadsheet,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { api } from '@/lib/api/client';
import { useClientStore } from '@/lib/stores/client-store';

// LocalStorage key for persisting search state
const STORAGE_KEY = 'seo-keywords-search-state';

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

// Types
interface Client {
  id: number;
  name: string;
  website?: string;
}

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

interface BulkKeywordStatus {
  keyword: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  projectId?: number;
  keywordsFound?: number;
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

const MAX_BULK_KEYWORDS = 100;
const MAX_CONCURRENT_REQUESTS = 3;

// ============================================
// SUB-COMPONENTS
// ============================================

// Mode Toggle - Modern Segmented Control
interface ModeToggleProps {
  mode: 'single' | 'bulk' | 'import';
  onModeChange: (mode: 'single' | 'bulk' | 'import') => void;
  disabled?: boolean;
  bulkCount: number;
}

function ModeToggle({ mode, onModeChange, disabled, bulkCount }: ModeToggleProps) {
  const modes = [
    { id: 'single' as const, label: 'Tekli', icon: Search, description: 'Tek keyword ara' },
    { id: 'bulk' as const, label: 'Toplu', icon: Layers, description: 'Birden fazla keyword' },
    { id: 'import' as const, label: 'İçe Aktar', icon: Upload, description: 'CSV veya Excel' },
  ];

  return (
    <div className="inline-flex items-center gap-2 p-1 rounded-2xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;

        return (
          <motion.button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            disabled={disabled}
            className={cn(
              'relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-2))]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            whileHover={!disabled && !isActive ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            <Icon className={cn('h-4 w-4', isActive && 'text-white')} />
            <span>{m.label}</span>
            {m.id === 'bulk' && bulkCount > 0 && (
              <span className={cn(
                'px-2 py-0.5 rounded-md text-xs font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'
              )}>
                {bulkCount}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// Loading Overlay
interface LoadingOverlayProps {
  currentStep: number;
  currentTip: number;
}

function LoadingOverlay({ currentStep, currentTip }: LoadingOverlayProps) {
  const StepIcon = LOADING_STEPS[currentStep]?.icon || Loader2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 rounded-3xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />

      <div className="relative h-full flex flex-col items-center justify-center p-8">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <motion.div
            className="absolute inset-0 bg-primary/20 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 bg-primary/30 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />

          <motion.div
            className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-2xl shadow-primary/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            >
              <StepIcon className="h-10 w-10 text-white" />
            </motion.div>
          </motion.div>
        </div>

        {/* Step Label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-6"
          >
            <p className="text-xl font-semibold text-foreground">
              {LOADING_STEPS[currentStep]?.label}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Adım {currentStep + 1} / {LOADING_STEPS.length}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex items-center gap-2 mb-8">
          {LOADING_STEPS.map((_, index) => (
            <motion.div
              key={index}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index < currentStep
                  ? 'w-8 bg-primary'
                  : index === currentStep
                  ? 'w-8 bg-primary/60'
                  : 'w-2 bg-[hsl(var(--glass-bg-3))]'
              )}
              animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
        </div>

        {/* Tip */}
        <div className="max-w-sm">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
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
                    className="text-sm text-muted-foreground"
                  >
                    {TIPS[currentTip]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Recent Projects Bar
function RecentProjectsBar({ projects, isLoading }: { projects: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded-xl glass-1 p-4">
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-lg bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!projects.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl glass-1 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Son Projeler</span>
        </div>
        <Link href="/tool1" className="text-xs text-primary hover:underline flex items-center gap-1">
          Tümünü Gör
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-[hsl(var(--glass-border-subtle))]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[hsl(var(--glass-bg-2))] border-b border-[hsl(var(--glass-border-subtle))]">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Keyword</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Müşteri</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Sonuç</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, index) => (
              <tr
                key={project.id}
                className={cn(
                  'hover:bg-[hsl(var(--glass-bg-1))] transition-colors',
                  index !== projects.length - 1 && 'border-b border-[hsl(var(--glass-border-subtle))]'
                )}
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/keywords/${project.uuid || project.id}`}
                    className="text-foreground hover:text-primary transition-colors font-medium"
                  >
                    {project.main_keyword}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {project.client?.name || '-'}
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {project.total_keywords_found || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function KeywordsPage() {
  const router = useRouter();

  // Search state
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('TR');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<KeywordResearchResponse | null>(null);
  const [stateLoaded, setStateLoaded] = useState(false);

  // Client & Project state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Global store sync
  const setGlobalClientId = useClientStore((state) => state.setSelectedClientId);

  // Loading animation state
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Custom rules
  const [customRules, setCustomRules] = useState('');
  const [showRulesPanel, setShowRulesPanel] = useState(false);

  // Mode state
  const [inputMode, setInputMode] = useState<'single' | 'bulk' | 'import'>('single');
  const [bulkKeywords, setBulkKeywords] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<BulkKeywordStatus[]>([]);
  const [bulkCancelled, setBulkCancelled] = useState(false);
  const bulkCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse bulk keywords
  const parseBulkKeywords = (text: string): string[] => {
    return text
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(k => k.length >= 2)
      .slice(0, MAX_BULK_KEYWORDS);
  };

  const bulkKeywordList = useMemo(() => parseBulkKeywords(bulkKeywords), [bulkKeywords]);

  // Bulk stats
  const bulkStats = useMemo(() => {
    const completed = bulkStatus.filter(s => s.status === 'completed').length;
    const errors = bulkStatus.filter(s => s.status === 'error').length;
    const processing = bulkStatus.filter(s => s.status === 'processing').length;
    const pending = bulkStatus.filter(s => s.status === 'pending').length;
    const totalKeywords = bulkStatus.reduce((sum, s) => sum + (s.keywordsFound || 0), 0);
    return { completed, errors, processing, pending, totalKeywords };
  }, [bulkStatus]);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.results) setResults(state.results);
        if (state.createdProjectId) setCreatedProjectId(state.createdProjectId);
        if (state.selectedClientId) setSelectedClientId(state.selectedClientId);
        if (state.keyword) setKeyword(state.keyword);
      }
    } catch (err) {
      console.error('Failed to load saved state:', err);
    }
    setStateLoaded(true);
  }, []);

  // Sync client to global store
  useEffect(() => {
    if (selectedClientId) {
      setGlobalClientId(selectedClientId);
    }
  }, [selectedClientId, setGlobalClientId]);

  // Save state to localStorage
  useEffect(() => {
    if (!stateLoaded) return;
    const stateToSave = {
      results,
      createdProjectId,
      selectedClientId,
      keyword,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  }, [results, createdProjectId, selectedClientId, keyword, stateLoaded]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        if (data.success && data.projects) {
          setRecentProjects(data.projects.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [createdProjectId]);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        if (data.success && (data.data || data.clients)) {
          const clientList = data.data || data.clients;
          setClients(clientList);
          if (clientList.length > 0 && !selectedClientId) {
            setSelectedClientId(clientList[0].id);
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

  // Loading animation
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

  // Auto-trigger file input when import mode selected
  useEffect(() => {
    if (inputMode === 'import' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [inputMode]);

  // Handle search
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
      const projectUuid = projectData.project.uuid || projectId;
      setCreatedProjectId(projectId);

      const response = await api.post<KeywordResearchResponse>('/keyword-research', {
        keyword: keywordToSearch.trim(),
        country: country,
        language: country === 'TR' ? 'tr' : 'en',
        project_id: projectId,
        client_id: selectedClientId,
        custom_rules: customRules.trim() || undefined,
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

            const fallbackData = {
              projectId: projectId,
              projectUuid: projectUuid,
              keywords: response.keywords,
              stats: response.stats,
              savedAt: Date.now(),
            };
            localStorage.setItem(`keywords-fallback-${projectUuid}`, JSON.stringify(fallbackData));
          } catch (e) {
            console.error('Failed to update project status:', e);
          }

          router.push(`/keywords/${projectUuid}`);
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

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  // Process single keyword in bulk
  const processKeyword = async (kw: string): Promise<BulkKeywordStatus> => {
    try {
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

      const response = await api.post<KeywordResearchResponse>('/keyword-research', {
        keyword: kw,
        country: country,
        language: country === 'TR' ? 'tr' : 'en',
        project_id: projectId,
        client_id: selectedClientId,
        custom_rules: customRules.trim() || undefined,
      }, { timeout: 300000 });

      if (response.success && response.keywords?.length) {
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

  // Bulk search
  const handleBulkSearch = async () => {
    if (isBulkProcessing || bulkKeywordList.length === 0 || !selectedClientId) return;

    setIsBulkProcessing(true);
    setBulkCancelled(false);
    bulkCancelledRef.current = false;
    setResults(null);
    setError(null);

    const initialStatus: BulkKeywordStatus[] = bulkKeywordList.map(kw => ({
      keyword: kw,
      status: 'pending',
    }));
    setBulkStatus(initialStatus);

    const queue = [...bulkKeywordList];
    const processing: Promise<void>[] = [];

    const processNext = async () => {
      if (bulkCancelledRef.current || queue.length === 0) return;

      const kw = queue.shift()!;

      setBulkStatus(prev => prev.map(s =>
        s.keyword === kw ? { ...s, status: 'processing' } : s
      ));

      const result = await processKeyword(kw);

      setBulkStatus(prev => prev.map(s =>
        s.keyword === kw ? result : s
      ));

      if (!bulkCancelledRef.current && queue.length > 0) {
        await processNext();
      }
    };

    for (let i = 0; i < Math.min(MAX_CONCURRENT_REQUESTS, bulkKeywordList.length); i++) {
      processing.push(processNext());
    }

    await Promise.all(processing);

    setIsBulkProcessing(false);

    const response = await fetch('/api/projects');
    const data = await response.json();
    if (data.success && data.projects) {
      setRecentProjects(data.projects.slice(0, 6));
    }
  };

  // Cancel bulk
  const handleCancelBulk = () => {
    setBulkCancelled(true);
    bulkCancelledRef.current = true;
  };

  // File import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setInputMode('single');
      return;
    }

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isExcel) {
      setError('Sadece CSV veya Excel (.xlsx, .xls) dosyaları destekleniyor');
      setInputMode('single');
      return;
    }

    try {
      if (isCSV) {
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        const keywords: string[] = [];

        for (const line of lines) {
          const cells = line.split(/[,;]/);
          const firstCell = cells[0]?.trim();
          if (firstCell && firstCell.length >= 2 &&
              !firstCell.toLowerCase().includes('keyword') &&
              !firstCell.toLowerCase().includes('anahtar')) {
            keywords.push(firstCell);
          }
        }

        if (keywords.length === 0) {
          setError('Dosyada geçerli keyword bulunamadı');
          setInputMode('single');
          return;
        }

        const uniqueKeywords = Array.from(new Set(keywords)).slice(0, MAX_BULK_KEYWORDS);
        setBulkKeywords(uniqueKeywords.join('\n'));
        setInputMode('bulk');
      } else {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

        const keywords: string[] = [];
        for (const row of jsonData) {
          const firstCell = row[0]?.toString()?.trim();
          if (firstCell && firstCell.length >= 2 &&
              !firstCell.toLowerCase().includes('keyword') &&
              !firstCell.toLowerCase().includes('anahtar')) {
            keywords.push(firstCell);
          }
        }

        if (keywords.length === 0) {
          setError('Excel dosyasında geçerli keyword bulunamadı');
          setInputMode('single');
          return;
        }

        const uniqueKeywords = Array.from(new Set(keywords)).slice(0, MAX_BULK_KEYWORDS);
        setBulkKeywords(uniqueKeywords.join('\n'));
        setInputMode('bulk');
      }
    } catch (err: any) {
      console.error('File import error:', err);
      setError('Dosya okunamadı: ' + (err.message || 'Bilinmeyen hata'));
      setInputMode('single');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <PageTransition className="min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-orange-500/6 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 text-center font-sans">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-sans">
              Keyword Research
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Main Search Card */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="relative rounded-3xl glass-2 p-8 md:p-10 overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Top Highlight */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {/* Mode Toggle */}
            <div className="flex justify-center mb-8">
              <ModeToggle
                mode={inputMode}
                onModeChange={setInputMode}
                disabled={isLoading || isBulkProcessing}
                bulkCount={bulkKeywordList.length}
              />
            </div>

            {/* Client & Country Selection */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              {/* Client Selector */}
              {isLoadingClients ? (
                <div className="h-12 w-48 rounded-xl bg-muted/20 animate-pulse" />
              ) : clients.length === 0 ? (
                <Link
                  href="/clients/new"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Müşteri Ekle
                </Link>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
                    <Building2 className="h-4 w-4 text-primary" />
                    <select
                      value={selectedClientId || ''}
                      onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
                      className="appearance-none bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer pr-6 min-w-[150px] [&>option]:bg-zinc-900 [&>option]:text-white"
                      disabled={isLoading || isBulkProcessing}
                    >
                      <option value="">Müşteri seç...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Country Selector */}
              <div className="relative">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
                  <span className="text-lg">{countries.find(c => c.code === country)?.flag}</span>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="appearance-none bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer pr-6 [&>option]:bg-zinc-900 [&>option]:text-white"
                    disabled={isLoading || isBulkProcessing}
                  >
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />

            {/* Input Area */}
            <AnimatePresence mode="wait">
              {inputMode === 'single' ? (
                <motion.div
                  key="single"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/10">
                      <Search className="h-5 w-5 text-primary" />
                    </div>
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Hedef keyword'ünüzü yazın..."
                      className="w-full pl-16 pr-6 py-4 rounded-xl bg-[hsl(var(--glass-bg-1))] border-2 border-[hsl(var(--glass-border-subtle))] text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="bulk"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <textarea
                    value={bulkKeywords}
                    onChange={(e) => setBulkKeywords(e.target.value)}
                    placeholder={`Her satıra bir keyword yazın (max ${MAX_BULK_KEYWORDS})...\n\ndijital pazarlama\nseo optimizasyonu\ne-ticaret sitesi`}
                    className="w-full h-40 p-4 rounded-xl bg-[hsl(var(--glass-bg-1))] border-2 border-[hsl(var(--glass-border-subtle))] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                    disabled={isBulkProcessing}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {bulkKeywordList.length} keyword tanımlandı
                      </span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isBulkProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--glass-bg-3))] hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground transition-colors"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Dosya Ekle
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Button */}
            {inputMode === 'single' ? (
              <motion.button
                onClick={() => handleSearch()}
                disabled={isLoading || !keyword.trim() || !selectedClientId}
                className="group w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    Keyword Analiz Et
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                onClick={handleBulkSearch}
                disabled={isBulkProcessing || bulkKeywordList.length === 0 || !selectedClientId}
                className="group w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isBulkProcessing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Layers className="h-5 w-5" />
                    {bulkKeywordList.length} Keyword Araştır
                  </>
                )}
              </motion.button>
            )}

            {/* Custom Rules Panel */}
            <div className="mt-6">
              <button
                onClick={() => setShowRulesPanel(!showRulesPanel)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>AI Kuralları</span>
                <span className="text-xs text-muted-foreground">(Opsiyonel)</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  showRulesPanel && "rotate-180"
                )} />
                {customRules.trim() && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    Aktif
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showRulesPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-4 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
                      <div className="flex items-start gap-2 mb-3">
                        <Brain className="h-4 w-4 text-purple-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">AI Seçim Kuralları</p>
                          <p className="text-xs text-muted-foreground">
                            Doğal dilde kurallar yazın. AI keyword seçerken bu kurallara uyacaktır.
                          </p>
                        </div>
                      </div>
                      <textarea
                        value={customRules}
                        onChange={(e) => setCustomRules(e.target.value)}
                        placeholder="Örnek: Marka isimleri olmasın, sadece B2B odaklı keywordler..."
                        className="w-full h-24 p-3 rounded-lg bg-[hsl(var(--glass-bg-3))] border border-[hsl(var(--glass-border-subtle))] text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all resize-none"
                        disabled={isLoading || isBulkProcessing}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk Progress */}
            <AnimatePresence>
              {(isBulkProcessing || (bulkStatus.length > 0 && bulkStats.completed > 0)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))] p-4"
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
                          {isBulkProcessing ? 'İşlem Devam Ediyor' : 'Tamamlandı'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {bulkStats.completed + bulkStats.errors}/{bulkStatus.length} keyword
                          {bulkStats.totalKeywords > 0 && ` • ${bulkStats.totalKeywords} toplam`}
                        </p>
                      </div>
                    </div>
                    {isBulkProcessing ? (
                      <button
                        onClick={handleCancelBulk}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                      >
                        <Pause className="h-4 w-4" />
                        Durdur
                      </button>
                    ) : (
                      <button
                        onClick={() => setBulkStatus([])}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--glass-bg-3))] text-muted-foreground hover:text-foreground transition-colors text-sm"
                      >
                        <XCircle className="h-4 w-4" />
                        Kapat
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 rounded-full bg-[hsl(var(--glass-bg-3))] overflow-hidden mb-4">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((bulkStats.completed + bulkStats.errors) / bulkStatus.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Keyword List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bulkStatus.map((item, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg text-sm",
                          item.status === 'completed' ? "bg-emerald-500/5" :
                          item.status === 'error' ? "bg-red-500/5" :
                          item.status === 'processing' ? "bg-primary/5" :
                          "bg-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {item.status === 'pending' && <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                          {item.status === 'processing' && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />}
                          {item.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                          {item.status === 'error' && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                          <span className={cn(
                            item.status === 'completed' ? "text-foreground" :
                            item.status === 'error' ? "text-red-400" :
                            "text-muted-foreground"
                          )}>
                            {item.keyword}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'completed' && item.keywordsFound && (
                            <span className="text-xs text-emerald-400">{item.keywordsFound} kw</span>
                          )}
                          {item.status === 'completed' && item.projectId && (
                            <Link
                              href={`/keywords/${item.projectId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              Görüntüle
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Completed Actions */}
                  {!isBulkProcessing && bulkStats.completed > 0 && (
                    <div className="mt-4 pt-4 border-t border-[hsl(var(--glass-border-subtle))]">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setBulkKeywords('');
                            setBulkStatus([]);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--glass-bg-3))] text-muted-foreground hover:text-foreground transition-colors text-sm"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Yeni İşlem
                        </button>
                        <Link
                          href="/tool1"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                        >
                          Projeleri Gör
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <LoadingOverlay currentStep={currentStep} currentTip={currentTip} />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <RecentProjectsBar projects={recentProjects} isLoading={isLoadingProjects} />
        </div>
      </section>
    </PageTransition>
  );
}
