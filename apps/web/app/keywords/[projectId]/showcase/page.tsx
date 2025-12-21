'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  TrendingUp,
  Target,
  BarChart3,
  Crown,
  Flame,
  Star,
  ArrowUpRight,
  MousePointer2,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Brain,
  Lightbulb,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
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
  opportunity_score?: number | null;
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

// Animated Counter Component
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
}

// 3D Tilt Card Component
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={cn("relative", className)}
    >
      {children}
    </motion.div>
  );
}

// Floating Orb Component
function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.2, 1],
        y: [0, -20, 0],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn("absolute rounded-full blur-3xl pointer-events-none", className)}
    />
  );
}

// Gradient Text Component
function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent",
      "animate-gradient-x bg-[length:200%_auto]",
      className
    )}>
      {children}
    </span>
  );
}

// Magnetic Button Component
function MagneticButton({ children, onClick, className, title }: { children: React.ReactNode; onClick?: () => void; className?: string; title?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
      title={title}
    >
      {children}
    </motion.button>
  );
}

// Command Palette Component
function CommandPalette({
  isOpen,
  onClose,
  keywords,
  suggestions,
  onAddKeyword,
  onRemoveKeyword,
  onCopyAll,
  onExportCSV,
  searchQuery,
  setSearchQuery,
}: {
  isOpen: boolean;
  onClose: () => void;
  keywords: KeywordResult[];
  suggestions: KeywordResult[];
  onAddKeyword: (kw: KeywordResult) => void;
  onRemoveKeyword: (kw: KeywordResult) => void;
  onCopyAll: () => void;
  onExportCSV: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter results based on query
  const filteredKeywords = useMemo(() => {
    if (!query) return keywords.slice(0, 5);
    return keywords.filter(kw => kw.keyword.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  }, [keywords, query]);

  const filteredSuggestions = useMemo(() => {
    if (!query) return suggestions.slice(0, 3);
    return suggestions.filter(kw => kw.keyword.toLowerCase().includes(query.toLowerCase())).slice(0, 3);
  }, [suggestions, query]);

  const actions = [
    { id: 'copy', label: 'Tümünü Kopyala', icon: Copy, action: onCopyAll },
    { id: 'csv', label: 'CSV Olarak İndir', icon: Download, action: onExportCSV },
  ];

  const allItems = [
    ...filteredKeywords.map(kw => ({ type: 'keyword' as const, data: kw })),
    ...filteredSuggestions.map(kw => ({ type: 'suggestion' as const, data: kw })),
    ...actions.map(a => ({ type: 'action' as const, data: a })),
  ];

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item.type === 'keyword') {
        onRemoveKeyword(item.data as KeywordResult);
      } else if (item.type === 'suggestion') {
        onAddKeyword(item.data as KeywordResult);
      } else if (item.type === 'action') {
        (item.data as any).action();
      }
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
          >
            <div className="mx-4 rounded-2xl bg-zinc-900/95 border border-zinc-700/50 shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
                <Command className="h-5 w-5 text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Keyword ara veya komut yaz..."
                  className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-base"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto py-2 showcase-scroll">
                {/* Keywords Section */}
                {filteredKeywords.length > 0 && (
                  <div className="px-2">
                    <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Keywordler
                    </div>
                    {filteredKeywords.map((kw, idx) => {
                      const globalIdx = idx;
                      return (
                        <motion.button
                          key={kw.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => { onRemoveKeyword(kw); onClose(); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
                            selectedIndex === globalIdx
                              ? "bg-orange-500/20 text-orange-400"
                              : "text-zinc-300 hover:bg-zinc-800"
                          )}
                        >
                          <div className="p-1.5 rounded-lg bg-zinc-800">
                            <Minus className="h-3.5 w-3.5 text-red-400" />
                          </div>
                          <span className="flex-1 truncate">{kw.keyword}</span>
                          <span className="text-sm text-zinc-500">
                            {kw.search_volume ? `${(kw.search_volume / 1000).toFixed(1)}K` : '-'}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Suggestions Section */}
                {filteredSuggestions.length > 0 && (
                  <div className="px-2 mt-2">
                    <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Öneriler
                    </div>
                    {filteredSuggestions.map((kw, idx) => {
                      const globalIdx = filteredKeywords.length + idx;
                      return (
                        <motion.button
                          key={kw.id || idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (filteredKeywords.length + idx) * 0.03 }}
                          onClick={() => { onAddKeyword(kw); onClose(); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
                            selectedIndex === globalIdx
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "text-zinc-300 hover:bg-zinc-800"
                          )}
                        >
                          <div className="p-1.5 rounded-lg bg-zinc-800">
                            <Plus className="h-3.5 w-3.5 text-emerald-400" />
                          </div>
                          <span className="flex-1 truncate">{kw.keyword}</span>
                          <span className="text-sm text-zinc-500">
                            {kw.search_volume ? `${(kw.search_volume / 1000).toFixed(1)}K` : '-'}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Actions Section */}
                <div className="px-2 mt-2">
                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Aksiyonlar
                  </div>
                  {actions.map((action, idx) => {
                    const globalIdx = filteredKeywords.length + filteredSuggestions.length + idx;
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: globalIdx * 0.03 }}
                        onClick={() => { action.action(); onClose(); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
                          selectedIndex === globalIdx
                            ? "bg-purple-500/20 text-purple-400"
                            : "text-zinc-300 hover:bg-zinc-800"
                        )}
                      >
                        <div className="p-1.5 rounded-lg bg-zinc-800">
                          <Icon className="h-3.5 w-3.5 text-purple-400" />
                        </div>
                        <span className="flex-1">{action.label}</span>
                        <CornerDownLeft className="h-4 w-4 text-zinc-600" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    <ArrowDown className="h-3 w-3" />
                    gezin
                  </span>
                  <span className="flex items-center gap-1">
                    <CornerDownLeft className="h-3 w-3" />
                    seç
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Command className="h-3 w-3" />K ile aç
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// AI Insights Panel Component
function AIInsightsPanel({ keywords, isVisible }: { keywords: KeywordResult[]; isVisible: boolean }) {
  const [insights, setInsights] = useState<Array<{ icon: any; text: string; type: 'success' | 'warning' | 'info' }>>([]);
  const [displayedInsights, setDisplayedInsights] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  // Generate insights based on keywords
  useEffect(() => {
    if (!isVisible || keywords.length === 0) return;

    const totalVolume = keywords.reduce((sum, kw) => sum + (kw.search_volume || 0), 0);
    const avgDifficulty = keywords.length > 0
      ? Math.round(keywords.reduce((sum, kw) => sum + (kw.keyword_difficulty || 0), 0) / keywords.length)
      : 0;
    const infoCount = keywords.filter(kw => kw.search_intent === 'informational').length;
    const transCount = keywords.filter(kw => kw.search_intent === 'transactional').length;
    const lowDiffCount = keywords.filter(kw => (kw.keyword_difficulty || 0) <= 30).length;
    const highOppCount = keywords.filter(kw => (kw.opportunity_score || 0) >= 70).length;

    const newInsights: Array<{ icon: any; text: string; type: 'success' | 'warning' | 'info' }> = [];

    // Volume insight
    if (totalVolume > 50000) {
      newInsights.push({
        icon: TrendingUp,
        text: `Toplam ${(totalVolume / 1000).toFixed(0)}K aylık arama hacmi tespit edildi. Bu oldukça güçlü bir potansiyel!`,
        type: 'success'
      });
    } else {
      newInsights.push({
        icon: TrendingDown,
        text: `Toplam ${(totalVolume / 1000).toFixed(0)}K aylık hacim. Niş bir pazar için yeterli olabilir.`,
        type: 'info'
      });
    }

    // Difficulty insight
    if (avgDifficulty <= 35) {
      newInsights.push({
        icon: CheckCircle2,
        text: `Ortalama zorluk ${avgDifficulty}% - Bu keywordlerde sıralama şansınız yüksek!`,
        type: 'success'
      });
    } else if (avgDifficulty > 60) {
      newInsights.push({
        icon: AlertTriangle,
        text: `Ortalama zorluk ${avgDifficulty}% - Rekabet yoğun, uzun vadeli strateji gerekli.`,
        type: 'warning'
      });
    }

    // Intent insight
    if (infoCount > keywords.length * 0.4) {
      newInsights.push({
        icon: Lightbulb,
        text: `%${Math.round(infoCount / keywords.length * 100)} bilgilendirici intent. Blog ve rehber içeriklere odaklanın.`,
        type: 'info'
      });
    }
    if (transCount > keywords.length * 0.3) {
      newInsights.push({
        icon: Zap,
        text: `%${Math.round(transCount / keywords.length * 100)} transactional intent. Satış sayfaları için ideal!`,
        type: 'success'
      });
    }

    // Opportunity insight
    if (highOppCount > 0) {
      newInsights.push({
        icon: Crown,
        text: `${highOppCount} adet yüksek fırsat keyword bulundu. Bunlara öncelik verin!`,
        type: 'success'
      });
    }

    // Low difficulty gems
    if (lowDiffCount > 3) {
      newInsights.push({
        icon: Star,
        text: `${lowDiffCount} kolay keyword tespit edildi. Hızlı kazanımlar için harika!`,
        type: 'success'
      });
    }

    setInsights(newInsights);
    setDisplayedInsights(0);
    setCurrentInsightIndex(0);
    setCurrentText('');
  }, [keywords, isVisible]);

  // Typing animation effect
  useEffect(() => {
    if (!isVisible || insights.length === 0 || currentInsightIndex >= insights.length) return;

    const insight = insights[currentInsightIndex];
    let charIndex = 0;
    setIsTyping(true);
    setCurrentText('');

    const typeInterval = setInterval(() => {
      if (charIndex < insight.text.length) {
        setCurrentText(insight.text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setDisplayedInsights(prev => prev + 1);

        // Move to next insight after a delay
        setTimeout(() => {
          setCurrentInsightIndex(prev => prev + 1);
        }, 1500);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [currentInsightIndex, insights, isVisible]);

  if (!isVisible || keywords.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-3xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-zinc-800/50 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20"
            >
              <Bot className="h-5 w-5 text-purple-400" />
            </motion.div>
            <div>
              <h3 className="font-bold text-white">AI Insights</h3>
              <p className="text-xs text-zinc-500">Akıllı analiz sonuçları</p>
            </div>
            {isTyping && (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-auto"
              >
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animation-delay-200" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animation-delay-400" />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Insights */}
        <div className="p-4 space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto showcase-scroll">
          {insights.slice(0, displayedInsights).map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "p-4 rounded-2xl border",
                  insight.type === 'success' && "bg-emerald-500/5 border-emerald-500/20",
                  insight.type === 'warning' && "bg-amber-500/5 border-amber-500/20",
                  insight.type === 'info' && "bg-blue-500/5 border-blue-500/20",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-xl",
                    insight.type === 'success' && "bg-emerald-500/10",
                    insight.type === 'warning' && "bg-amber-500/10",
                    insight.type === 'info' && "bg-blue-500/10",
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      insight.type === 'success' && "text-emerald-400",
                      insight.type === 'warning' && "text-amber-400",
                      insight.type === 'info' && "text-blue-400",
                    )} />
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{insight.text}</p>
                </div>
              </motion.div>
            );
          })}

          {/* Currently typing insight */}
          {currentInsightIndex < insights.length && isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-2xl border",
                insights[currentInsightIndex].type === 'success' && "bg-emerald-500/5 border-emerald-500/20",
                insights[currentInsightIndex].type === 'warning' && "bg-amber-500/5 border-amber-500/20",
                insights[currentInsightIndex].type === 'info' && "bg-blue-500/5 border-blue-500/20",
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  insights[currentInsightIndex].type === 'success' && "bg-emerald-500/10",
                  insights[currentInsightIndex].type === 'warning' && "bg-amber-500/10",
                  insights[currentInsightIndex].type === 'info' && "bg-blue-500/10",
                )}>
                  {(() => {
                    const Icon = insights[currentInsightIndex].icon;
                    return <Icon className={cn(
                      "h-4 w-4",
                      insights[currentInsightIndex].type === 'success' && "text-emerald-400",
                      insights[currentInsightIndex].type === 'warning' && "text-amber-400",
                      insights[currentInsightIndex].type === 'info' && "text-blue-400",
                    )} />;
                  })()}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {currentText}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 align-middle"
                  />
                </p>
              </div>
            </motion.div>
          )}

          {/* Waiting state */}
          {insights.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Brain className="h-8 w-8 text-purple-400/50" />
              </motion.div>
              <p className="text-sm text-zinc-500">Analiz bekleniyor...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800/50 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {displayedInsights}/{insights.length} insight
          </span>
          <div className="flex items-center gap-1">
            {insights.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  idx < displayedInsights ? "bg-purple-400" : "bg-zinc-700"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, suffix, color, delay }: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.8, delay, type: "spring" }}
    >
      <TiltCard>
        <div className={cn(
          "relative p-6 rounded-3xl overflow-hidden",
          "bg-gradient-to-br from-zinc-900/80 to-zinc-950/80",
          "border border-zinc-800/50",
          "backdrop-blur-xl",
          "group hover:border-zinc-700/50 transition-all duration-500"
        )}>
          {/* Glow Effect */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            `bg-gradient-to-br ${color} blur-xl`
          )} style={{ transform: 'translateZ(-50px)' }} />

          {/* Content */}
          <div className="relative z-10">
            <div className={cn(
              "inline-flex p-3 rounded-2xl mb-4",
              `bg-gradient-to-br ${color}`
            )}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={value} />
              {suffix && <span className="text-lg ml-1 text-zinc-400">{suffix}</span>}
            </div>
            <div className="text-sm text-zinc-500">{label}</div>
          </div>

          {/* Decorative Corner */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full" />
        </div>
      </TiltCard>
    </motion.div>
  );
}

// Creative Keywords Table Component
function KeywordsTable({
  keywords,
  selectedKeywords,
  onToggleSelect,
  onRemove,
  isDeletingKeyword,
  maxVolume
}: {
  keywords: KeywordResult[];
  selectedKeywords: Set<number>;
  onToggleSelect: (id: number) => void;
  onRemove: (kw: KeywordResult) => void;
  isDeletingKeyword: number | null;
  maxVolume: number;
}) {
  const tableRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(tableRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={tableRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, type: "spring" }}
      className="rounded-2xl overflow-hidden border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm"
    >
      {/* Table Header */}
      <div className="grid grid-cols-[auto,1fr,120px,100px,80px,80px,50px] gap-4 px-4 py-3 bg-zinc-900/80 border-b border-zinc-800/50 text-xs font-medium text-zinc-500 uppercase tracking-wider">
        <div className="w-6" />
        <div>Keyword</div>
        <div className="text-center">Hacim</div>
        <div className="text-center">Zorluk</div>
        <div className="text-center">Intent</div>
        <div className="text-center">CPC</div>
        <div />
      </div>

      {/* Table Body */}
      <div className="divide-y divide-zinc-800/30">
        {keywords.map((kw, index) => {
          const isSelected = kw.id ? selectedKeywords.has(kw.id) : false;
          const isDeleting = isDeletingKeyword === kw.id;
          const volumePercent = maxVolume > 0 ? ((kw.search_volume || 0) / maxVolume) * 100 : 0;

          return (
            <motion.div
              key={kw.id}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.03 }}
              className={cn(
                "group relative grid grid-cols-[auto,1fr,120px,100px,80px,80px,50px] gap-4 px-4 py-3 items-center transition-all duration-300",
                isSelected
                  ? "bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-transparent"
                  : "hover:bg-zinc-800/30"
              )}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  layoutId={`indicator-${kw.id}`}
                  className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-pink-500"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Checkbox */}
              <motion.button
                onClick={() => kw.id && onToggleSelect(kw.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-6 h-6 flex items-center justify-center"
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                  isSelected
                    ? "bg-gradient-to-br from-orange-500 to-pink-500 border-transparent shadow-lg shadow-orange-500/25"
                    : "border-zinc-600 group-hover:border-zinc-400"
                )}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <CheckSquare className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>

              {/* Keyword */}
              <div className="min-w-0">
                <span className={cn(
                  "font-medium transition-colors",
                  isSelected ? "text-white" : "text-zinc-300 group-hover:text-white"
                )}>
                  {kw.keyword}
                </span>
              </div>

              {/* Volume with Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${volumePercent}%` } : {}}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.02 }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  />
                </div>
                <span className="text-sm font-semibold text-white min-w-[45px] text-right">
                  {kw.search_volume ? `${(kw.search_volume / 1000).toFixed(1)}K` : '-'}
                </span>
              </div>

              {/* Difficulty */}
              <div className="flex justify-center">
                {kw.keyword_difficulty ? (
                  <div className={cn(
                    "relative w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                    kw.keyword_difficulty <= 30 && "bg-emerald-500/20 text-emerald-400",
                    kw.keyword_difficulty > 30 && kw.keyword_difficulty <= 60 && "bg-amber-500/20 text-amber-400",
                    kw.keyword_difficulty > 60 && "bg-red-500/20 text-red-400",
                  )}>
                    {kw.keyword_difficulty}
                    {/* Circular progress */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${kw.keyword_difficulty} 100`}
                        className="opacity-30"
                      />
                    </svg>
                  </div>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </div>

              {/* Intent */}
              <div className="flex justify-center">
                {kw.search_intent ? (
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-lg font-medium",
                    kw.search_intent === 'informational' && "bg-blue-500/20 text-blue-400",
                    kw.search_intent === 'transactional' && "bg-green-500/20 text-green-400",
                    kw.search_intent === 'commercial' && "bg-purple-500/20 text-purple-400",
                    kw.search_intent === 'navigational' && "bg-amber-500/20 text-amber-400",
                  )}>
                    {kw.search_intent.slice(0, 4).toUpperCase()}
                  </span>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </div>

              {/* CPC */}
              <div className="text-center">
                {kw.cpc ? (
                  <span className="text-sm text-emerald-400 font-medium">
                    ${Number(kw.cpc).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center">
                <motion.button
                  onClick={() => onRemove(kw)}
                  disabled={isDeleting}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    "opacity-0 group-hover:opacity-100",
                    "text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                  )}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Suggestion Card Component
function SuggestionCard({
  kw,
  index,
  onAdd,
  isAdding
}: {
  kw: KeywordResult;
  index: number;
  onAdd: () => void;
  isAdding: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      className="group"
    >
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
        "bg-zinc-900/40 hover:bg-zinc-800/40",
        "border border-zinc-800/30 hover:border-zinc-700/50"
      )}>
        {/* Add Button */}
        <motion.button
          onClick={onAdd}
          disabled={isAdding}
          whileHover={{ scale: 1.2, rotate: 180 }}
          whileTap={{ scale: 0.8 }}
          className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 hover:from-emerald-500/30 hover:to-cyan-500/30 transition-colors"
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </motion.button>

        {/* Keyword */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-zinc-300 truncate block">{kw.keyword}</span>
        </div>

        {/* Volume */}
        <span className="flex-shrink-0 text-sm font-medium text-zinc-500">
          {kw.search_volume ? `${(kw.search_volume / 1000).toFixed(1)}K` : '-'}
        </span>
      </div>
    </motion.div>
  );
}

export default function KeywordShowcasePage({ params }: PageProps) {
  const { projectId } = params;

  // Core state
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [rawKeywords, setRawKeywords] = useState<KeywordResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selection
  const [selectedKeywords, setSelectedKeywords] = useState<Set<number>>(new Set());

  // Actions
  const [isAddingKeyword, setIsAddingKeyword] = useState<string | null>(null);
  const [isDeletingKeyword, setIsDeletingKeyword] = useState<number | null>(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // Pagination
  const [mainDisplayCount, setMainDisplayCount] = useState(12);
  const [suggestionsDisplayCount, setSuggestionsDisplayCount] = useState(8);

  // Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Computed values
  const filteredKeywords = useMemo(() => {
    return keywords
      .filter(kw => !searchQuery || kw.keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));
  }, [keywords, searchQuery]);

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

  const stats = useMemo(() => {
    const totalVolume = keywords.reduce((sum, kw) => sum + (kw.search_volume || 0), 0);
    const avgDifficulty = keywords.length > 0
      ? Math.round(keywords.reduce((sum, kw) => sum + (kw.keyword_difficulty || 0), 0) / keywords.length)
      : 0;
    const highOpportunity = keywords.filter(kw => (kw.opportunity_score || 0) >= 70).length;
    return { totalVolume, avgDifficulty, highOpportunity };
  }, [keywords]);

  // Max volume for table visualization
  const maxVolume = useMemo(() => {
    return Math.max(...keywords.map(kw => kw.search_volume || 0), 1);
  }, [keywords]);

  // Actions
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

  const removeSelectedKeywords = async () => {
    if (selectedKeywords.size === 0) return;
    setIsDeletingSelected(true);
    const selectedIds = Array.from(selectedKeywords);
    for (const id of selectedIds) {
      try {
        await fetch(`/api/projects/${projectId}/keywords?id=${id}`, { method: 'DELETE' });
        setKeywords(prev => prev.filter(k => k.id !== id));
      } catch (err) {}
    }
    setSelectedKeywords(new Set());
    setIsDeletingSelected(false);
  };

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

  const copySelected = () => {
    const selected = keywords.filter(kw => selectedKeywords.has(kw.id!));
    if (selected.length === 0) return;
    navigator.clipboard.writeText(selected.map(kw => `${kw.keyword}\t${kw.search_volume || ''}`).join('\n'));
  };

  const handleExportCSV = () => {
    const selected = keywords.filter(kw => selectedKeywords.has(kw.id!));
    if (selected.length === 0) return;
    const headers = ['Keyword', 'Hacim', 'CPC', 'Rekabet'];
    const rows = selected.map(kw => [kw.keyword, kw.search_volume || '', kw.cpc || '', kw.competition || '']);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `keywords-${project?.main_keyword || projectId}.csv`;
    a.click();
  };

  // Copy all keywords (for command palette)
  const copyAllKeywords = () => {
    if (keywords.length === 0) return;
    navigator.clipboard.writeText(keywords.map(kw => `${kw.keyword}\t${kw.search_volume || ''}`).join('\n'));
  };

  // Export all keywords as CSV (for command palette)
  const exportAllCSV = () => {
    if (keywords.length === 0) return;
    const headers = ['Keyword', 'Hacim', 'CPC', 'Rekabet'];
    const rows = keywords.map(kw => [kw.keyword, kw.search_volume || '', kw.cpc || '', kw.competition || '']);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `keywords-${project?.main_keyword || projectId}.csv`;
    a.click();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <FloatingOrb className="w-64 h-64 bg-orange-500/30 -top-32 -left-32" />
          <FloatingOrb className="w-48 h-48 bg-purple-500/30 -bottom-24 -right-24" delay={1} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative z-10"
          >
            <div className="w-20 h-20 rounded-full border-4 border-orange-500/30 border-t-orange-500" />
          </motion.div>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-zinc-500 whitespace-nowrap"
          >
            Veriler yükleniyor...
          </motion.p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="p-6 rounded-3xl bg-red-500/10 inline-block mb-6">
            <AlertCircle className="h-16 w-16 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Hata Oluştu</h2>
          <p className="text-zinc-400 mb-8">{error}</p>
          <Link href="/keywords" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium">
            <ArrowLeft className="h-5 w-5" /> Geri Dön
          </Link>
        </motion.div>
      </div>
    );
  }

  const displayedKeywords = filteredKeywords.slice(0, mainDisplayCount);
  const displayedSuggestions = suggestions.slice(0, suggestionsDisplayCount);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <FloatingOrb className="w-[600px] h-[600px] bg-orange-500/20 top-[-200px] left-[-200px]" />
        <FloatingOrb className="w-[500px] h-[500px] bg-purple-500/20 top-[30%] right-[-150px]" delay={2} />
        <FloatingOrb className="w-[400px] h-[400px] bg-cyan-500/20 bottom-[-100px] left-[30%]" delay={4} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_70%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/50 backdrop-blur-xl bg-black/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/keywords">
                <motion.div
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-zinc-400" />
                </motion.div>
              </Link>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-bold"
                >
                  <GradientText>{project?.main_keyword}</GradientText>
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 text-sm text-zinc-500"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {project?.created_at ? new Date(project.created_at).toLocaleDateString('tr-TR') : '-'}
                  {project?.client_name && (
                    <>
                      <span>•</span>
                      <Building2 className="h-3.5 w-3.5" />
                      {project.client_name}
                    </>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Search & Command Palette Button */}
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ara..."
                  className="w-64 pl-11 pr-4 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-sm placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </motion.div>

              {/* Command Palette Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors group"
              >
                <Command className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                <kbd className="text-xs font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">K</kbd>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={BarChart3}
              label="Toplam Keyword"
              value={keywords.length}
              color="from-orange-500/20 to-pink-500/20"
              delay={0}
            />
            <StatCard
              icon={TrendingUp}
              label="Toplam Hacim"
              value={stats.totalVolume}
              color="from-cyan-500/20 to-blue-500/20"
              delay={0.1}
            />
            <StatCard
              icon={Target}
              label="Ortalama Zorluk"
              value={stats.avgDifficulty}
              suffix="%"
              color="from-purple-500/20 to-pink-500/20"
              delay={0.2}
            />
            <StatCard
              icon={Crown}
              label="Yüksek Fırsat"
              value={stats.highOpportunity}
              color="from-amber-500/20 to-orange-500/20"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-10 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {/* Left Column: Keywords + Suggestions */}
            <div className="flex-1 space-y-8">
              {/* Keywords Section */}
              <div>
              <div className="flex items-center justify-between mb-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20">
                    <Flame className="h-5 w-5 text-orange-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Seçilen Keywordler</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {keywords.length}
                  </span>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={selectedKeywords.size > 0 ? deselectAllKeywords : selectAllKeywords}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {selectedKeywords.size > 0 ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                </motion.button>
              </div>

              {keywords.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl bg-zinc-900/50 border border-zinc-800/50 p-12 text-center"
                >
                  <div className="p-4 rounded-2xl bg-amber-500/10 inline-block mb-4">
                    <AlertCircle className="h-10 w-10 text-amber-400" />
                  </div>
                  <p className="text-zinc-400">Henüz keyword eklenmemiş</p>
                </motion.div>
              ) : (
                <>
                  <KeywordsTable
                    keywords={displayedKeywords}
                    selectedKeywords={selectedKeywords}
                    onToggleSelect={toggleKeywordSelection}
                    onRemove={removeKeywordFromMain}
                    isDeletingKeyword={isDeletingKeyword}
                    maxVolume={maxVolume}
                  />

                  {mainDisplayCount < filteredKeywords.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-8 text-center"
                    >
                      <MagneticButton
                        onClick={() => setMainDisplayCount(prev => prev + 12)}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700/50 text-white font-medium hover:border-zinc-600/50 transition-colors"
                      >
                        Daha Fazla Yükle
                        <span className="ml-2 text-zinc-500">({mainDisplayCount}/{filteredKeywords.length})</span>
                      </MagneticButton>
                    </motion.div>
                  )}
                </>
              )}
              </div>

              {/* Suggestions Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
              <div className="rounded-3xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm overflow-hidden">
                {/* Panel Header */}
                <div className="p-5 border-b border-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                        <Sparkles className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h3 className="font-bold text-white">Öneriler</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {suggestions.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel Body */}
                <div className="p-4 max-h-[600px] overflow-y-auto space-y-2 showcase-scroll">
                  {suggestions.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-sm">
                      Tüm öneriler eklendi
                    </div>
                  ) : (
                    <>
                      {displayedSuggestions.map((kw, index) => (
                        <SuggestionCard
                          key={kw.id || index}
                          kw={kw}
                          index={index}
                          onAdd={() => addKeywordToMain(kw)}
                          isAdding={isAddingKeyword === kw.keyword}
                        />
                      ))}

                      {suggestionsDisplayCount < suggestions.length && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSuggestionsDisplayCount(prev => prev + 8)}
                          className="w-full py-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                          Daha Fazla ({suggestionsDisplayCount}/{suggestions.length})
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              </div>
              </motion.div>
            </div>

            {/* Right Column: AI Insights Panel */}
            <div className="w-[350px] flex-shrink-0">
              <div className="sticky top-24">
                <AIInsightsPanel keywords={keywords} isVisible={!isLoading && keywords.length > 0} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        keywords={keywords}
        suggestions={suggestions}
        onAddKeyword={addKeywordToMain}
        onRemoveKeyword={removeKeywordFromMain}
        onCopyAll={copyAllKeywords}
        onExportCSV={exportAllCSV}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedKeywords.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl shadow-black/50">
              {/* Selection Count */}
              <div className="flex items-center gap-2 pr-4 border-r border-zinc-700">
                <motion.div
                  key={selectedKeywords.size}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center font-bold text-white"
                >
                  {selectedKeywords.size}
                </motion.div>
                <span className="text-sm text-zinc-400">seçili</span>
              </div>

              {/* Actions */}
              <MagneticButton onClick={copySelected} className="p-3 rounded-xl hover:bg-zinc-800 transition-colors" title="Kopyala">
                <Copy className="h-5 w-5 text-zinc-400 hover:text-white transition-colors" />
              </MagneticButton>

              <MagneticButton onClick={handleExportCSV} className="p-3 rounded-xl hover:bg-emerald-500/10 transition-colors" title="CSV">
                <Download className="h-5 w-5 text-emerald-400" />
              </MagneticButton>

              <MagneticButton onClick={() => setShowSheetsExportModal(true)} className="p-3 rounded-xl hover:bg-green-500/10 transition-colors" title="Sheets">
                <FileSpreadsheet className="h-5 w-5 text-green-400" />
              </MagneticButton>

              <MagneticButton onClick={() => setShowSheetsAdvancedModal(true)} className="p-3 rounded-xl hover:bg-purple-500/10 transition-colors" title="Gelişmiş">
                <Settings className="h-5 w-5 text-purple-400" />
              </MagneticButton>

              <div className="w-px h-6 bg-zinc-700 mx-1" />

              <MagneticButton
                onClick={removeSelectedKeywords}
                className="p-3 rounded-xl hover:bg-red-500/10 transition-colors"
                title="Sil"
              >
                {isDeletingSelected ? <Loader2 className="h-5 w-5 text-red-400 animate-spin" /> : <Trash2 className="h-5 w-5 text-red-400" />}
              </MagneticButton>

              <MagneticButton onClick={deselectAllKeywords} className="p-3 rounded-xl hover:bg-zinc-800 transition-colors">
                <X className="h-5 w-5 text-zinc-400 hover:text-white transition-colors" />
              </MagneticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <SheetsExportModal
        open={showSheetsExportModal}
        onOpenChange={setShowSheetsExportModal}
        projectId={projectId}
        clientId={project?.client_id ?? null}
        selectedKeywords={keywords.filter(kw => selectedKeywords.has(kw.id!))}
      />

      <SheetsAdvancedModal
        open={showSheetsAdvancedModal}
        onOpenChange={setShowSheetsAdvancedModal}
        clientId={project?.client_id ?? null}
        selectedKeywords={keywords.filter(kw => selectedKeywords.has(kw.id!))}
      />

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }

        /* Modern Scrollbar Styles */
        .showcase-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .showcase-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .showcase-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(249,115,22,0.4) 0%, rgba(168,85,247,0.4) 100%);
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .showcase-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(249,115,22,0.7) 0%, rgba(168,85,247,0.7) 100%);
        }
        .showcase-scroll::-webkit-scrollbar-corner {
          background: transparent;
        }

        /* Firefox */
        .showcase-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(249,115,22,0.4) transparent;
        }

        /* Global scrollbar for this page */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(24,24,27,0.5);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f97316 0%, #a855f7 100%);
          border-radius: 10px;
          border: 2px solid rgba(24,24,27,0.5);
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #fb923c 0%, #c084fc 100%);
        }
      `}</style>
    </div>
  );
}
