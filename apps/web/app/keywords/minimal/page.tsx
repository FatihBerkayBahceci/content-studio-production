'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  Globe,
  Building2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  TrendingUp,
  Filter,
  Brain,
  Wand2,
  Save,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { api } from '@/lib/api/client';
import { useClientStore } from '@/lib/stores/client-store';

// Types
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
  };
  keywords?: any[];
  error?: string;
}

// Loading steps
const LOADING_STEPS = [
  { id: 'project', icon: Building2, label: 'Proje oluşturuluyor' },
  { id: 'suggestions', icon: TrendingUp, label: 'Google Suggestions' },
  { id: 'dataforseo', icon: Globe, label: 'DataForSEO verileri' },
  { id: 'merge', icon: Filter, label: 'Birleştiriliyor' },
  { id: 'ai_select', icon: Brain, label: 'AI seçimi' },
  { id: 'enrich', icon: Wand2, label: 'Zenginleştirme' },
  { id: 'save', icon: Save, label: 'Kaydediliyor' },
];

// Countries
const countries = [
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'US', name: 'US', flag: '🇺🇸' },
  { code: 'GB', name: 'UK', flag: '🇬🇧' },
  { code: 'DE', name: 'DE', flag: '🇩🇪' },
  { code: 'FR', name: 'FR', flag: '🇫🇷' },
];

export default function KeywordsMinimalPage() {
  const router = useRouter();

  // States
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('TR');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const setGlobalClientId = useClientStore((state) => state.setSelectedClientId);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        if (data.success && (data.data || data.clients)) {
          const clientList = data.data || data.clients;
          setClients(clientList);
          if (clientList.length > 0) {
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

  // Sync client to global store
  useEffect(() => {
    if (selectedClientId) {
      setGlobalClientId(selectedClientId);
    }
  }, [selectedClientId, setGlobalClientId]);

  // Loading animation
  useEffect(() => {
    if (isLoading) {
      setCurrentStep(0);
      const durations = [2000, 4000, 8000, 3000, 6000, 5000, 2000];
      let stepIndex = 0;

      const advanceStep = () => {
        if (stepIndex < LOADING_STEPS.length - 1) {
          stepIndex++;
          setCurrentStep(stepIndex);
          loadingIntervalRef.current = setTimeout(advanceStep, durations[stepIndex]);
        }
      };
      loadingIntervalRef.current = setTimeout(advanceStep, durations[0]);
    } else {
      if (loadingIntervalRef.current) {
        clearTimeout(loadingIntervalRef.current);
      }
    }
    return () => {
      if (loadingIntervalRef.current) clearTimeout(loadingIntervalRef.current);
    };
  }, [isLoading]);

  // Handle search
  const handleSearch = async () => {
    if (isLoading) return;

    if (!keyword.trim() || keyword.trim().length < 2) {
      setError('Keyword en az 2 karakter olmalı');
      return;
    }

    if (!selectedClientId) {
      setError('Lütfen bir müşteri seçin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create project
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          name: `Keyword Research: ${keyword.trim()}`,
          main_keyword: keyword.trim(),
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

      // Call keyword research API
      const response = await api.post<KeywordResearchResponse>('/keyword-research', {
        keyword: keyword.trim(),
        country: country,
        language: country === 'TR' ? 'tr' : 'en',
        project_id: projectId,
        client_id: selectedClientId,
      }, { timeout: 300000 });

      if (response.success && response.keywords?.length) {
        // Update project
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'keywords_discovered',
            total_keywords_found: response.keywords.length,
          }),
        });

        // Redirect to results
        router.push(`/keywords/${projectUuid}`);
        return;
      } else {
        setError(response.error || 'Keyword araştırması başarısız oldu');
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Logo / Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Keyword Research</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          AI destekli keyword araştırması
        </p>
      </motion.div>

      {/* Main Search Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <div
          className={cn(
            "relative rounded-2xl transition-all duration-300",
            isFocused
              ? "shadow-2xl shadow-primary/20 ring-2 ring-primary/30"
              : "shadow-xl shadow-black/10"
          )}
        >
          {/* Input Container */}
          <div className="flex items-center bg-[hsl(var(--glass-bg-2))] backdrop-blur-sm border border-[hsl(var(--glass-border-subtle))] rounded-2xl">
            {/* Search Icon */}
            <div className="pl-4">
              <Search className={cn(
                "h-5 w-5 transition-colors",
                isFocused ? "text-primary" : "text-muted-foreground"
              )} />
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Keyword yazın..."
              className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-lg"
              disabled={isLoading}
            />

            {/* Country Selector */}
            <div className="relative pr-2">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="appearance-none bg-[hsl(var(--glass-bg-3))] text-sm font-medium text-foreground pl-3 pr-8 py-2 rounded-xl focus:outline-none cursor-pointer border border-transparent hover:border-[hsl(var(--glass-border-subtle))] transition-colors [&>option]:bg-zinc-900 [&>option]:text-white"
                disabled={isLoading}
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>

            {/* Search Button */}
            <motion.button
              onClick={handleSearch}
              disabled={isLoading || !keyword.trim()}
              className="mr-2 p-3 rounded-xl bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Client Selector - Below search */}
        <div className="mt-4 flex items-center justify-center">
          {isLoadingClients ? (
            <div className="h-8 w-40 rounded-lg bg-muted/20 animate-pulse" />
          ) : clients.length === 0 ? (
            <Link
              href="/clients/new"
              className="text-sm text-primary hover:underline"
            >
              + Müşteri ekle
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
                className="appearance-none bg-transparent text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white"
                disabled={isLoading}
              >
                <option value="">Müşteri seç</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-center text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8"
            >
              <div className="flex items-center justify-center gap-4">
                {LOADING_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <motion.div
                      key={step.id}
                      className="flex flex-col items-center"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: isActive || isCompleted ? 1 : 0.3 }}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          isActive && "bg-primary/20 text-primary scale-110",
                          isCompleted && "bg-emerald-500/20 text-emerald-400",
                          !isActive && !isCompleted && "bg-muted/20 text-muted-foreground"
                        )}
                      >
                        {isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-muted-foreground mt-4"
              >
                {LOADING_STEPS[currentStep]?.label}...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 flex items-center gap-6 text-sm text-muted-foreground"
      >
        <Link href="/keywords" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" />
          Gelişmiş Mod
        </Link>
        <Link href="/keywords/wizard" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Wizard
        </Link>
        <Link href="/tool1" className="hover:text-foreground transition-colors">
          Projeler
        </Link>
      </motion.div>
    </div>
  );
}
