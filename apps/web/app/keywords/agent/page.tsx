'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  CheckCircle,
  Zap,
  Brain,
  Filter,
  ChevronDown,
  ChevronRight,
  History,
  Sparkles,
  Settings2,
  Copy,
  Download,
  FileSpreadsheet,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Database,
  Trash2,
  CheckSquare,
  Square,
  Check,
  RefreshCw,
  Tag,
  Ruler,
  DollarSign,
  HelpCircle,
  GitCompare,
  Package,
  Car,
  Star,
  Heart,
  Shield,
  Clock,
  MapPin,
  Users,
  ShoppingCart,
  Settings,
  Target,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { api } from '@/lib/api/client';
import { useClientStore } from '@/lib/stores/client-store';
import { groupKeywords } from '@/lib/keyword-grouping';
import { SheetsExportModal, SheetsAdvancedModal } from '@/components/sheets';

// ============================================
// TYPES
// ============================================

interface Client {
  id: number;
  name: string;
  website?: string;
  logo_url?: string;
}

interface KeywordResult {
  id?: number;
  keyword: string;
  seed_keyword?: string | null;
  source?: string;
  search_volume?: number | null;
  keyword_difficulty?: number | null;
  competition?: string | null;
  cpc?: number | null;
  search_intent?: string | null;
  trend?: 'up' | 'down' | 'stable' | null;
  status?: 'approved' | 'rejected' | 'pending' | null;
  cluster?: string | null;
  priority?: string | null;
  content_type?: string | null;
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
    from_dataforseo: number;
    approved?: number;
    rejected?: number;
  };
  keywords?: KeywordResult[];
  excluded?: KeywordResult[];
  raw_keywords?: KeywordResult[];
  error?: string;
}

interface RecentProject {
  id: number;
  uuid: string;
  main_keyword: string;
  client?: { name: string };
  total_keywords_found?: number;
  created_at: string;
  seed_keywords?: string | string[];
}

interface AICategory {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
  description?: string;
}

// ============================================
// CONSTANTS
// ============================================

const LANGUAGES = [
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
];

const REGIONS = [
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

const LOADING_STEPS = [
  { label: 'Proje oluşturuluyor...', duration: 2000 },
  { label: 'Google Suggestions sorgulanıyor...', duration: 4000 },
  { label: 'DataForSEO ile keyword verisi çekiliyor...', duration: 8000 },
  { label: 'Keywordler birleştiriliyor...', duration: 3000 },
  { label: 'AI en iyi keywordleri seçiyor...', duration: 6000 },
  { label: 'Sonuçlar kaydediliyor...', duration: 2000 },
];

const BULK_LOADING_STEPS = [
  { label: 'Bulk proje oluşturuluyor...', duration: 2000 },
  { label: 'DataForSEO bulk sorgusu yapılıyor...', duration: 15000 },
  { label: 'Google Suggestions paralel çekiliyor...', duration: 20000 },
  { label: 'Tüm keywordler birleştiriliyor...', duration: 5000 },
  { label: 'AI chunk analizi yapılıyor (1/3)...', duration: 30000 },
  { label: 'AI chunk analizi yapılıyor (2/3)...', duration: 30000 },
  { label: 'AI chunk analizi yapılıyor (3/3)...', duration: 30000 },
  { label: 'Sonuçlar veritabanına kaydediliyor...', duration: 10000 },
  { label: 'Tamamlanıyor...', duration: 3000 },
];

// Turkish character normalization
const turkishCharMap: { [key: string]: string } = {
  'ı': 'i', 'İ': 'i', 'ğ': 'g', 'Ğ': 'g',
  'ü': 'u', 'Ü': 'u', 'ş': 's', 'Ş': 's',
  'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c'
};

function normalizeKeyword(keyword: string): string {
  let normalized = keyword.toLowerCase().trim();
  for (const [turkish, ascii] of Object.entries(turkishCharMap)) {
    normalized = normalized.replace(new RegExp(turkish, 'g'), ascii);
  }
  return normalized.replace(/\s+/g, ' ');
}

// ============================================
// BADGE COMPONENTS
// ============================================

function DifficultyBadge({ value }: { value?: number | null }) {
  if (value === undefined || value === null) return <span className="text-zinc-500">-</span>;

  const getColor = () => {
    if (value <= 30) return 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50';
    if (value <= 60) return 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50';
    return 'bg-red-900/30 text-red-400 border-red-900/50';
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border tabular-nums', getColor())}>
      {value}
    </span>
  );
}

function IntentBadge({ intent }: { intent?: string | null }) {
  if (!intent) return <span className="text-zinc-500">-</span>;

  const colors: Record<string, string> = {
    'informational': 'bg-teal-900/30 text-teal-300 border-teal-900/50',
    'transactional': 'bg-emerald-900/30 text-emerald-300 border-emerald-900/50',
    'commercial': 'bg-blue-900/30 text-blue-300 border-blue-900/50',
    'navigational': 'bg-amber-900/30 text-amber-300 border-amber-900/50',
    'investigation': 'bg-purple-900/30 text-purple-300 border-purple-900/50',
  };

  const labels: Record<string, string> = {
    'informational': 'Info',
    'transactional': 'Trans',
    'commercial': 'Comm',
    'navigational': 'Nav',
    'investigation': 'Invest',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      colors[intent.toLowerCase()] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
    )}>
      {labels[intent.toLowerCase()] || intent}
    </span>
  );
}

function TrendIndicator({ trend }: { trend?: 'up' | 'down' | 'stable' | null }) {
  if (!trend) return <div className="h-6 w-8" />;

  const icons = {
    up: <ArrowUpRight className="h-4 w-4 text-emerald-400" />,
    down: <ArrowDownRight className="h-4 w-4 text-red-400" />,
    stable: <Minus className="h-4 w-4 text-zinc-500" />,
  };

  return <div className="flex items-center justify-end">{icons[trend]}</div>;
}

// ============================================
// SUB-COMPONENTS
// ============================================

function ModeToggle({
  mode,
  onModeChange,
  onImportClick,
  disabled,
}: {
  mode: 'single' | 'bulk';
  onModeChange: (mode: 'single' | 'bulk') => void;
  onImportClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-sm p-1 rounded-lg flex text-xs font-medium border border-white/[0.05]">
      <button
        onClick={() => onModeChange('single')}
        disabled={disabled}
        className={cn(
          'px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5',
          mode === 'single' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'
        )}
      >
        <Search className="h-3 w-3" />
        Tekli
      </button>
      <button
        onClick={() => onModeChange('bulk')}
        disabled={disabled}
        className={cn(
          'px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5',
          mode === 'bulk' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'
        )}
      >
        <Database className="h-3 w-3" />
        Toplu
      </button>
      <button
        onClick={onImportClick}
        disabled={disabled}
        className={cn(
          'px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-zinc-500 hover:text-white hover:bg-white/5'
        )}
      >
        <Upload className="h-3 w-3" />
        İçe Aktar
      </button>
    </div>
  );
}

