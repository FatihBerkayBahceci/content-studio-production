'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  Sparkles,
  Database,
  Upload,
  Globe,
  ChevronDown,
  History,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Building2,
  Clock,
  TrendingUp,
  X,
  FileSpreadsheet,
  Settings2,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { useClientStore } from '@/lib/stores/client-store';
import * as XLSX from 'xlsx';

// ============================================
// TYPES
// ============================================

interface Client {
  id: number;
  name: string;
  domain?: string;
  website?: string;
  logo_url?: string;
}

interface RecentProject {
  id: number;
  uuid: string;
  main_keyword: string;
  project_type: 'single' | 'bulk';
  client?: { name: string };
  total_keywords_found?: number;
  created_at: string;
  seed_keywords?: string | string[];
}

// ============================================
// CONSTANTS
// ============================================

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const REGIONS = [
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'US', name: 'ABD', flag: '🇺🇸' },
  { code: 'GB', name: 'İngiltere', flag: '🇬🇧' },
  { code: 'DE', name: 'Almanya', flag: '🇩🇪' },
  { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
];

const LOADING_STEPS = [
  { label: 'Proje oluşturuluyor...', duration: 3000 },
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
  { label: 'AI chunk analizi yapılıyor...', duration: 60000 },
  { label: 'Sonuçlar kaydediliyor...', duration: 10000 },
];

