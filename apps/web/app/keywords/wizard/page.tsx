'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  Globe,
  TrendingUp,
  Building2,
  CheckCircle2,
  Zap,
  Brain,
  Filter,
  Save,
  Wand2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Layers,
  Check,
  Plus,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { api } from '@/lib/api/client';
import { useClientStore } from '@/lib/stores/client-store';

// ============================================
// TYPES & CONFIG
// ============================================

type Step = 1 | 2 | 3;
type Mode = 'single' | 'bulk';

interface Client {
  id: number;
  name: string;
  website?: string;
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
  keywords?: Array<{
    keyword: string;
    source: string;
    search_volume?: number | null;
    competition?: string | null;
    competition_index?: number | null;
    cpc?: number | null;
    trend?: string | null;
    intent?: string | null;
    cluster?: string | null;
  }>;
  clusters?: Record<string, string[]>;
  saved_to_db?: number;
  ai_used?: boolean;
  error?: string;
}

// Loading steps
const LOADING_STEPS = [
  { id: 'project', icon: Building2, label: 'Proje oluşturuluyor...', duration: 2000 },
  { id: 'suggestions', icon: TrendingUp, label: 'Google Suggestions sorgulanıyor...', duration: 4000 },
  { id: 'dataforseo', icon: Globe, label: 'DataForSEO ile veri çekiliyor...', duration: 8000 },
  { id: 'merge', icon: Filter, label: 'Keywordler birleştiriliyor...', duration: 3000 },
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

const countries = [
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

const STEPS_CONFIG = [
  { num: 1 as const, label: 'Müşteri', icon: Building2 },
  { num: 2 as const, label: 'Mod', icon: Layers },
  { num: 3 as const, label: 'Keyword', icon: Search },
];

const MAX_BULK_KEYWORDS = 100;

// ============================================
// SUB-COMPONENTS
// ============================================

// Step Indicator
interface StepIndicatorProps {
  currentStep: Step;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS_CONFIG.map((s, index) => {
        const Icon = s.icon;
        const isActive = currentStep === s.num;
        const isCompleted = currentStep > s.num;

        return (
          <div key={s.num} className="flex items-center gap-2">
            {/* Step Circle */}
            <motion.div
              className={cn(
                'relative flex flex-col items-center gap-1.5'
              )}
              animate={{
                scale: isActive ? 1.05 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  isActive && 'bg-primary text-white shadow-md shadow-primary/40',
                  isCompleted && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                  !isActive && !isCompleted && 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground border border-[hsl(var(--glass-border-subtle))]'
                )}
                animate={isActive ? {
                  boxShadow: ['0 0 15px hsl(24 95% 53% / 0.3)', '0 0 20px hsl(24 95% 53% / 0.5)', '0 0 15px hsl(24 95% 53% / 0.3)']
                } : {}}
                transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </motion.div>
              <span className={cn(
                'text-xs font-medium',
                isActive && 'text-primary',
                isCompleted && 'text-emerald-400',
                !isActive && !isCompleted && 'text-muted-foreground'
              )}>
                {s.label}
              </span>
            </motion.div>

            {/* Connector Line */}
            {index < STEPS_CONFIG.length - 1 && (
              <div className="w-10 h-0.5 bg-[hsl(var(--glass-border-subtle))] relative overflow-hidden rounded-full">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Client Select Step
interface ClientSelectStepProps {
  clients: Client[];
  selectedClientId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
}

function ClientSelectStep({ clients, selectedClientId, onSelect, isLoading }: ClientSelectStepProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 rounded-3xl bg-[hsl(var(--glass-bg-2))] flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Müşteri Bulunamadı</h3>
        <p className="text-muted-foreground mb-6">Keyword araştırması için önce bir müşteri eklemeniz gerekiyor.</p>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Müşteri Ekle
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-foreground mb-1">Müşteri Seçin</h2>
        <p className="text-sm text-muted-foreground">Keyword araştırması yapılacak müşteriyi seçin</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {clients.map((client, index) => {
          const isSelected = selectedClientId === client.id;
          return (
            <motion.button
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelect(client.id)}
              className={cn(
                'relative p-3 rounded-xl text-left transition-all duration-300',
                'border bg-[hsl(var(--glass-bg-1))]',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                  : 'border-[hsl(var(--glass-border-subtle))] hover:border-[hsl(var(--glass-border-default))] hover:bg-[hsl(var(--glass-bg-2))]'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              )}

              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                  isSelected ? 'bg-primary text-white' : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground'
                )}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    'text-sm font-semibold truncate',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}>
                    {client.name}
                  </h3>
                  {client.website && (
                    <p className="text-xs text-muted-foreground truncate">
                      {client.website}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Müşteri Ekle
        </Link>
      </div>
    </motion.div>
  );
}

// Mode Select Step
interface ModeSelectStepProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

function ModeSelectStep({ mode, onModeChange }: ModeSelectStepProps) {
  const modes = [
    {
      id: 'single' as const,
      title: 'Tekli Arama',
      description: 'Tek keyword analiz et',
      icon: Search,
    },
    {
      id: 'bulk' as const,
      title: 'Toplu Arama',
      description: 'Birden fazla keyword',
      icon: Layers,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-foreground mb-1">Arama Modunu Seçin</h2>
        <p className="text-sm text-muted-foreground">Tek veya toplu keyword araması</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isSelected = mode === m.id;

          return (
            <motion.button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={cn(
                'relative p-4 rounded-xl text-center transition-all duration-300',
                'border',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                  : 'border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))] hover:border-[hsl(var(--glass-border-default))] hover:bg-[hsl(var(--glass-bg-2))]'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              )}

              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto transition-colors',
                isSelected ? 'bg-primary text-white' : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground'
              )}>
                <Icon className="h-6 w-6" />
              </div>

              <h3 className={cn(
                'text-sm font-bold mb-1',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {m.title}
              </h3>
              <p className="text-xs text-muted-foreground">{m.description}</p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Keyword Input Step
interface KeywordInputStepProps {
  mode: Mode;
  keyword: string;
  bulkKeywords: string;
  country: string;
  customRules: string;
  showRulesPanel: boolean;
  onKeywordChange: (value: string) => void;
  onBulkKeywordsChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onCustomRulesChange: (value: string) => void;
  onToggleRulesPanel: () => void;
  onSearch: () => void;
  isLoading: boolean;
  error: string | null;
}

function KeywordInputStep({
  mode,
  keyword,
  bulkKeywords,
  country,
  customRules,
  showRulesPanel,
  onKeywordChange,
  onBulkKeywordsChange,
  onCountryChange,
  onCustomRulesChange,
  onToggleRulesPanel,
  onSearch,
  isLoading,
  error,
}: KeywordInputStepProps) {
  const bulkKeywordList = bulkKeywords
    .split('\n')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  const bulkCount = Math.min(bulkKeywordList.length, MAX_BULK_KEYWORDS);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      onSearch();
    }
  };

  const canSearch = mode === 'single'
    ? keyword.trim().length >= 2
    : bulkCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-foreground mb-1">
          {mode === 'single' ? 'Keyword Girin' : 'Keywordleri Girin'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === 'single'
            ? 'Analiz etmek istediğiniz keyword\'ü yazın'
            : 'Her satıra bir keyword yazın'}
        </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Keyword Input */}
      {mode === 'single' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Örn: dijital pazarlama"
            disabled={isLoading}
            className={cn(
              'w-full h-11 pl-10 pr-4 rounded-xl text-sm',
              'bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>
      )}

      {/* Bulk Keywords Textarea */}
      {mode === 'bulk' && (
        <div className="relative">
          <textarea
            value={bulkKeywords}
            onChange={(e) => onBulkKeywordsChange(e.target.value)}
            placeholder="Her satıra bir keyword yazın..."
            disabled={isLoading}
            rows={5}
            className={cn(
              'w-full p-3 rounded-xl resize-none text-sm',
              'bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          />
          {bulkCount > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
              {bulkCount} / {MAX_BULK_KEYWORDS}
            </div>
          )}
        </div>
      )}

      {/* Country Selection */}
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          disabled={isLoading}
          className={cn(
            'w-full h-11 pl-10 pr-10 rounded-xl appearance-none cursor-pointer text-sm',
            'bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]',
            'text-foreground [&>option]:bg-zinc-900 [&>option]:text-white',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
            'transition-all duration-200',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Custom Rules Panel */}
      <div className="rounded-xl border border-[hsl(var(--glass-border-subtle))] overflow-hidden">
        <button
          onClick={onToggleRulesPanel}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-[hsl(var(--glass-bg-1))] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Özel AI Kuralları</span>
            <span className="text-xs text-muted-foreground">(Opsiyonel)</span>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              showRulesPanel && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {showRulesPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0">
                <textarea
                  value={customRules}
                  onChange={(e) => onCustomRulesChange(e.target.value)}
                  placeholder="AI kuralları..."
                  disabled={isLoading}
                  rows={3}
                  className={cn(
                    'w-full p-3 rounded-lg resize-none text-sm',
                    'bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]',
                    'text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                    'transition-all duration-200',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Button */}
      <motion.button
        onClick={onSearch}
        disabled={isLoading || !canSearch}
        className={cn(
          'w-full h-11 rounded-xl font-semibold text-sm',
          'bg-gradient-to-r from-primary to-orange-500 text-white',
          'shadow-md shadow-primary/30',
          'hover:shadow-lg hover:shadow-primary/40',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          'transition-all duration-300'
        )}
        whileHover={!isLoading && canSearch ? { scale: 1.01 } : {}}
        whileTap={!isLoading && canSearch ? { scale: 0.99 } : {}}
      >
        <span className="flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Aramayı Başlat
            </>
          )}
        </span>
      </motion.button>
    </motion.div>
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
      className="absolute inset-0 z-20 rounded-2xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />

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
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-medium text-foreground mb-6"
        >
          {LOADING_STEPS[currentStep]?.label || 'İşleniyor...'}
        </motion.p>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-8">
          {LOADING_STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-8 bg-primary'
                  : i < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-[hsl(var(--glass-border-subtle))]'
              )}
            />
          ))}
        </div>

        {/* Tip */}
        <motion.div
          key={currentTip}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">İpucu:</span> {TIPS[currentTip]}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function KeywordWizardPage() {
  const router = useRouter();
  const setGlobalClientId = useClientStore((state) => state.setSelectedClientId);

  // Step state
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(0);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('single');
  const [keyword, setKeyword] = useState('');
  const [bulkKeywords, setBulkKeywords] = useState('');
  const [country, setCountry] = useState('TR');
  const [customRules, setCustomRules] = useState('');
  const [showRulesPanel, setShowRulesPanel] = useState(false);

  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        const clientList = data.data || data.clients || [];
        setClients(clientList);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  // Loading animation
  useEffect(() => {
    if (isLoading) {
      setCurrentLoadingStep(0);
      setCurrentTip(0);

      let stepIndex = 0;
      let elapsed = 0;

      loadingIntervalRef.current = setInterval(() => {
        elapsed += 500;
        const currentStepDuration = LOADING_STEPS[stepIndex]?.duration || 2000;

        if (elapsed >= currentStepDuration && stepIndex < LOADING_STEPS.length - 1) {
          stepIndex++;
          setCurrentLoadingStep(stepIndex);
          elapsed = 0;
        }
      }, 500);

      tipIntervalRef.current = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length);
      }, 5000);
    }

    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    };
  }, [isLoading]);

  // Navigation
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return selectedClientId !== null;
      case 2:
        return true;
      case 3:
        return mode === 'single'
          ? keyword.trim().length >= 2
          : bulkKeywords.split('\n').filter((k) => k.trim()).length > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < 3) {
      setDirection(1);
      setStep((s) => (s + 1) as Step);
      setError(null);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => (s - 1) as Step);
      setError(null);
    }
  };

  // Handle client select - auto advance to next step
  const handleClientSelect = (id: number) => {
    setSelectedClientId(id);
    setGlobalClientId(id);
    // Auto-advance after brief delay for visual feedback
    setTimeout(() => {
      setDirection(1);
      setStep(2);
      setError(null);
    }, 300);
  };

  // Handle mode select - auto advance to next step
  const handleModeSelect = (newMode: Mode) => {
    setMode(newMode);
    // Auto-advance after brief delay for visual feedback
    setTimeout(() => {
      setDirection(1);
      setStep(3);
      setError(null);
    }, 300);
  };

  // Handle search
  const handleSearch = async () => {
    if (isLoading) return;

    const keywordToSearch = mode === 'single' ? keyword.trim() : null;
    const keywordsToSearch = mode === 'bulk'
      ? bulkKeywords.split('\n').map((k) => k.trim()).filter((k) => k.length > 0).slice(0, MAX_BULK_KEYWORDS)
      : null;

    if (mode === 'single' && (!keywordToSearch || keywordToSearch.length < 2)) {
      setError('Keyword en az 2 karakter olmalı');
      return;
    }

    if (mode === 'bulk' && (!keywordsToSearch || keywordsToSearch.length === 0)) {
      setError('En az bir keyword girin');
      return;
    }

    if (!selectedClientId) {
      setError('Lütfen bir müşteri seçin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'single' && keywordToSearch) {
        // Single keyword search
        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: selectedClientId,
            name: `Keyword Research: ${keywordToSearch}`,
            main_keyword: keywordToSearch,
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

        const response = await api.post<KeywordResearchResponse>('/keyword-research', {
          keyword: keywordToSearch,
          country: country,
          language: country === 'TR' ? 'tr' : 'en',
          project_id: projectId,
          client_id: selectedClientId,
          custom_rules: customRules.trim() || undefined,
        }, { timeout: 300000 });

        if (response.success && response.keywords && response.keywords.length > 0) {
          await fetch(`/api/projects/${projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'keywords_discovered',
              total_keywords_found: response.keywords.length,
            }),
          });

          const fallbackData = {
            projectId,
            projectUuid,
            keywords: response.keywords,
            stats: response.stats,
            savedAt: Date.now(),
          };
          localStorage.setItem(`keywords-fallback-${projectUuid}`, JSON.stringify(fallbackData));

          router.push(`/keywords/${projectUuid}`);
          return;
        } else {
          throw new Error(response.error || 'Keyword bulunamadı');
        }
      } else if (mode === 'bulk' && keywordsToSearch) {
        // Bulk search - process first keyword and redirect
        // For simplicity in wizard, we'll start the first keyword and redirect to main page
        const firstKeyword = keywordsToSearch[0];

        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: selectedClientId,
            name: `Keyword Research: ${firstKeyword}`,
            main_keyword: firstKeyword,
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

        const response = await api.post<KeywordResearchResponse>('/keyword-research', {
          keyword: firstKeyword,
          country: country,
          language: country === 'TR' ? 'tr' : 'en',
          project_id: projectId,
          client_id: selectedClientId,
          custom_rules: customRules.trim() || undefined,
        }, { timeout: 300000 });

        if (response.success && response.keywords && response.keywords.length > 0) {
          await fetch(`/api/projects/${projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'keywords_discovered',
              total_keywords_found: response.keywords.length,
            }),
          });

          router.push(`/keywords/${projectUuid}`);
          return;
        } else {
          throw new Error(response.error || 'Keyword bulunamadı');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Step content animation variants
  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <PageTransition className="min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative pt-8 pb-4 overflow-hidden">
        <div className="max-w-2xl mx-auto px-6 text-center font-sans">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-sans"
          >
            Keyword Research
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-sm text-muted-foreground"
          >
            Adım adım keyword analizi yapın
          </motion.p>
        </div>
      </section>

      {/* Main Wizard Card */}
      <section className="px-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl glass-2 p-6 md:p-8 overflow-hidden"
          >
            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <LoadingOverlay
                  currentStep={currentLoadingStep}
                  currentTip={currentTip}
                />
              )}
            </AnimatePresence>

            {/* Step Indicator */}
            <StepIndicator currentStep={step} />

            {/* Step Content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {step === 1 && (
                  <ClientSelectStep
                    clients={clients}
                    selectedClientId={selectedClientId}
                    onSelect={handleClientSelect}
                    isLoading={isLoadingClients}
                  />
                )}
                {step === 2 && (
                  <ModeSelectStep
                    mode={mode}
                    onModeChange={handleModeSelect}
                  />
                )}
                {step === 3 && (
                  <KeywordInputStep
                    mode={mode}
                    keyword={keyword}
                    bulkKeywords={bulkKeywords}
                    country={country}
                    customRules={customRules}
                    showRulesPanel={showRulesPanel}
                    onKeywordChange={setKeyword}
                    onBulkKeywordsChange={setBulkKeywords}
                    onCountryChange={setCountry}
                    onCustomRulesChange={setCustomRules}
                    onToggleRulesPanel={() => setShowRulesPanel(!showRulesPanel)}
                    onSearch={handleSearch}
                    isLoading={isLoading}
                    error={error}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {!isLoading && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[hsl(var(--glass-border-subtle))]">
                <motion.button
                  onClick={prevStep}
                  disabled={step === 1}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    step === 1
                      ? 'opacity-0 pointer-events-none'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-2))]'
                  )}
                  whileHover={step !== 1 ? { x: -2 } : {}}
                  whileTap={step !== 1 ? { scale: 0.98 } : {}}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Geri
                </motion.button>

                {step < 3 && (
                  <motion.button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      canProceed()
                        ? 'bg-primary text-white shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                    whileHover={canProceed() ? { x: 2 } : {}}
                    whileTap={canProceed() ? { scale: 0.98 } : {}}
                  >
                    İleri
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Link to classic mode */}
      <section className="px-6 pb-8">
        <div className="max-w-2xl mx-auto text-center">
          <Link
            href="/keywords"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Klasik görünüme dön
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