function LoadingOverlay({
  currentStep,
  totalSteps,
  stepLabel,
  isBulk = false,
}: {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  isBulk?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 rounded-lg overflow-hidden bg-black/60 backdrop-blur-md flex flex-col items-center justify-center"
    >
      <div className="relative mb-6">
        <motion.div
          className="absolute inset-0 bg-primary/20 rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="h-7 w-7 text-white" />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-sm font-medium text-white mb-2"
        >
          {stepLabel}
        </motion.p>
      </AnimatePresence>

      <p className="text-xs text-zinc-500 mb-4">Adım {currentStep + 1} / {totalSteps}</p>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index < currentStep ? 'w-6 bg-primary' : index === currentStep ? 'w-6 bg-primary/60' : 'w-1.5 bg-zinc-700'
            )}
            animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Client Dropdown with Logos
function ClientDropdown({
  clients,
  selectedClientId,
  onSelect,
  isLoading,
  disabled
}: {
  clients: Client[];
  selectedClientId: number | null;
  onSelect: (id: number | null) => void;
  isLoading: boolean;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className="mb-5">
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Client</label>
        <div className="h-10 w-full rounded-lg bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="mb-5">
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Client</label>
        <Link href="/clients/new" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-sm">
          <Plus className="h-4 w-4" />Add Client
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-5" ref={dropdownRef}>
      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Client</label>
      <div className="relative">
        {/* Selected Client Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-left transition-all',
            isOpen && 'ring-1 ring-primary border-primary',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {selectedClient ? (
            <>
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05] flex items-center justify-center">
                {selectedClient.logo_url ? (
                  <img src={selectedClient.logo_url} alt={selectedClient.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-zinc-400">{selectedClient.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-sm text-white truncate flex-1">{selectedClient.name}</span>
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-500">Select client...</span>
            </>
          )}
          <ChevronDown className={cn('h-4 w-4 text-zinc-500 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 top-full left-0 right-0 mt-1 py-1 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-white/[0.1] shadow-xl max-h-64 overflow-y-auto"
            >
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => { onSelect(client.id); setIsOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition-colors',
                    selectedClientId === client.id && 'bg-primary/10'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05] flex items-center justify-center">
                    {client.logo_url ? (
                      <img src={client.logo_url} alt={client.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-zinc-400">{client.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">{client.name}</p>
                    {client.website && <p className="text-xs text-zinc-500 truncate">{client.website}</p>}
                  </div>
                  {selectedClientId === client.id && (
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RecentProjectsPanel({
  projects,
  isLoading,
  onSelectProject,
  activeProjectId
}: {
  projects: RecentProject[];
  isLoading: boolean;
  onSelectProject: (project: RecentProject) => void;
  activeProjectId?: number | null;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl p-5 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!projects.length) return null;

  return (
    <div className="hidden lg:block rounded-xl p-5 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Recent Projects</h3>
      <ul className="space-y-3">
        {projects.slice(0, 5).map((project) => {
          const isActive = activeProjectId === project.id;
          return (
            <li key={project.id}>
              <button
                onClick={() => onSelectProject(project)}
                className={cn(
                  "flex items-center justify-between text-sm group cursor-pointer w-full text-left rounded-lg px-2 py-1.5 -mx-2 transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-zinc-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <History className={cn("h-4 w-4", isActive ? "text-primary" : "text-zinc-500")} />
                  <span className={cn(
                    "truncate max-w-[150px] transition-colors",
                    isActive ? "text-primary font-medium" : "text-zinc-300 group-hover:text-primary"
                  )}>
                    {project.main_keyword}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">{project.total_keywords_found || 0} kw</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function KeywordAgentPage() {
  const router = useRouter();

  // Form state
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [keywords, setKeywords] = useState('');
  const [language, setLanguage] = useState('tr');
  const [region, setRegion] = useState('TR');
  const [aiContext, setAiContext] = useState('');
  const [showAiContext, setShowAiContext] = useState(false);

  // Client state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const setGlobalClientId = useClientStore((state) => state.setSelectedClientId);

  // Results state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [rawKeywords, setRawKeywords] = useState<KeywordResult[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectUuid, setProjectUuid] = useState<string | null>(null);

  // Selection state
  const [selectedPrimary, setSelectedPrimary] = useState<Set<number>>(new Set());
  const [selectedOther, setSelectedOther] = useState<Set<number>>(new Set());

  // Action states
  const [isAddingKeyword, setIsAddingKeyword] = useState<string | null>(null);
  const [isDeletingKeyword, setIsDeletingKeyword] = useState<number | null>(null);

  
  // AI Categorization state
  const [aiCategories, setAiCategories] = useState<AICategory[]>([]);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [aiCategorized, setAiCategorized] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rawSearchQuery, setRawSearchQuery] = useState('');
  const [primarySearchQuery, setPrimarySearchQuery] = useState('');
  const categorizationStartedRef = useRef(false);

  // Bulk seed filter state
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<'single' | 'bulk'>('single');

  // Bulk project merge state
  const [bulkProjects, setBulkProjects] = useState<RecentProject[]>([]);
  const [selectedBulkProjectId, setSelectedBulkProjectId] = useState<number | null>(null);
  const [isNewBulkProject, setIsNewBulkProject] = useState(true);

  // Recent projects
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Loading animation
  const [currentStep, setCurrentStep] = useState(0);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export modals
  const [showSheetsExportModal, setShowSheetsExportModal] = useState(false);
  const [showSheetsAdvancedModal, setShowSheetsAdvancedModal] = useState(false);

  // Delete state
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Character count
  const charCount = keywords.length;
  const maxChars = 500;

  // Sync client to global store
  useEffect(() => {
    if (selectedClientId) {
      setGlobalClientId(selectedClientId);
    }
  }, [selectedClientId, setGlobalClientId]);

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
    fetchClients();
  }, []);

  // Fetch recent projects
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
  }, [projectId]);

  // Fetch bulk projects for selected client
  useEffect(() => {
    if (mode === 'bulk' && selectedClientId) {
      const fetchBulkProjects = async () => {
        try {
          const response = await fetch(`/api/projects?client_id=${selectedClientId}&project_type=bulk`);
          const data = await response.json();
          if (data.success && data.projects) {
            setBulkProjects(data.projects);
          }
        } catch (err) {
          console.error('Failed to fetch bulk projects:', err);
        }
      };
      fetchBulkProjects();
    } else {
      setBulkProjects([]);
      setSelectedBulkProjectId(null);
    }
  }, [mode, selectedClientId]);

  // Loading animation - uses different steps for bulk mode
  useEffect(() => {
    if (isLoading) {
      setCurrentStep(0);
      let stepIndex = 0;
      const steps = mode === 'bulk' ? BULK_LOADING_STEPS : LOADING_STEPS;

      const advanceStep = () => {
        if (stepIndex < steps.length - 1) {
          stepIndex++;
          setCurrentStep(stepIndex);
          loadingIntervalRef.current = setTimeout(advanceStep, steps[stepIndex].duration);
        }
      };

      loadingIntervalRef.current = setTimeout(advanceStep, steps[0].duration);
    } else {
      if (loadingIntervalRef.current) {
        clearTimeout(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }

    return () => {
      if (loadingIntervalRef.current) clearTimeout(loadingIntervalRef.current);
    };
  }, [isLoading, mode]);

  // Sort and filter results by volume and seed
  const sortedResults = useMemo(() => {
    let filtered = [...results];

    // Filter by seed keyword if bulk project and a seed is selected
    if (projectType === 'bulk' && selectedSeed) {
      filtered = filtered.filter(kw => kw.seed_keyword === selectedSeed);
    }

    // Filter by search query
    if (primarySearchQuery) {
      filtered = filtered.filter(kw => kw.keyword.toLowerCase().includes(primarySearchQuery.toLowerCase()));
    }

    return filtered.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));
  }, [results, projectType, selectedSeed, primarySearchQuery]);

  // Grouped keywords (for category chips) - uses AI categories or rule-based grouping
  const groupedKeywords = useMemo(() => {
    if (aiCategorized && aiCategories.length > 0) {
      return aiCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        keywords: rawKeywords.filter(kw =>
          cat.keywords.some(k => k.toLowerCase() === kw.keyword.toLowerCase())
        ),
        totalVolume: rawKeywords
          .filter(kw => cat.keywords.some(k => k.toLowerCase() === kw.keyword.toLowerCase()))
          .reduce((sum, kw) => sum + (kw.search_volume || 0), 0)
      }));
    }
    // Otherwise use rule-based grouping
    return groupKeywords(rawKeywords);
  }, [rawKeywords, aiCategorized, aiCategories]);

  // Filter raw keywords (exclude ones already in main list + apply search, category, and seed filters)
  const filteredRawKeywords = useMemo(() => {
    const mainKeywordSet = new Set(results.map(k => normalizeKeyword(k.keyword)));

    // Get keywords in selected category
    let categoryKeywords: Set<string> | null = null;
    if (selectedCategory) {
      const selectedGroup = groupedKeywords.find(g => g.id === selectedCategory);
      if (selectedGroup) {
        categoryKeywords = new Set(selectedGroup.keywords.map(k => normalizeKeyword(k.keyword)));
      }
    }

    return rawKeywords
      .filter(kw => {
        const normalizedKw = normalizeKeyword(kw.keyword);
        // Exclude if already in main keywords
        if (mainKeywordSet.has(normalizedKw)) return false;
        // Apply search filter
        if (rawSearchQuery && !kw.keyword.toLowerCase().includes(rawSearchQuery.toLowerCase())) return false;
        // Apply category filter
        if (categoryKeywords && !categoryKeywords.has(normalizedKw)) return false;
        // Apply seed filter for bulk projects
        if (projectType === 'bulk' && selectedSeed && kw.seed_keyword !== selectedSeed) return false;
        return true;
      })
      .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));
  }, [rawKeywords, results, rawSearchQuery, selectedCategory, groupedKeywords, projectType, selectedSeed]);

  // Handle search - routes to single or bulk based on mode
  const handleSearch = async () => {
    if (mode === 'bulk') {
      await handleBulkSearch();
    } else {
      await handleSingleSearch();
    }
  };

  // Handle single keyword search
  const handleSingleSearch = async () => {
    if (isLoading) return;

    const keywordList = keywords.trim().split('\n').filter(k => k.trim().length >= 2);
    if (keywordList.length === 0) {
      setError('En az bir keyword girin (minimum 2 karakter)');
      return;
    }

    if (!selectedClientId) {
      setError('Lütfen bir müşteri seçin');
      return;
    }

    const mainKeyword = keywordList[0];

    setIsLoading(true);
    setError(null);
    setResults([]);
    setRawKeywords([]);
    setProjectId(null);
    setProjectUuid(null);
    setSelectedPrimary(new Set());
    setSelectedOther(new Set());

    try {
      // Create project
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          name: `Keyword Research: ${mainKeyword}`,
          main_keyword: mainKeyword,
          target_country: region,
          target_language: language,
        }),
      });
      const projectData = await projectResponse.json();

      if (!projectData.success || !projectData.project?.id) {
        throw new Error(projectData.error || 'Proje oluşturulamadı');
      }

      const newProjectId = projectData.project.id;
      const newProjectUuid = projectData.project.uuid || newProjectId;
      setProjectId(newProjectId);
      setProjectUuid(newProjectUuid);

      // Run keyword research
      const response = await api.post<KeywordResearchResponse>('/keyword-research', {
        keyword: mainKeyword,
        country: region,
        language: language,
        project_id: newProjectId,
        client_id: selectedClientId,
        custom_rules: aiContext.trim() || undefined,
      }, { timeout: 300000 });

      if (response.success) {
        const keywordResults = response.keywords || [];
        setResults(keywordResults);

        // Set single mode states
        setProjectType('single');
        setSeedKeywords([]);
        setSelectedSeed(null);

        // Update project
        if (keywordResults.length > 0) {
          await fetch(`/api/projects/${newProjectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'keywords_discovered',
              total_keywords_found: keywordResults.length,
            }),
          });

          // Save to localStorage as fallback
          const fallbackData = {
            projectId: newProjectId,
            projectUuid: newProjectUuid,
            keywords: keywordResults,
            stats: response.stats,
            savedAt: Date.now(),
          };
          localStorage.setItem(`keywords-fallback-${newProjectUuid}`, JSON.stringify(fallbackData));
        }

        // Fetch raw keywords from API
        await fetchRawKeywords(newProjectId);
      } else {
        setError(response.error || 'Bir hata oluştu');
      }
    } catch (err: any) {
      setError(err.message || 'API hatası');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk keyword search - processes multiple keywords at once
  const handleBulkSearch = async () => {
    if (isLoading) return;

    const keywordList = keywords.trim().split('\n').filter(k => k.trim().length >= 2);
    if (keywordList.length === 0) {
      setError('En az bir keyword girin (minimum 2 karakter)');
      return;
    }

    if (keywordList.length > 100) {
      setError('Maksimum 100 keyword girebilirsiniz');
      return;
    }

    if (!selectedClientId) {
      setError('Lütfen bir müşteri seçin');
      return;
    }

    const mainKeyword = keywordList[0];

    // Check if using existing project
    const useExistingProject = !isNewBulkProject && selectedBulkProjectId;

    if (useExistingProject && !selectedBulkProjectId) {
      setError('Lütfen mevcut bir proje seçin veya yeni proje oluşturun');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setRawKeywords([]);
    setSelectedPrimary(new Set());
    setSelectedOther(new Set());
    setAiCategories([]);
    setAiCategorized(false);
    categorizationStartedRef.current = false;

    // Don't reset project states if using existing project
    if (!useExistingProject) {
      setProjectId(null);
      setProjectUuid(null);
    }

    try {
      let targetProjectId: number;
      let targetProjectUuid: string;

      if (useExistingProject && selectedBulkProjectId) {
        // Use existing project
        targetProjectId = selectedBulkProjectId;
        targetProjectUuid = String(selectedBulkProjectId);

        // Get existing project's seed keywords and merge with new ones
        const existingProject = bulkProjects.find(p => p.id === selectedBulkProjectId);
        let combinedSeeds = keywordList;

        if (existingProject) {
          // Merge seed keywords - existing project might have seed_keywords in different format
          let existingSeeds: string[] = [];
          if (existingProject.seed_keywords) {
            try {
              existingSeeds = typeof existingProject.seed_keywords === 'string'
                ? JSON.parse(existingProject.seed_keywords)
                : existingProject.seed_keywords;
            } catch {
              existingSeeds = [];
            }
          }
          // Combine existing and new seeds (unique)
          combinedSeeds = Array.from(new Set([...existingSeeds, ...keywordList]));
        }
        setSeedKeywords(combinedSeeds);

        // Update project's seed_keywords in DB
        await fetch(`/api/projects/${targetProjectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed_keywords: combinedSeeds }),
        });
      } else {
        // Create new bulk project
        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: selectedClientId,
            name: `Bulk Research: ${mainKeyword} (+${keywordList.length - 1} keywords)`,
            main_keyword: mainKeyword,
            target_country: region,
            target_language: language,
            project_type: 'bulk',
            seed_keywords: keywordList,
          }),
        });
        const projectData = await projectResponse.json();

        if (!projectData.success || !projectData.project?.id) {
          throw new Error(projectData.error || 'Proje oluşturulamadı');
        }

        targetProjectId = projectData.project.id;
        targetProjectUuid = projectData.project.uuid || targetProjectId;
        setSeedKeywords(keywordList);
      }

      setProjectId(targetProjectId);
      setProjectUuid(targetProjectUuid);

      // Run bulk keyword research via n8n
      const response = await api.post<KeywordResearchResponse>('/bulk-keyword-research', {
        keywords: keywordList,
        country: region,
        language: language,
        project_id: targetProjectId,
        client_id: selectedClientId,
        custom_rules: aiContext.trim() || undefined,
        project_name: useExistingProject ? undefined : `Bulk Research: ${mainKeyword}`,
      }, { timeout: 600000 }); // 10 minute timeout for bulk

      if (response.success) {
        const keywordResults = response.keywords || [];

        // Set bulk mode states
        setProjectType('bulk');
        setSelectedSeed(null); // Show all initially

        // Update project with stats
        await fetch(`/api/projects/${targetProjectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'keywords_discovered',
            total_keywords_found: keywordResults.length,
            bulk_stats: response.stats,
          }),
        });

        // Fetch all keywords (approved + rejected) from DB - this will include all keywords for the project
        await fetchRawKeywords(targetProjectId);

        // Fetch approved keywords
        const approvedResponse = await fetch(`/api/projects/${targetProjectId}/keywords`);
        const approvedData = await approvedResponse.json();
        if (approvedData.success && approvedData.data) {
          setResults(approvedData.data);
        } else {
          setResults(keywordResults);
        }

        showNotification('success', `Bulk araştırma tamamlandı! ${keywordResults.length} keyword onaylandı.`);

        // Refresh bulk projects list
        if (useExistingProject) {
          const response = await fetch(`/api/projects?client_id=${selectedClientId}&project_type=bulk`);
          const data = await response.json();
          if (data.success && data.projects) {
            setBulkProjects(data.projects);
          }
        }
      } else {
        setError(response.error || 'Bulk araştırma hatası');
      }
    } catch (err: any) {
      console.error('Bulk search error:', err);
      setError(err.message || 'Bulk API hatası');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch raw keywords
  const fetchRawKeywords = async (projId: number) => {
    try {
      let retryCount = 0;
      const maxRetries = 5;
      const retryDelay = 2000;
      let rawKeywordsList: KeywordResult[] = [];

      while (retryCount < maxRetries) {
        const response = await fetch(`/api/projects/${projId}/keywords-raw`);
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          rawKeywordsList = data.data;
          setRawKeywords(data.data);
          break;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`[Raw Keywords] Retry ${retryCount}/${maxRetries} - waiting for data...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      // Check for AI categorization
      if (rawKeywordsList.length > 0 && !categorizationStartedRef.current) {
        categorizationStartedRef.current = true;
        try {
          const catCheckRes = await fetch(`/api/projects/${projId}/keywords-categorize`);
          const catCheckData = await catCheckRes.json();

          if (catCheckData.success && catCheckData.categorization_done && catCheckData.categories) {
            setAiCategories(catCheckData.categories);
            setAiCategorized(true);
          } else {
            // Not categorized yet - run AI silently in background
            runAiCategorizationInBackground(projId, rawKeywordsList);
          }
        } catch (catErr) {
          console.error('Category check failed:', catErr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch raw keywords:', err);
    }
  };

  // Background AI categorization (no loading banner)
  const runAiCategorizationInBackground = async (projId: number, keywords: KeywordResult[]) => {
    try {
      const catResponse = await fetch(`/api/projects/${projId}/keywords-categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.slice(0, 500).map((kw) => ({
            id: kw.id,
            keyword: kw.keyword,
            search_volume: kw.search_volume,
            cpc: kw.cpc,
            competition: kw.competition
          }))
        })
      });

      const catData = await catResponse.json();

      if (catData.success && catData.categories) {
        setAiCategories(catData.categories);
        setAiCategorized(true);
        console.log('[AI Categorize] Completed silently');
      }
    } catch (err) {
      console.error('Background AI categorization failed:', err);
    }
  };

  // Manual AI categorization
  const runAiCategorization = async () => {
    if (rawKeywords.length === 0 || isAiCategorizing || !projectId) return;
    setIsAiCategorizing(true);
    setSelectedCategory(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/keywords-categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: rawKeywords.slice(0, 500).map((kw) => ({
            id: kw.id,
            keyword: kw.keyword,
            search_volume: kw.search_volume,
            cpc: kw.cpc,
            competition: kw.competition
          }))
        })
      });

      const data = await response.json();
      if (data.success && data.categories) {
        setAiCategories(data.categories);
        setAiCategorized(true);
      }
    } catch (err) {
      console.error('Error running AI categorization:', err);
    } finally {
      setIsAiCategorizing(false);
    }
  };

  // Reset to rule-based categorization
  const resetCategorization = () => {
    setAiCategories([]);
    setAiCategorized(false);
    setSelectedCategory(null);
  };

  // Get icon for group
  const getGroupIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'tag': Tag,
      'ruler': Ruler,
      'dollar-sign': DollarSign,
      'help-circle': HelpCircle,
      'git-compare': GitCompare,
      'package': Package,
      'building-2': Building2,
      'car': Car,
      'star': Star,
      'zap': Zap,
      'heart': Heart,
      'shield': Shield,
      'clock': Clock,
      'map-pin': MapPin,
      'users': Users,
      'shopping-cart': ShoppingCart,
      'trending-up': TrendingUp,
      'search': Search,
      'settings': Settings,
      'target': Target,
      'globe': Globe,
      'database': Database,
      'sparkles': Sparkles,
    };
    return iconMap[iconName] || Package;
  };

  // Toggle category filter
  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  // Load existing project
  const loadProject = async (project: RecentProject) => {
    const projId = project.id;
    const projUuid = project.uuid;

    // Reset states
    setError(null);
    setResults([]);
    setRawKeywords([]);
    setAiCategories([]);
    setAiCategorized(false);
    setSelectedCategory(null);
    setSelectedPrimary(new Set());
    setSelectedOther(new Set());
    setSeedKeywords([]);
    setSelectedSeed(null);
    setProjectType('single');
    categorizationStartedRef.current = false;

    // Set project info
    setProjectId(projId);
    setProjectUuid(projUuid);
    setKeywords(project.main_keyword);

    setIsLoading(true);

    try {
      // Fetch project details to get project type and seed keywords
      const projectRes = await fetch(`/api/projects/${projId}`);
      const projectData = await projectRes.json();

      if (projectData.success && projectData.project) {
        const proj = projectData.project;
        if (proj.project_type === 'bulk') {
          setProjectType('bulk');
          setMode('bulk');
          // Parse seed_keywords if it's a JSON string
          let seeds: string[] = [];
          if (proj.seed_keywords) {
            try {
              seeds = typeof proj.seed_keywords === 'string'
                ? JSON.parse(proj.seed_keywords)
                : proj.seed_keywords;
            } catch {
              seeds = [];
            }
          }
          setSeedKeywords(seeds);
        }
      }

      // Fetch approved keywords
      const keywordsRes = await fetch(`/api/projects/${projId}/keywords`);
      const keywordsData = await keywordsRes.json();

      if (keywordsData.success && keywordsData.data) {
        setResults(keywordsData.data);
      }

      // Fetch raw keywords
      await fetchRawKeywords(projId);

    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Proje yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Add keyword to main list
  const addKeywordToMain = async (kw: KeywordResult) => {
    if (!projectId) return;
    setIsAddingKeyword(kw.keyword);

    try {
      const response = await fetch(`/api/projects/${projectId}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: kw.keyword,
          seed_keyword: kw.seed_keyword,
          search_volume: kw.search_volume,
          cpc: kw.cpc,
          competition: kw.competition,
          keyword_difficulty: kw.keyword_difficulty,
          search_intent: kw.search_intent,
          source: 'manual'
        })
      });

      const data = await response.json();
      if (data.success) {
        setResults(prev => [...prev, { ...kw, id: data.id, source: 'manual' }]);
        showNotification('success', 'Keyword ana listeye eklendi');
      } else {
        console.error('Failed to add keyword:', data.error);
        showNotification('error', 'Keyword eklenemedi');
      }
    } catch (err) {
      console.error('Error adding keyword:', err);
      showNotification('error', 'Bir hata oluştu');
    } finally {
      setIsAddingKeyword(null);
    }
  };

  // Remove keyword from main list
  const removeKeywordFromMain = async (kw: KeywordResult) => {
    if (!projectId || !kw.id) return;
    setIsDeletingKeyword(kw.id);

    try {
      const response = await fetch(`/api/projects/${projectId}/keywords?id=${kw.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setResults(prev => prev.filter(k => k.id !== kw.id));
        setSelectedPrimary(prev => {
          const next = new Set(prev);
          next.delete(kw.id!);
          return next;
        });
      } else {
        console.error('Failed to remove keyword:', data.error);
      }
    } catch (err) {
      console.error('Error removing keyword:', err);
    } finally {
      setIsDeletingKeyword(null);
    }
  };

  // Toggle selection
  const togglePrimarySelection = (id: number) => {
    setSelectedPrimary(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleOtherSelection = (id: number) => {
    setSelectedOther(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPrimary = () => {
    const allIds = new Set(sortedResults.map((kw, idx) => kw.id || idx));
    setSelectedPrimary(allIds);
  };

  const deselectAllPrimary = () => setSelectedPrimary(new Set());

  const selectAllOther = () => {
    const allIds = new Set(filteredRawKeywords.map((kw, idx) => kw.id || idx));
    setSelectedOther(allIds);
  };

  const deselectAllOther = () => setSelectedOther(new Set());

  // Bulk add selected from other to main
  const bulkAddToMain = async () => {
    if (selectedOther.size === 0 || !projectId) return;

    const keywordsToAdd = filteredRawKeywords.filter((kw, idx) => selectedOther.has(kw.id || idx));

    for (const kw of keywordsToAdd) {
      await addKeywordToMain(kw);
    }

    setSelectedOther(new Set());
  };

  // Bulk remove selected from main
  const bulkRemoveFromMain = async () => {
    if (selectedPrimary.size === 0 || !projectId) return;

    const keywordsToRemove = sortedResults.filter((kw, idx) => selectedPrimary.has(kw.id || idx));

    for (const kw of keywordsToRemove) {
      if (kw.id) await removeKeywordFromMain(kw);
    }

    setSelectedPrimary(new Set());
  };

  // Copy keyword with volume
  const copyKeyword = (keyword: string, volume?: number | null) => {
    const text = `${keyword}\t${volume?.toLocaleString() || ''}`;
    navigator.clipboard.writeText(text);
    showNotification('success', 'Keyword kopyalandı');
  };

  // Total selected count
  const totalSelected = selectedPrimary.size + selectedOther.size;

  // Get all selected keywords
  const getSelectedKeywords = () => {
    const primaryKws = sortedResults.filter(kw => kw.id && selectedPrimary.has(kw.id));
    const otherKws = filteredRawKeywords.filter((kw, idx) => selectedOther.has(kw.id || idx));
    return [...primaryKws, ...otherKws];
  };

  // Copy selected keywords with volume
  const copySelectedKeywords = () => {
    const keywords = getSelectedKeywords();
    const text = keywords.map(kw => `${kw.keyword}\t${kw.search_volume?.toLocaleString() || ''}`).join('\n');
    navigator.clipboard.writeText(text);
    showNotification('success', `${keywords.length} keyword kopyalandı`);
  };

  // Export selected as CSV
  const exportSelectedCSV = () => {
    const keywords = getSelectedKeywords();
    if (!keywords.length) return;

    const headers = ['Keyword', 'Volume', 'KD %', 'CPC', 'Intent'];
    const rows = keywords.map(kw => [
      kw.keyword,
      kw.search_volume || '',
      kw.keyword_difficulty || '',
      kw.cpc ? `$${Number(kw.cpc).toFixed(2)}` : '',
      kw.search_intent || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', `${keywords.length} keyword CSV olarak indirildi`);
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedPrimary(new Set());
    setSelectedOther(new Set());
  };

  // Remove selected keywords from main list (only primary can be deleted)
  const removeSelectedKeywords = async () => {
    if (selectedPrimary.size === 0 || !projectId) return;
    setIsDeletingSelected(true);

    const selectedIds = Array.from(selectedPrimary);
    for (const id of selectedIds) {
      const kw = sortedResults.find(k => k.id === id);
      if (kw && kw.id) {
        try {
          const response = await fetch(`/api/projects/${projectId}/keywords?id=${id}`, { method: 'DELETE' });
          const data = await response.json();
          if (data.success) {
            setResults(prev => prev.filter(k => k.id !== id));
          }
        } catch (err) {
          console.error('Error deleting keyword:', err);
        }
      }
    }

    const deletedCount = selectedIds.length;
    setSelectedPrimary(new Set());
    setIsDeletingSelected(false);
    showNotification('success', `${deletedCount} keyword silindi`);
  };

  
  // Trigger file import
  const triggerFileImport = () => {
    fileInputRef.current?.click();
  };

  // Handle file import (CSV/Excel)
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
      let importedKeywords: string[] = [];

      if (isCSV) {
        const text = await file.text();
        const lines = text.split(/\r?\n/);

        for (const line of lines) {
          const cells = line.split(/[,;]/);
          const firstCell = cells[0]?.trim();
          if (firstCell && firstCell.length >= 2 &&
              !firstCell.toLowerCase().includes('keyword') &&
              !firstCell.toLowerCase().includes('anahtar')) {
            importedKeywords.push(firstCell);
          }
        }
      } else {
        // Excel import
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

        for (const row of jsonData) {
          const firstCell = row[0]?.toString()?.trim();
          if (firstCell && firstCell.length >= 2 &&
              !firstCell.toLowerCase().includes('keyword') &&
              !firstCell.toLowerCase().includes('anahtar')) {
            importedKeywords.push(firstCell);
          }
        }
      }

      if (importedKeywords.length === 0) {
        setError('Dosyada geçerli keyword bulunamadı');
        return;
      }

      // Remove duplicates and limit
      const uniqueKeywords = Array.from(new Set(importedKeywords)).slice(0, 50);
      setKeywords(uniqueKeywords.join('\n'));
      setMode('bulk');
      setError(null);
      showNotification('success', `${uniqueKeywords.length} keyword içe aktarıldı`);

    } catch (err: any) {
      console.error('File import error:', err);
      setError('Dosya okunamadı: ' + (err.message || 'Bilinmeyen hata'));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  
  return (
    <PageTransition className="h-screen text-white overflow-hidden flex flex-col">

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={cn(
              'fixed top-4 left-1/2 z-50 px-4 py-3 rounded-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center gap-2 text-sm font-medium border',
              notification.type === 'success'
                ? 'bg-emerald-500/80 text-white border-emerald-400/30'
                : 'bg-red-500/80 text-white border-red-400/30'
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full px-4 pt-6 pb-2 overflow-hidden">
        <div className="mb-2 flex-shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-white">Keyword Research</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto min-h-0">
            <div className="relative overflow-hidden flex-shrink-0 rounded-xl p-4 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <AnimatePresence>
                {isLoading && (
                  <LoadingOverlay
                    currentStep={currentStep}
                    totalSteps={mode === 'bulk' ? BULK_LOADING_STEPS.length : LOADING_STEPS.length}
                    stepLabel={(mode === 'bulk' ? BULK_LOADING_STEPS : LOADING_STEPS)[currentStep]?.label || ''}
                    isBulk={mode === 'bulk'}
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center justify-center mb-4">
                <ModeToggle mode={mode} onModeChange={setMode} onImportClick={triggerFileImport} disabled={isLoading} />
              </div>

              {/* Client Selector - Custom Dropdown with Logos */}
              <ClientDropdown
                clients={clients}
                selectedClientId={selectedClientId}
                onSelect={setSelectedClientId}
                isLoading={isLoadingClients}
                disabled={isLoading}
              />

              <div className="mb-5 relative">
                <label className="block text-sm font-medium text-white mb-2">Target Keywords</label>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value.slice(0, maxChars))}
                  placeholder={mode === 'single' ? 'e.g. enterprise seo software' : 'e.g. enterprise seo software\nsaas marketing tools'}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-sm text-white placeholder-zinc-600 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all min-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-zinc-600 bg-zinc-950 px-1 rounded">{charCount}/{maxChars}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Language</label>
                  <div className="relative">
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-md py-2 pl-3 pr-8 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none" disabled={isLoading}>
                      {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-zinc-800 text-white">{l.flag} {l.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Region</label>
                  <div className="relative">
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-md py-2 pl-3 pr-8 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none" disabled={isLoading}>
                      {REGIONS.map(r => <option key={r.code} value={r.code} className="bg-zinc-800 text-white">{r.flag} {r.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Bulk Project Selection - Show only in bulk mode */}
              {mode === 'bulk' && (
                <div className="mb-5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-xs font-medium text-zinc-400">Proje Seçimi</label>
                    <div className="flex items-center gap-1 bg-zinc-800 rounded-md p-0.5">
                      <button
                        onClick={() => { setIsNewBulkProject(true); setSelectedBulkProjectId(null); }}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded transition-all',
                          isNewBulkProject ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'
                        )}
                        disabled={isLoading}
                      >
                        Yeni Proje
                      </button>
                      <button
                        onClick={() => setIsNewBulkProject(false)}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded transition-all',
                          !isNewBulkProject ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'
                        )}
                        disabled={isLoading || bulkProjects.length === 0}
                      >
                        Mevcut Projeye Ekle
                      </button>
                    </div>
                  </div>

                  {!isNewBulkProject && (
                    <div className="relative">
                      <select
                        value={selectedBulkProjectId || ''}
                        onChange={(e) => setSelectedBulkProjectId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-md py-2 pl-3 pr-8 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                        disabled={isLoading}
                      >
                        <option value="" className="bg-zinc-800 text-white">Proje seçin...</option>
                        {bulkProjects.map(p => (
                          <option key={p.id} value={p.id} className="bg-zinc-800 text-white">
                            {p.name} ({p.total_keywords_found || 0} keyword)
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                      {bulkProjects.length === 0 && (
                        <p className="mt-1.5 text-xs text-zinc-500">Bu müşteri için henüz bulk proje yok</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <button onClick={() => setShowAiContext(!showAiContext)} className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-primary transition-colors">
                  <ChevronRight className={cn('h-4 w-4 transition-transform', showAiContext && 'rotate-90')} />
                  Advanced AI Context (Optional)
                </button>
                <AnimatePresence>
                  {showAiContext && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <textarea value={aiContext} onChange={(e) => setAiContext(e.target.value)} placeholder="Describe specific intent or persona..." className="mt-2 w-full bg-white/[0.03] border border-white/[0.08] rounded-md p-2 text-xs text-white placeholder-zinc-600 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none min-h-[80px]" disabled={isLoading} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={handleSearch} disabled={isLoading || !keywords.trim() || !selectedClientId} className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Sparkles className="h-5 w-5" />Run Research</>}
              </button>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-900/30 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Recent Projects - sadece sonuç yokken göster */}
            {results.length === 0 && rawKeywords.length === 0 && (
              <RecentProjectsPanel
                projects={recentProjects}
                isLoading={isLoadingProjects}
                onSelectProject={loadProject}
                activeProjectId={projectId}
              />
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-9 flex flex-col gap-3 min-h-0 overflow-hidden">
            {/* Primary Results Table */}
            <div className="overflow-hidden flex flex-col flex-1 min-h-0 rounded-xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="px-4 py-2 border-b border-white/[0.05] flex-shrink-0">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/[0.05]"><CheckCircle2 className="h-4 w-4 text-primary" /></div>
                    <h3 className="text-sm font-semibold text-white">Ana Sonuçlar</h3>
                    {results.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full border tabular-nums font-mono bg-emerald-900/20 text-emerald-300 border-emerald-900/30">{sortedResults.length}{projectType === 'bulk' && selectedSeed ? `/${results.length}` : ''}{primarySearchQuery ? ` (filtreli)` : ''} accepted</span>}

                    {/* Seed Filter Dropdown for Bulk Projects */}
                    {projectType === 'bulk' && seedKeywords.length > 0 && (
                      <div className="relative">
                        <select
                          value={selectedSeed || ''}
                          onChange={(e) => setSelectedSeed(e.target.value || null)}
                          className="appearance-none bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none cursor-pointer min-w-[180px]"
                        >
                          <option value="" className="bg-zinc-800 text-white">Tüm Keywordler ({results.length})</option>
                          {seedKeywords.map((seed) => {
                            const count = results.filter(r => r.seed_keyword === seed).length;
                            return (
                              <option key={seed} value={seed} className="bg-zinc-800 text-white">
                                {seed} ({count})
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPrimary.size > 0 && (
                      <>
                        <button onClick={deselectAllPrimary} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors">
                          <X className="h-3 w-3" />{selectedPrimary.size} seçili
                        </button>
                        <button onClick={bulkRemoveFromMain} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-400 bg-red-900/20 border border-red-900/30 rounded hover:bg-red-900/30 transition-colors">
                          <Trash2 className="h-3 w-3" />Sil
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Kelime ara..."
                    value={primarySearchQuery}
                    onChange={(e) => setPrimarySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  {primarySearchQuery && (
                    <button onClick={() => setPrimarySearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800">
                      <X className="h-3 w-3 text-zinc-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-900 border-b border-white/[0.05] sticky top-0 z-20">
                    <tr>
                      <th className="px-3 py-2 w-10 bg-zinc-900">
                        <button
                          onClick={(e) => { e.stopPropagation(); selectedPrimary.size === sortedResults.length && sortedResults.length > 0 ? deselectAllPrimary() : selectAllPrimary(); }}
                          className="p-1 rounded hover:bg-zinc-700 transition-colors"
                          title={selectedPrimary.size === sortedResults.length && sortedResults.length > 0 ? 'Seçimi kaldır' : 'Tümünü seç'}
                        >
                          {selectedPrimary.size === sortedResults.length && sortedResults.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-zinc-500" />}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900">Keyword</th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 text-right bg-zinc-900">Vol</th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 text-center bg-zinc-900">KD</th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 text-right bg-zinc-900">CPC</th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900">Intent</th>
                      <th className="px-3 py-2 w-12 bg-zinc-900"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {sortedResults.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center"><div className="flex flex-col items-center gap-2"><CheckCircle2 className="h-6 w-6 text-zinc-700" /><p className="text-zinc-500 text-xs">{isLoading ? 'Yükleniyor...' : "Keyword ara"}</p></div></td></tr>
                    ) : (
                      sortedResults.map((kw, index) => {
                        const id = kw.id || index;
                        const isSelected = selectedPrimary.has(id);
                        return (
                          <motion.tr key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(index * 0.02, 0.2) }} onClick={() => togglePrimarySelection(id)} className={cn('hover:bg-zinc-800/50 transition-colors group cursor-pointer', isSelected && 'bg-primary/5')}>
                            <td className="px-4 py-3">
                              <div className="p-1 rounded hover:bg-zinc-700">
                                {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-zinc-600" />}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-white">
                              {kw.keyword}
                              <button onClick={(e) => { e.stopPropagation(); copyKeyword(kw.keyword, kw.search_volume); }} className="ml-2 opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 hover:text-primary transition-opacity">Copy</button>
                            </td>
                            <td className="px-4 py-3 text-zinc-300 text-right tabular-nums font-mono">{kw.search_volume?.toLocaleString() || '-'}</td>
                            <td className="px-4 py-3 text-center"><DifficultyBadge value={kw.keyword_difficulty} /></td>
                            <td className="px-4 py-3 text-zinc-300 text-right tabular-nums font-mono">{kw.cpc ? `$${Number(kw.cpc).toFixed(2)}` : '-'}</td>
                            <td className="px-4 py-3"><IntentBadge intent={kw.search_intent} /></td>
                            <td className="px-4 py-3">
                              <button onClick={(e) => { e.stopPropagation(); removeKeywordFromMain(kw); }} disabled={isDeletingKeyword === kw.id} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-900/30 text-zinc-500 hover:text-red-400 transition-all disabled:opacity-50">
                                {isDeletingKeyword === kw.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Other Keywords Table */}
            <div className="overflow-hidden flex flex-col flex-1 min-h-0 rounded-xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="px-4 py-2 border-b border-white/[0.05] flex-shrink-0">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/[0.05]"><Database className="h-4 w-4 text-blue-400" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">Diğer Kelimeler</h3>
                        {aiCategorized && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />AI Kategorilendi
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        {filteredRawKeywords.length.toLocaleString()} kelime
                        {rawSearchQuery && ` ("${rawSearchQuery}" için)`}
                        {selectedCategory && (
                          <span className="text-primary"> • {groupedKeywords.find(g => g.id === selectedCategory)?.name} filtresi aktif</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Category Dropdown */}
                    {groupedKeywords.length > 0 && (
                      <>
                        <div className="relative">
                          <select
                            value={selectedCategory || ''}
                            onChange={(e) => setSelectedCategory(e.target.value || null)}
                            className="appearance-none bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none cursor-pointer min-w-[160px]"
                          >
                            <option value="" className="bg-zinc-800 text-white">Tüm Kategoriler ({rawKeywords.length})</option>
                            {groupedKeywords.map((group) => (
                              <option key={group.id} value={group.id} className="bg-zinc-800 text-white">
                                {group.name} ({group.keywords.length})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
                        </div>
                        {selectedCategory && (
                          <button onClick={() => setSelectedCategory(null)} className="p-1.5 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors" title="Filtreyi temizle">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    )}

                    {/* AI Categorization Button */}
                    {isAiCategorizing ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                        <Loader2 className="h-3 w-3 animate-spin" />Analiz...
                      </div>
                    ) : aiCategorized ? (
                      <button onClick={resetCategorization} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors">
                        <RefreshCw className="h-3 w-3" />Sıfırla
                      </button>
                    ) : rawKeywords.length > 0 ? (
                      <button onClick={runAiCategorization} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">
                        <Sparkles className="h-3 w-3" />AI Kategorile
                      </button>
                    ) : null}
                    {selectedOther.size > 0 && (
                      <>
                        <button onClick={deselectAllOther} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors">
                          <X className="h-3 w-3" />{selectedOther.size} seçili
                        </button>
                        <button onClick={bulkAddToMain} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-900/20 border border-emerald-900/30 rounded hover:bg-emerald-900/30 transition-colors">
                          <Plus className="h-3 w-3" />Ekle
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Kelime ara..."
                    value={rawSearchQuery}
                    onChange={(e) => setRawSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  {rawSearchQuery && (
                    <button onClick={() => setRawSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800">
                      <X className="h-3 w-3 text-zinc-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-900 border-b border-white/[0.05] sticky top-0 z-20">
                    <tr>
                      <th className="px-3 py-2 w-10 bg-zinc-900">
                        <button
                          onClick={(e) => { e.stopPropagation(); selectedOther.size === filteredRawKeywords.length && filteredRawKeywords.length > 0 ? deselectAllOther() : selectAllOther(); }}
                          className="p-1 rounded hover:bg-zinc-700 transition-colors"
                          title={selectedOther.size === filteredRawKeywords.length && filteredRawKeywords.length > 0 ? 'Seçimi kaldır' : 'Tümünü seç'}
                        >
                          {selectedOther.size === filteredRawKeywords.length && filteredRawKeywords.length > 0 ? <CheckSquare className="h-4 w-4 text-blue-400" /> : <Square className="h-4 w-4 text-zinc-500" />}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900">Keyword</th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 text-right bg-zinc-900">Vol</th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 text-center bg-zinc-900">KD</th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 text-right bg-zinc-900">CPC</th>
                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900">Intent</th>
                      <th className="px-3 py-2 w-12 bg-zinc-900"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {filteredRawKeywords.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center"><div className="flex flex-col items-center gap-2"><Database className="h-6 w-6 text-zinc-700" /><p className="text-zinc-500 text-xs">{isLoading ? 'Yükleniyor...' : 'Henüz diğer keyword yok'}</p></div></td></tr>
                    ) : (
                      filteredRawKeywords.map((kw, index) => {
                        const id = kw.id || index;
                        const isSelected = selectedOther.has(id);
                        const isAdding = isAddingKeyword === kw.keyword;
                        return (
                          <motion.tr key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(index * 0.02, 0.2) }} onClick={() => toggleOtherSelection(id)} className={cn('hover:bg-zinc-800/50 transition-colors group cursor-pointer', isSelected && 'bg-blue-900/10')}>
                            <td className="px-3 py-2">
                              <div className="p-1 rounded hover:bg-zinc-700">
                                {isSelected ? <CheckSquare className="h-4 w-4 text-blue-400" /> : <Square className="h-4 w-4 text-zinc-600" />}
                              </div>
                            </td>
                            <td className="px-3 py-2 font-medium text-white">
                              {kw.keyword}
                              <button onClick={(e) => { e.stopPropagation(); copyKeyword(kw.keyword, kw.search_volume); }} className="ml-2 opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 hover:text-primary transition-opacity">Copy</button>
                            </td>
                            <td className="px-3 py-2 text-zinc-300 text-right tabular-nums font-mono">{kw.search_volume?.toLocaleString() || '-'}</td>
                            <td className="px-3 py-2 text-center"><DifficultyBadge value={kw.keyword_difficulty} /></td>
                            <td className="px-3 py-2 text-zinc-300 text-right tabular-nums font-mono">{kw.cpc ? `$${Number(kw.cpc).toFixed(2)}` : '-'}</td>
                            <td className="px-3 py-2"><IntentBadge intent={kw.search_intent} /></td>
                            <td className="px-3 py-2">
                              <button onClick={(e) => { e.stopPropagation(); addKeywordToMain(kw); }} disabled={isAdding} className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50" title="Ana listeye ekle">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Bar - Quick Actions */}
      <AnimatePresence>
        {totalSelected > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/[0.15] shadow-2xl shadow-black/50">
              {/* Selection Count */}
              <span className="text-base font-semibold text-white tabular-nums min-w-[80px]">
                {totalSelected} seçili
              </span>

              <div className="h-6 w-px bg-white/10" />

              {/* Actions - Bigger with Labels */}
              <button
                onClick={copySelectedKeywords}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white bg-white/5 hover:bg-white/10 transition-all active:scale-95"
              >
                <Copy className="h-5 w-5" />
                <span className="text-sm font-medium">Kopyala</span>
              </button>

              <button
                onClick={exportSelectedCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all active:scale-95"
              >
                <Download className="h-5 w-5" />
                <span className="text-sm font-medium">CSV</span>
              </button>

              <button
                onClick={() => setShowSheetsExportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-all active:scale-95"
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span className="text-sm font-medium">Sheets</span>
              </button>

              <button
                onClick={() => setShowSheetsAdvancedModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-all active:scale-95"
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm font-medium">Gelişmiş</span>
              </button>

              <div className="h-6 w-px bg-white/10" />

              <button
                onClick={clearAllSelections}
                className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sheets Export Modal */}
      <SheetsExportModal
        open={showSheetsExportModal}
        onOpenChange={setShowSheetsExportModal}
        projectId={projectUuid || String(projectId) || ''}
        clientId={selectedClientId}
        selectedKeywords={getSelectedKeywords()}
      />

      {/* Sheets Advanced Modal */}
      <SheetsAdvancedModal
        open={showSheetsAdvancedModal}
        onOpenChange={setShowSheetsAdvancedModal}
        clientId={selectedClientId}
        selectedKeywords={getSelectedKeywords()}
      />

      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".csv,.xlsx,.xls"
        className="hidden"
      />
    </PageTransition>
  );
}
