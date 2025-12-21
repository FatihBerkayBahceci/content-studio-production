'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  Globe,
  Building2,
  Sparkles,
  ArrowRight,
  Command,
  TrendingUp,
  Filter,
  Brain,
  Wand2,
  Save,
  Layers,
  Clock,
  ChevronRight,
  X,
  Hash,
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

interface RecentProject {
  id: number;
  uuid?: string;
  main_keyword: string;
  client?: { name: string };
  total_keywords_found?: number;
  created_at?: string;
}

interface KeywordResearchResponse {
  success: boolean;
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
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

// Quick actions
const quickActions = [
  { id: 'search', label: 'Keyword Ara', icon: Search, shortcut: 'Enter' },
  { id: 'bulk', label: 'Toplu Arama', icon: Layers, href: '/keywords' },
  { id: 'wizard', label: 'Adım Adım', icon: Sparkles, href: '/keywords/wizard' },
  { id: 'projects', label: 'Projeler', icon: Clock, href: '/tool1' },
];

export default function KeywordsCommandPage() {
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
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const setGlobalClientId = useClientStore((state) => state.setSelectedClientId);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Combined list for navigation
  const navigationItems = useMemo(() => {
    const items: Array<{ type: 'action' | 'project'; data: any }> = [];

    // Add quick actions if keyword is empty
    if (!keyword.trim()) {
      quickActions.forEach(action => {
        items.push({ type: 'action', data: action });
      });
    }

    // Add recent projects filtered by keyword
    const filteredProjects = keyword.trim()
      ? recentProjects.filter(p =>
          p.main_keyword.toLowerCase().includes(keyword.toLowerCase())
        )
      : recentProjects.slice(0, 5);

    filteredProjects.forEach(project => {
      items.push({ type: 'project', data: project });
    });

    return items;
  }, [keyword, recentProjects]);

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

  // Fetch recent projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        if (data.success && data.projects) {
          setRecentProjects(data.projects.slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Sync client to global store
  useEffect(() => {
    if (selectedClientId) {
      setGlobalClientId(selectedClientId);
    }
  }, [selectedClientId, setGlobalClientId]);

  // Auto focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  // Reset selection when keyword changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [keyword]);

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

      const response = await api.post<KeywordResearchResponse>('/keyword-research', {
        keyword: keyword.trim(),
        country: country,
        language: country === 'TR' ? 'tr' : 'en',
        project_id: projectId,
        client_id: selectedClientId,
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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < navigationItems.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = navigationItems[selectedIndex];
      if (selected) {
        if (selected.type === 'action') {
          if (selected.data.href) {
            router.push(selected.data.href);
          } else if (selected.data.id === 'search') {
            handleSearch();
          }
        } else if (selected.type === 'project') {
          router.push(`/keywords/${selected.data.uuid || selected.data.id}`);
        }
      } else if (keyword.trim().length >= 2) {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setKeyword('');
      setShowSettings(false);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedCountry = countries.find(c => c.code === country);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[150px]" />
      </div>

      {/* Command Palette */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        {/* Main Container */}
        <div className="rounded-2xl bg-[hsl(var(--glass-bg-2))] backdrop-blur-xl border border-[hsl(var(--glass-border-subtle))] shadow-2xl shadow-black/40 overflow-hidden">
          {/* Header with settings */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--glass-border-subtle))]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>Command Palette</span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors",
                showSettings
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-3))]"
              )}
            >
              <span>{selectedClient?.name || 'Müşteri seç'}</span>
              <span className="text-muted-foreground">•</span>
              <span>{selectedCountry?.flag}</span>
            </button>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 bg-[hsl(var(--glass-bg-1))] border-b border-[hsl(var(--glass-border-subtle))]">
                  <div className="flex items-center gap-4">
                    {/* Client */}
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Müşteri</label>
                      {isLoadingClients ? (
                        <div className="h-8 rounded-lg bg-muted/20 animate-pulse" />
                      ) : (
                        <select
                          value={selectedClientId || ''}
                          onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full appearance-none bg-[hsl(var(--glass-bg-3))] border border-[hsl(var(--glass-border-subtle))] text-sm text-foreground px-3 py-2 rounded-lg focus:outline-none focus:border-primary/50 [&>option]:bg-zinc-900 [&>option]:text-white"
                        >
                          <option value="">Seçin...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    {/* Country */}
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Ülke</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full appearance-none bg-[hsl(var(--glass-bg-3))] border border-[hsl(var(--glass-border-subtle))] text-sm text-foreground px-3 py-2 rounded-lg focus:outline-none focus:border-primary/50 [&>option]:bg-zinc-900 [&>option]:text-white"
                      >
                        {countries.map(c => (
                          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Input */}
          <div className="relative">
            <div className="flex items-center px-4 py-3">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
              ) : (
                <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Keyword yazın veya komut arayın..."
                className="flex-1 ml-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                disabled={isLoading}
              />
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="p-1 rounded-md hover:bg-[hsl(var(--glass-bg-3))] text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-3"
              >
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Progress */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-4"
              >
                <div className="p-3 rounded-xl bg-[hsl(var(--glass-bg-1))]">
                  <div className="flex items-center gap-3 mb-2">
                    {LOADING_STEPS.map((step, index) => {
                      const isActive = index === currentStep;
                      const isCompleted = index < currentStep;
                      return (
                        <div
                          key={step.id}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors",
                            isCompleted && "bg-primary",
                            isActive && "bg-primary/50",
                            !isActive && !isCompleted && "bg-muted/30"
                          )}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>{LOADING_STEPS[currentStep]?.label}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results List */}
          {!isLoading && (
            <div className="border-t border-[hsl(var(--glass-border-subtle))]">
              {/* Quick Actions or Search Result */}
              {keyword.trim().length >= 2 && (
                <div className="px-2 py-2">
                  <button
                    onClick={handleSearch}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      selectedIndex === 0 && navigationItems[0]?.type !== 'action'
                        ? "bg-primary/10"
                        : "hover:bg-[hsl(var(--glass-bg-3))]"
                    )}
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-foreground font-medium">"{keyword}" için araştırma başlat</span>
                    </div>
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))]">
                      Enter
                    </span>
                  </button>
                </div>
              )}

              {/* Navigation Items */}
              {navigationItems.length > 0 && (
                <div className="px-2 py-2">
                  {!keyword.trim() && (
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Hızlı İşlemler
                    </div>
                  )}
                  {navigationItems.map((item, index) => {
                    const isSelected = index === selectedIndex;

                    if (item.type === 'action') {
                      const action = item.data;
                      const Icon = action.icon;

                      return (
                        <Link
                          key={action.id}
                          href={action.href || '#'}
                          onClick={(e) => {
                            if (action.id === 'search') {
                              e.preventDefault();
                              handleSearch();
                            }
                          }}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                            isSelected ? "bg-[hsl(var(--glass-bg-3))]" : "hover:bg-[hsl(var(--glass-bg-1))]"
                          )}
                        >
                          <div className="p-1.5 rounded-lg bg-[hsl(var(--glass-bg-3))]">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="flex-1 text-foreground">{action.label}</span>
                          {action.shortcut && (
                            <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))]">
                              {action.shortcut}
                            </span>
                          )}
                          {action.href && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </Link>
                      );
                    } else {
                      const project = item.data;
                      return (
                        <Link
                          key={project.id}
                          href={`/keywords/${project.uuid || project.id}`}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                            isSelected ? "bg-[hsl(var(--glass-bg-3))]" : "hover:bg-[hsl(var(--glass-bg-1))]"
                          )}
                        >
                          <div className="p-1.5 rounded-lg bg-[hsl(var(--glass-bg-3))]">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-foreground truncate">{project.main_keyword}</div>
                            <div className="text-xs text-muted-foreground">
                              {project.client?.name} • {project.total_keywords_found || 0} keywords
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </Link>
                      );
                    }
                  })}
                </div>
              )}

              {/* Recent Projects Header */}
              {!keyword.trim() && recentProjects.length > 0 && (
                <div className="px-2 py-2 border-t border-[hsl(var(--glass-border-subtle))]">
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Son Projeler</span>
                    <Link href="/tool1" className="text-primary hover:underline normal-case font-normal">
                      Tümü
                    </Link>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {keyword.trim() && navigationItems.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="text-muted-foreground text-sm">
                    Eşleşen proje bulunamadı
                  </div>
                  <button
                    onClick={handleSearch}
                    className="mt-2 text-primary hover:underline text-sm"
                  >
                    Yeni araştırma başlat
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))]">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))]">↑↓</span>
                  Gezin
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))]">↵</span>
                  Seç
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-[hsl(var(--glass-bg-3))]">Esc</span>
                  Temizle
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Links */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/keywords" className="hover:text-foreground transition-colors">
            Gelişmiş Mod
          </Link>
          <span>•</span>
          <Link href="/keywords/wizard" className="hover:text-foreground transition-colors">
            Wizard
          </Link>
          <span>•</span>
          <Link href="/keywords/minimal" className="hover:text-foreground transition-colors">
            Minimal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