// ============================================
// CLIENT DROPDOWN COMPONENT
// ============================================

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
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Müşteri</label>
        <div className="h-11 w-full rounded-xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Müşteri</label>
        <Link href="/clients/new">
          <div className="flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-white/[0.1] text-zinc-500 hover:text-white hover:border-primary/50 transition-colors cursor-pointer">
            <Building2 className="h-4 w-4" />
            <span className="text-sm">Müşteri ekle</span>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Müşteri</label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
          'bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15]',
          'focus:outline-none focus:ring-1 focus:ring-primary',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {selectedClient ? (
          <>
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05] flex items-center justify-center">
              {selectedClient.logo_url ? (
                <img src={selectedClient.logo_url} alt={selectedClient.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-zinc-400">{selectedClient.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{selectedClient.name}</p>
              {(selectedClient.domain || selectedClient.website) && <p className="text-xs text-zinc-500 truncate">{selectedClient.domain || selectedClient.website}</p>}
            </div>
          </>
        ) : (
          <span className="text-sm text-zinc-500">Müşteri seçin</span>
        )}
        <ChevronDown className={cn('h-4 w-4 text-zinc-500 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
      </button>

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
                  {(client.domain || client.website) && <p className="text-xs text-zinc-500 truncate">{client.domain || client.website}</p>}
                </div>
                {selectedClientId === client.id && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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

  // Recent projects
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState('');

  // Excel import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    loadClients();
    loadRecentProjects();
  }, []);

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        const clientList = data.data || data.clients || [];
        setClients(clientList);
        if (clientList.length > 0 && !selectedClientId) {
          setSelectedClientId(clientList[0].id);
          setGlobalClientId(clientList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const loadRecentProjects = async () => {
    try {
      const res = await fetch('/api/projects?limit=6');
      const data = await res.json();
      if (data.success) {
        setRecentProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // ============================================
  // EXCEL IMPORT
  // ============================================

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Extract keywords from Excel - look for keyword-like strings
      const extractedKeywords: string[] = [];

      jsonData.forEach((row) => {
        row.forEach((cell) => {
          if (typeof cell === 'string' && cell.trim()) {
            const cleaned = cell.trim();
            // Filter out headers and non-keyword content
            if (
              cleaned.length > 1 &&
              cleaned.length < 100 &&
              !cleaned.match(/^(keyword|anahtar|kelime|query|sorgu|search|arama|volume|hacim|kd|difficulty|cpc|intent|#|no|sıra)/i)
            ) {
              extractedKeywords.push(cleaned);
            }
          }
        });
      });

      // Remove duplicates
      const uniqueKeywords = Array.from(new Set(extractedKeywords));

      if (uniqueKeywords.length > 0) {
        setKeywords(uniqueKeywords.join('\n'));
        setMode('bulk');
        showNotification('success', `${uniqueKeywords.length} keyword Excel'den içe aktarıldı`);
      } else {
        showNotification('error', 'Excel dosyasında keyword bulunamadı');
      }
    } catch (err) {
      console.error('Excel import error:', err);
      showNotification('error', 'Excel dosyası okunamadı');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ============================================
  // LOADING ANIMATION
  // ============================================

  useEffect(() => {
    if (!isLoading) return;

    const steps = mode === 'bulk' ? BULK_LOADING_STEPS : LOADING_STEPS;
    let currentStep = 0;
    setLoadingStep(0);
    setLoadingLabel(steps[0].label);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(currentStep);
        setLoadingLabel(steps[currentStep].label);
      }
    }, steps[currentStep]?.duration || 3000);

    return () => clearInterval(interval);
  }, [isLoading, mode]);

  // ============================================
  // FORM SUBMISSION
  // ============================================

  const handleSubmit = async () => {
    if (!keywords.trim() || !selectedClientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const keywordList = keywords.split('\n').map(k => k.trim()).filter(Boolean);
      const isBulk = mode === 'bulk' || keywordList.length > 1;
      const mainKeyword = keywordList[0];

      // Step 1: Create project first
      console.log('[Keyword Agent] Step 1: Creating project...');
      const createProjectRes = await fetch('/api/n8n/tool1/project/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          project_name: mainKeyword, // Use main keyword as project name
          main_keyword: mainKeyword,
          scenario_type: 'seed_keyword',
          target_language: language,
          target_country: region,
          // For bulk projects, send all keywords as seed_keywords
          seed_keywords: isBulk ? keywordList : undefined,
          project_type: isBulk ? 'bulk' : 'single'
        }),
      });

      const projectData = await createProjectRes.json();
      console.log('[Keyword Agent] Project created:', projectData);

      // Handle nested data structure from N8N
      const projectInfo = projectData.data || projectData;

      if (!projectData.success || !projectInfo.project_id) {
        throw new Error(projectData.error || projectInfo.error || 'Proje oluşturulamadı');
      }

      const projectId = projectInfo.project_id;
      const projectUuid = projectInfo.uuid || projectInfo.project_uuid;

      // Step 2: Run keyword research with project_id
      console.log('[Keyword Agent] Step 2: Running keyword research with project_id:', projectId);
      const endpoint = isBulk ? '/api/n8n/bulk-keyword-research' : '/api/n8n/keyword-research';
      const body = isBulk
        ? { keywords: keywordList, language, country: region, client_id: selectedClientId, project_id: projectId, ai_context: aiContext || undefined }
        : { keyword: mainKeyword, language, country: region, client_id: selectedClientId, project_id: projectId, ai_context: aiContext || undefined };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log('[Keyword Agent] Keyword research result:', {
        success: data.success,
        project_id: data.project_id,
        message: data.message?.substring(0, 100)
      });

      if (!data.success) {
        throw new Error(data.error || 'Araştırma başarısız');
      }

      // Use the UUID from project creation
      if (projectUuid) {
        showNotification('success', 'Araştırma tamamlandı!');
        router.push(`/keywords/agent/${projectUuid}`);
      } else {
        // Fallback: fetch project to get UUID
        const projectFetchRes = await fetch(`/api/projects/${projectId}`);
        const projectFetchData = await projectFetchRes.json();
        if (projectFetchData.success && projectFetchData.project?.uuid) {
          showNotification('success', 'Araştırma tamamlandı!');
          router.push(`/keywords/agent/${projectFetchData.project.uuid}`);
        } else {
          throw new Error('Proje UUID bulunamadı');
        }
      }
    } catch (err: any) {
      console.error('Research error:', err);
      setError(err.message || 'Bir hata oluştu');
      showNotification('error', err.message || 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const steps = mode === 'bulk' ? BULK_LOADING_STEPS : LOADING_STEPS;

  return (
    <PageTransition className="min-h-screen text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={cn(
              'fixed top-4 left-1/2 z-50 px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl flex items-center gap-2 text-sm font-medium border',
              notification.type === 'success' ? 'bg-emerald-500/80 border-emerald-400/30' : 'bg-red-500/80 border-red-400/30'
            )}
          >
            {notification.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-500 shadow-lg shadow-primary/30 mb-6"
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold mb-2"
          >
            Keyword Araştırma
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400"
          >
            AI destekli keyword araştırması yapın
          </motion.p>
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden"
        >
          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center"
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
                    key={loadingStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm font-medium text-white mb-2"
                  >
                    {loadingLabel}
                  </motion.p>
                </AnimatePresence>

                <p className="text-xs text-zinc-500 mb-4">Adım {loadingStep + 1} / {steps.length}</p>

                <div className="flex items-center gap-1.5">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        index < loadingStep ? 'w-6 bg-primary' : index === loadingStep ? 'w-6 bg-primary/60' : 'w-1.5 bg-zinc-700'
                      )}
                      animate={index === loadingStep ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 space-y-5">
            {/* Mode Toggle */}
            <div className="flex justify-center">
              <div className="bg-white/[0.03] backdrop-blur-sm p-1 rounded-xl flex text-sm font-medium border border-white/[0.06]">
                <button
                  onClick={() => setMode('single')}
                  disabled={isLoading}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-all flex items-center gap-2',
                    mode === 'single' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Search className="h-4 w-4" />
                  Tekli Sorgu
                </button>
                <button
                  onClick={() => setMode('bulk')}
                  disabled={isLoading}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-all flex items-center gap-2',
                    mode === 'bulk' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Database className="h-4 w-4" />
                  Toplu Sorgu
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-zinc-500 hover:text-white hover:bg-white/5"
                >
                  <Upload className="h-4 w-4" />
                  Excel
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelImport}
                className="hidden"
              />
            </div>

            {/* Imported file indicator */}
            {importedFileName && (
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>{importedFileName}</span>
                <button onClick={() => { setImportedFileName(null); setKeywords(''); }} className="p-0.5 hover:bg-white/10 rounded">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Client Selection */}
            <ClientDropdown
              clients={clients}
              selectedClientId={selectedClientId}
              onSelect={(id) => {
                setSelectedClientId(id);
                if (id) setGlobalClientId(id);
              }}
              isLoading={isLoadingClients}
              disabled={isLoading}
            />

            {/* Keyword Input */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                {mode === 'single' ? 'Anahtar Kelime' : 'Anahtar Kelimeler (her satıra bir tane)'}
              </label>
              {mode === 'single' ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="örn: elektrikli araba"
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              ) : (
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="elektrikli araba&#10;hibrit araba&#10;elektrikli suv"
                  rows={5}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none disabled:opacity-50"
                />
              )}
              {mode === 'bulk' && keywords && (
                <p className="mt-1 text-xs text-zinc-500">
                  {keywords.split('\n').filter(k => k.trim()).length} anahtar kelime
                </p>
              )}
            </div>

            {/* Language & Region */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Dil</label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isLoading}
                    className="w-full appearance-none bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Bölge</label>
                <div className="relative">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    disabled={isLoading}
                    className="w-full appearance-none bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                  >
                    {REGIONS.map(r => (
                      <option key={r.code} value={r.code}>{r.flag} {r.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* AI Context Toggle & Input */}
            <div>
              <button
                type="button"
                onClick={() => setShowAiContext(!showAiContext)}
                disabled={isLoading}
                className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>AI Yönlendirme</span>
                <ChevronDown className={cn('h-3 w-3 transition-transform', showAiContext && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {showAiContext && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3">
                      <textarea
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        placeholder="AI'a ek bilgi verin. Örn: 'Sadece satın alma niyetli keywordleri seç', 'B2B odaklı keywordlere öncelik ver', 'Fiyat içeren keywordleri dahil et' vb."
                        rows={3}
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none disabled:opacity-50"
                      />
                      <p className="mt-1.5 text-xs text-zinc-600">
                        Bu prompt, AI'ın keyword seçim kriterlerini yönlendirmek için kullanılır.
                      </p>
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
                  className="p-3 rounded-xl bg-red-900/20 border border-red-900/30 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-900/30 rounded">
                    <X className="h-3 w-3 text-red-400" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !keywords.trim() || !selectedClientId}
              className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-medium py-3.5 px-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Araştırmayı Başlat
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Recent Projects */}
        {!isLoadingProjects && recentProjects.length > 0 && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                <History className="h-4 w-4" />
                Son Projeler
              </h2>
              <Link href="/projects" className="text-xs text-primary hover:underline">
                Tümünü gör
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentProjects.slice(0, 6).map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <Link href={`/keywords/agent/${project.uuid}`}>
                    <div className="group p-4 rounded-xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] hover:border-primary/30 hover:bg-white/[0.04] transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'p-1.5 rounded-lg',
                            project.project_type === 'bulk' ? 'bg-purple-500/10' : 'bg-blue-500/10'
                          )}>
                            {project.project_type === 'bulk' ? (
                              <Database className="h-3.5 w-3.5 text-purple-400" />
                            ) : (
                              <Search className="h-3.5 w-3.5 text-blue-400" />
                            )}
                          </div>
                          <span className="text-xs text-zinc-500">{project.client?.name}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>

                      <h3 className="font-medium text-white truncate mb-2 group-hover:text-primary transition-colors">
                        {project.main_keyword}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {project.total_keywords_found || 0} kw
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(project.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
