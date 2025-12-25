'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Search, Loader2, TrendingUp, AlertCircle, CheckCircle2, ChevronDown, Sparkles,
  Copy, Download, FileSpreadsheet, Plus, X, Trash2, Check, RefreshCw, Tag,
  Ruler, DollarSign, HelpCircle, GitCompare, Package, Car, Star, Zap, Heart,
  Shield, Clock, MapPin, Users, ShoppingCart, Settings, Target, Globe, Database,
  ArrowLeft, Hash, Layers, Building2, BarChart3, CheckSquare, Square, RotateCcw,
  Ban, GripVertical, Undo2, Eraser,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { useClientStore } from '@/lib/stores/client-store';
import { groupKeywords } from '@/lib/keyword-grouping';
import { SheetsExportModal, SheetsAdvancedModal } from '@/components/sheets';

// ============================================
// TYPES
// ============================================

interface Project {
  id: number;
  uuid: string;
  name: string;
  main_keyword: string;
  project_type: 'single' | 'bulk';
  status: string;
  total_keywords_found: number | null;
  target_country: string;
  target_language: string;
  seed_keywords?: string[] | string;
  client_id: number;
  client?: { name: string };
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
  status?: 'approved' | 'rejected' | 'pending' | 'trash' | 'negative' | null;
  cluster?: string | null;
  priority?: string | null;
  content_type?: string | null;
  trashed_at?: string | null;
}

type ColumnType = 'approved' | 'pool' | 'trash' | 'negative';

interface AICategory {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
  description?: string;
}

// ============================================
// BADGE COMPONENTS
// ============================================

function DifficultyBadge({ value }: { value?: number | null }) {
  if (value === undefined || value === null) return <span className="text-zinc-600">-</span>;
  const getColor = () => {
    if (value <= 30) return 'bg-emerald-900/20 text-emerald-300 border-emerald-900/30';
    if (value <= 60) return 'bg-yellow-900/20 text-yellow-300 border-yellow-900/30';
    return 'bg-red-900/20 text-red-300 border-red-900/30';
  };
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border tabular-nums', getColor())}>
      {value}
    </span>
  );
}

function IntentBadge({ intent }: { intent?: string | null }) {
  if (!intent) return <span className="text-zinc-600">-</span>;
  const colors: Record<string, string> = {
    'informational': 'bg-teal-900/20 text-teal-300 border-teal-900/30',
    'transactional': 'bg-emerald-900/20 text-emerald-300 border-emerald-900/30',
    'commercial': 'bg-blue-900/20 text-blue-300 border-blue-900/30',
    'navigational': 'bg-amber-900/20 text-amber-300 border-amber-900/30',
    'investigation': 'bg-purple-900/20 text-purple-300 border-purple-900/30',
  };
  const labels: Record<string, string> = {
    'informational': 'I', 'transactional': 'T', 'commercial': 'C',
    'navigational': 'N', 'investigation': 'Inv',
  };
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border', colors[intent.toLowerCase()] || 'bg-zinc-800 text-zinc-400 border-zinc-700')}>
      {labels[intent.toLowerCase()] || intent.charAt(0).toUpperCase()}
    </span>
  );
}

function CategoryBadge({ category, icon }: { category: string; icon?: string }) {
  const colors: Record<string, string> = {
    'Fiyat & Maliyet': 'bg-emerald-900/30 text-emerald-300 border-emerald-800/50',
    'Karşılaştırma': 'bg-blue-900/30 text-blue-300 border-blue-800/50',
    'Marka & Model': 'bg-purple-900/30 text-purple-300 border-purple-800/50',
    'Özellik & Teknik': 'bg-amber-900/30 text-amber-300 border-amber-800/50',
    'Satın Alma': 'bg-pink-900/30 text-pink-300 border-pink-800/50',
    'Bakım & Servis': 'bg-cyan-900/30 text-cyan-300 border-cyan-800/50',
    'Bilgi & Rehber': 'bg-teal-900/30 text-teal-300 border-teal-800/50',
  };

  const defaultColor = 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50';
  const colorClass = Object.entries(colors).find(([key]) => category.toLowerCase().includes(key.toLowerCase()))?.[1] || defaultColor;

  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border truncate max-w-[80px]', colorClass)}>
      {icon && <span className="text-[10px]">{icon}</span>}
      <span className="truncate">{category}</span>
    </span>
  );
}

// ============================================
// DRAGGABLE KEYWORD ROW
// ============================================

interface DraggableKeywordProps {
  kw: KeywordResult;
  columnType: ColumnType;
  isSelected: boolean;
  onSelect: () => void;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  actionColor?: string;
  isActioning?: boolean;
  selectedCount?: number;
  category?: { name: string; icon?: string } | null;
}

function DraggableKeyword({ kw, columnType, isSelected, onSelect, onAction, actionIcon, actionColor, isActioning, selectedCount, category }: DraggableKeywordProps) {
  const id = `${columnType}-${kw.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data: { keyword: kw, columnType, isSelected, selectedCount } });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  // Click handler - select on click, but not when dragging
  const handleClick = (e: React.MouseEvent) => {
    // Don't select if clicking action button
    if ((e.target as HTMLElement).closest('button[data-action]')) return;
    onSelect();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl transition-all group cursor-grab active:cursor-grabbing select-none',
        isDragging ? 'opacity-50 z-50 cursor-grabbing' : 'hover:bg-white/[0.04]',
        isSelected && 'bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_12px_-4px_rgba(var(--primary),0.3)]'
      )}
    >
      {/* Checkbox indicator */}
      <div className="p-0.5 pointer-events-none flex-shrink-0">
        {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5 text-zinc-600" />}
      </div>

      {/* Keyword Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{kw.keyword}</p>
      </div>

      {/* Volume */}
      <span className="text-[10px] text-zinc-400 tabular-nums font-mono w-12 text-right flex-shrink-0">
        {kw.search_volume ? (kw.search_volume >= 1000 ? `${(kw.search_volume / 1000).toFixed(1)}K` : kw.search_volume) : '-'}
      </span>

      {/* KD */}
      <div className="flex-shrink-0">
        <DifficultyBadge value={kw.keyword_difficulty} />
      </div>

      {/* Action Button */}
      {onAction && (
        <button
          data-action="true"
          onClick={(e) => { e.stopPropagation(); onAction(); }}
          disabled={isActioning}
          className={cn('p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0', actionColor || 'hover:bg-zinc-700 text-zinc-500 hover:text-white')}
        >
          {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : actionIcon}
        </button>
      )}
    </div>
  );
}

// ============================================
// DROPPABLE COLUMN
// ============================================

interface DroppableColumnProps {
  id: ColumnType;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  count: number;
  children: React.ReactNode;
  isOver?: boolean;
  headerContent?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyText?: string;
}

function DroppableColumn({ id, title, icon, iconBg, count, children, isOver, headerContent, emptyIcon, emptyText }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-h-0 rounded-2xl transition-all duration-200',
        'bg-white/[0.02] backdrop-blur-xl',
        'border border-white/[0.06]',
        'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.04)]',
        isOver && 'border-primary/50 bg-primary/5 shadow-[0_8px_32px_-8px_rgba(var(--primary),0.2)]'
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.04] flex-shrink-0 bg-white/[0.01] rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn('p-2 rounded-xl backdrop-blur-sm', iconBg)}>{icon}</div>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-[11px] text-zinc-500">{count} keyword</p>
            </div>
          </div>
        </div>
        {headerContent && <div className="mt-2">{headerContent}</div>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-0.5">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="p-4 rounded-2xl bg-white/[0.02] text-zinc-600 mb-3">{emptyIcon}</div>
            <p className="text-xs text-zinc-500">{emptyText}</p>
          </div>
        ) : children}
      </div>
    </div>
  );
}

// ============================================
// TURKISH NORMALIZATION
// ============================================

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

const COUNTRY_FLAGS: Record<string, string> = {
  TR: '🇹🇷', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function KeywordAgentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { selectedClientId, setSelectedClientId } = useClientStore();

  // Project state
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keywords state for all 4 columns
  const [approvedKeywords, setApprovedKeywords] = useState<KeywordResult[]>([]);
  const [poolKeywords, setPoolKeywords] = useState<KeywordResult[]>([]);
  const [trashKeywords, setTrashKeywords] = useState<KeywordResult[]>([]);
  const [negativeKeywords, setNegativeKeywords] = useState<KeywordResult[]>([]);

  // Selection state per column
  const [selectedApproved, setSelectedApproved] = useState<Set<number>>(new Set());
  const [selectedPool, setSelectedPool] = useState<Set<number>>(new Set());
  const [selectedTrash, setSelectedTrash] = useState<Set<number>>(new Set());
  const [selectedNegative, setSelectedNegative] = useState<Set<number>>(new Set());

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);

  // AI categorization state
  const [aiCategories, setAiCategories] = useState<AICategory[]>([]);
  const [aiCategorized, setAiCategorized] = useState(false);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const categorizationStartedRef = useRef(false);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Action states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);

  // Export modals
  const [showSheetsExportModal, setShowSheetsExportModal] = useState(false);
  const [showSheetsAdvancedModal, setShowSheetsAdvancedModal] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    if (projectId) loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch project details
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();

      if (!projectData.success || !projectData.project) {
        throw new Error('Proje bulunamadı');
      }

      const proj = projectData.project;
      setProject(proj);

      if (proj.client_id) setSelectedClientId(proj.client_id);

      // Parse seed keywords for bulk projects
      if (proj.project_type === 'bulk' && proj.seed_keywords) {
        try {
          const seeds = typeof proj.seed_keywords === 'string' ? JSON.parse(proj.seed_keywords) : proj.seed_keywords;
          setSeedKeywords(seeds);
        } catch { setSeedKeywords([]); }
      }

      // Fetch all keyword types in parallel
      const [approvedRes, poolRes, trashRes, negativeRes] = await Promise.all([
        fetch(`/api/projects/${proj.id}/keywords`),
        fetch(`/api/projects/${proj.id}/keywords-raw`),
        fetch(`/api/projects/${proj.id}/keywords-trash`),
        fetch(`/api/projects/${proj.id}/keywords-negative`),
      ]);

      const [approvedData, poolData, trashData, negativeData] = await Promise.all([
        approvedRes.json(),
        poolRes.json(),
        trashRes.json(),
        negativeRes.json(),
      ]);

      if (approvedData.success) setApprovedKeywords(approvedData.data || []);
      if (poolData.success) setPoolKeywords(poolData.data || []);
      if (trashData.success) setTrashKeywords(trashData.data || []);
      if (negativeData.success) setNegativeKeywords(negativeData.data || []);

      // Check AI categorization
      if (poolData.data?.length > 0 && !categorizationStartedRef.current) {
        try {
          const catCheckRes = await fetch(`/api/projects/${proj.id}/keywords-categorize`);
          const catCheckData = await catCheckRes.json();
          if (catCheckData.success && catCheckData.categorization_done && catCheckData.categories) {
            setAiCategories(catCheckData.categories);
            setAiCategorized(true);
            categorizationStartedRef.current = true;
          }
        } catch { /* ignore */ }
      }

    } catch (err: any) {
      console.error('Failed to load project:', err);
      setError(err.message || 'Proje yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // STATUS UPDATE (MOVE BETWEEN COLUMNS)
  // ============================================

  const updateKeywordStatus = async (keywordId: number, newStatus: ColumnType) => {
    if (!project?.id) return false;

    const statusMap: Record<ColumnType, string> = {
      'approved': 'approved',
      'pool': 'pending',
      'trash': 'trash',
      'negative': 'negative',
    };

    try {
      const res = await fetch(`/api/projects/${project.id}/keywords/bulk-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordId, status: statusMap[newStatus] }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const bulkUpdateStatus = async (keywordIds: number[], newStatus: ColumnType) => {
    if (!project?.id || keywordIds.length === 0) return false;

    const statusMap: Record<ColumnType, string> = {
      'approved': 'approved',
      'pool': 'pending',
      'trash': 'trash',
      'negative': 'negative',
    };

    try {
      const res = await fetch(`/api/projects/${project.id}/keywords/bulk-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordIds, status: statusMap[newStatus] }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // ============================================
  // DRAG AND DROP HANDLERS
  // ============================================

  const findKeywordById = (id: string): { keyword: KeywordResult; columnType: ColumnType } | null => {
    const [colType, kwId] = id.split('-');
    const numId = parseInt(kwId);

    if (colType === 'approved') {
      const kw = approvedKeywords.find(k => k.id === numId);
      if (kw) return { keyword: kw, columnType: 'approved' };
    } else if (colType === 'pool') {
      const kw = poolKeywords.find(k => k.id === numId);
      if (kw) return { keyword: kw, columnType: 'pool' };
    } else if (colType === 'trash') {
      const kw = trashKeywords.find(k => k.id === numId);
      if (kw) return { keyword: kw, columnType: 'trash' };
    } else if (colType === 'negative') {
      const kw = negativeKeywords.find(k => k.id === numId);
      if (kw) return { keyword: kw, columnType: 'negative' };
    }
    return null;
  };

  const getSelectedFromColumn = (columnType: ColumnType): Set<number> => {
    switch (columnType) {
      case 'approved': return selectedApproved;
      case 'pool': return selectedPool;
      case 'trash': return selectedTrash;
      case 'negative': return selectedNegative;
    }
  };

  const getKeywordsFromColumn = (columnType: ColumnType): KeywordResult[] => {
    switch (columnType) {
      case 'approved': return approvedKeywords;
      case 'pool': return poolKeywords;
      case 'trash': return trashKeywords;
      case 'negative': return negativeKeywords;
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const targetColumn = over.id as ColumnType;
    if (!['approved', 'pool', 'trash', 'negative'].includes(targetColumn)) return;

    const dragData = findKeywordById(active.id as string);
    if (!dragData) return;

    const { keyword, columnType: sourceColumn } = dragData;
    if (sourceColumn === targetColumn) return;

    const selectedSet = getSelectedFromColumn(sourceColumn);
    const isSelected = selectedSet.has(keyword.id!);

    // Get all keywords to move
    let keywordsToMove: KeywordResult[] = [];
    if (isSelected && selectedSet.size > 1) {
      // Move all selected keywords from this column
      keywordsToMove = getKeywordsFromColumn(sourceColumn).filter(k => k.id && selectedSet.has(k.id));
    } else {
      keywordsToMove = [keyword];
    }

    const keywordIds = keywordsToMove.map(k => k.id!);

    // Optimistic update
    moveKeywordsLocally(keywordsToMove, sourceColumn, targetColumn);

    // Clear selections
    clearSelectionForColumn(sourceColumn);

    // API call
    const success = await bulkUpdateStatus(keywordIds, targetColumn);
    if (!success) {
      // Revert on failure
      moveKeywordsLocally(keywordsToMove, targetColumn, sourceColumn);
      showNotification('error', 'Taşıma başarısız');
    } else {
      const messages: Record<ColumnType, string> = {
        'approved': 'Ana listeye taşındı',
        'pool': 'Havuza taşındı',
        'trash': 'Çöp kutusuna taşındı',
        'negative': 'Negatif listeye taşındı',
      };
      showNotification('success', `${keywordsToMove.length} keyword ${messages[targetColumn]}`);
    }
  };

  const moveKeywordsLocally = (keywords: KeywordResult[], from: ColumnType, to: ColumnType) => {
    const keywordIds = new Set(keywords.map(k => k.id));

    // Remove from source
    switch (from) {
      case 'approved':
        setApprovedKeywords(prev => prev.filter(k => !keywordIds.has(k.id)));
        break;
      case 'pool':
        setPoolKeywords(prev => prev.filter(k => !keywordIds.has(k.id)));
        break;
      case 'trash':
        setTrashKeywords(prev => prev.filter(k => !keywordIds.has(k.id)));
        break;
      case 'negative':
        setNegativeKeywords(prev => prev.filter(k => !keywordIds.has(k.id)));
        break;
    }

    // Add to target
    switch (to) {
      case 'approved':
        setApprovedKeywords(prev => [...keywords, ...prev]);
        break;
      case 'pool':
        setPoolKeywords(prev => [...keywords, ...prev]);
        break;
      case 'trash':
        setTrashKeywords(prev => [...keywords, ...prev]);
        break;
      case 'negative':
        setNegativeKeywords(prev => [...keywords, ...prev]);
        break;
    }
  };

  const clearSelectionForColumn = (column: ColumnType) => {
    switch (column) {
      case 'approved': setSelectedApproved(new Set()); break;
      case 'pool': setSelectedPool(new Set()); break;
      case 'trash': setSelectedTrash(new Set()); break;
      case 'negative': setSelectedNegative(new Set()); break;
    }
  };

  // ============================================
  // SELECTION HELPERS
  // ============================================

  const toggleSelection = (column: ColumnType, id: number) => {
    const setFn = column === 'approved' ? setSelectedApproved
      : column === 'pool' ? setSelectedPool
      : column === 'trash' ? setSelectedTrash
      : setSelectedNegative;

    setFn(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (column: ColumnType) => {
    const keywords = getKeywordsFromColumn(column);
    const ids = new Set(keywords.map(k => k.id!).filter(Boolean));
    switch (column) {
      case 'approved': setSelectedApproved(ids); break;
      case 'pool': setSelectedPool(ids); break;
      case 'trash': setSelectedTrash(ids); break;
      case 'negative': setSelectedNegative(ids); break;
    }
  };

  const deselectAll = (column: ColumnType) => {
    clearSelectionForColumn(column);
  };

  const clearAllSelections = () => {
    setSelectedApproved(new Set());
    setSelectedPool(new Set());
    setSelectedTrash(new Set());
    setSelectedNegative(new Set());
  };

  const totalSelected = selectedApproved.size + selectedPool.size + selectedTrash.size + selectedNegative.size;

  // ============================================
  // BULK ACTIONS
  // ============================================

  const moveSelectedTo = async (targetColumn: ColumnType) => {
    const allSelected: { keyword: KeywordResult; source: ColumnType }[] = [];

    approvedKeywords.filter(k => selectedApproved.has(k.id!)).forEach(k => allSelected.push({ keyword: k, source: 'approved' }));
    poolKeywords.filter(k => selectedPool.has(k.id!)).forEach(k => allSelected.push({ keyword: k, source: 'pool' }));
    trashKeywords.filter(k => selectedTrash.has(k.id!)).forEach(k => allSelected.push({ keyword: k, source: 'trash' }));
    negativeKeywords.filter(k => selectedNegative.has(k.id!)).forEach(k => allSelected.push({ keyword: k, source: 'negative' }));

    // Group by source column
    const bySource = allSelected.reduce((acc, item) => {
      if (!acc[item.source]) acc[item.source] = [];
      acc[item.source].push(item.keyword);
      return acc;
    }, {} as Record<ColumnType, KeywordResult[]>);

    // Move each group
    for (const [source, keywords] of Object.entries(bySource) as [ColumnType, KeywordResult[]][]) {
      if (source === targetColumn) continue;
      moveKeywordsLocally(keywords, source, targetColumn);
    }

    clearAllSelections();

    // API call
    const keywordIds = allSelected.map(item => item.keyword.id!);
    const success = await bulkUpdateStatus(keywordIds, targetColumn);

    if (success) {
      const messages: Record<ColumnType, string> = {
        'approved': 'Ana listeye taşındı',
        'pool': 'Havuza taşındı',
        'trash': 'Çöp kutusuna taşındı',
        'negative': 'Negatif listeye taşındı',
      };
      showNotification('success', `${allSelected.length} keyword ${messages[targetColumn]}`);
    } else {
      loadProject(); // Reload on failure
      showNotification('error', 'Taşıma başarısız');
    }
  };

  const permanentlyDeleteTrash = async () => {
    if (!project?.id || selectedTrash.size === 0) return;

    const idsToDelete = Array.from(selectedTrash);

    try {
      for (const id of idsToDelete) {
        await fetch(`/api/projects/${project.id}/keywords-trash?id=${id}`, { method: 'DELETE' });
      }
      setTrashKeywords(prev => prev.filter(k => !selectedTrash.has(k.id!)));
      setSelectedTrash(new Set());
      showNotification('success', `${idsToDelete.length} keyword kalıcı olarak silindi`);
    } catch {
      showNotification('error', 'Silme başarısız');
    }
  };

  const clearAllTrash = async () => {
    if (!project?.id) return;

    try {
      await fetch(`/api/projects/${project.id}/keywords-trash?all=true`, { method: 'DELETE' });
      setTrashKeywords([]);
      setSelectedTrash(new Set());
      showNotification('success', 'Çöp kutusu temizlendi');
    } catch {
      showNotification('error', 'Temizleme başarısız');
    }
  };

  // ============================================
  // AI CATEGORIZATION
  // ============================================

  const runAiCategorization = async () => {
    if (!project?.id || poolKeywords.length === 0 || isAiCategorizing) return;

    setIsAiCategorizing(true);
    categorizationStartedRef.current = true;

    try {
      const response = await fetch(`/api/projects/${project.id}/keywords-categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: poolKeywords.slice(0, 500).map(kw => ({
            keyword: kw.keyword,
            search_volume: kw.search_volume,
            search_intent: kw.search_intent,
          }))
        })
      });

      const data = await response.json();
      if (data.success && data.categories) {
        setAiCategories(data.categories);
        setAiCategorized(true);
        showNotification('success', `${data.categories.length} kategori oluşturuldu`);
      }
    } catch {
      showNotification('error', 'Kategorileme başarısız');
    } finally {
      setIsAiCategorizing(false);
    }
  };

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================

  const getSelectedKeywords = (): KeywordResult[] => {
    const selected: KeywordResult[] = [];
    approvedKeywords.filter(k => selectedApproved.has(k.id!)).forEach(k => selected.push(k));
    poolKeywords.filter(k => selectedPool.has(k.id!)).forEach(k => selected.push(k));
    trashKeywords.filter(k => selectedTrash.has(k.id!)).forEach(k => selected.push(k));
    negativeKeywords.filter(k => selectedNegative.has(k.id!)).forEach(k => selected.push(k));
    return selected;
  };

  const copySelectedKeywords = () => {
    const keywords = getSelectedKeywords();
    const text = keywords.map(kw => `${kw.keyword}\t${kw.search_volume?.toLocaleString() || ''}`).join('\n');
    navigator.clipboard.writeText(text);
    showNotification('success', `${keywords.length} keyword kopyalandı`);
  };

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
    a.download = `keywords-${project?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', `${keywords.length} keyword indirildi`);
  };

  // ============================================
  // CATEGORY HELPER
  // ============================================

  const getKeywordCategory = useCallback((keyword: string): { name: string; icon?: string } | null => {
    if (!aiCategorized || aiCategories.length === 0) return null;

    const normalizedKw = keyword.toLowerCase().trim();
    for (const cat of aiCategories) {
      if (cat.keywords.some(k => k.toLowerCase().trim() === normalizedKw)) {
        return { name: cat.name, icon: cat.icon };
      }
    }
    return null;
  }, [aiCategories, aiCategorized]);

  // Category stats for pool keywords
  const categoryStats = useMemo(() => {
    if (!aiCategorized || aiCategories.length === 0) return [];

    const approvedSet = new Set(approvedKeywords.map(k => normalizeKeyword(k.keyword)));
    const availablePoolKeywords = poolKeywords.filter(k => !approvedSet.has(normalizeKeyword(k.keyword)));

    return aiCategories.map(cat => {
      const count = cat.keywords.filter(kw =>
        availablePoolKeywords.some(pk => pk.keyword.toLowerCase().trim() === kw.toLowerCase().trim())
      ).length;
      return { ...cat, count };
    }).filter(cat => cat.count > 0).sort((a, b) => b.count - a.count);
  }, [aiCategories, aiCategorized, poolKeywords, approvedKeywords]);

  // ============================================
  // FILTERED LISTS
  // ============================================

  const filteredApproved = useMemo(() => {
    let list = [...approvedKeywords];
    if (searchQuery) list = list.filter(k => k.keyword.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedSeed) list = list.filter(k => k.seed_keyword === selectedSeed);
    return list.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));
  }, [approvedKeywords, searchQuery, selectedSeed]);

  const filteredPool = useMemo(() => {
    const approvedSet = new Set(approvedKeywords.map(k => normalizeKeyword(k.keyword)));
    let list = poolKeywords.filter(k => !approvedSet.has(normalizeKeyword(k.keyword)));
    if (searchQuery) list = list.filter(k => k.keyword.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedSeed) list = list.filter(k => k.seed_keyword === selectedSeed);

    // Filter by selected category
    if (selectedCategory && aiCategorized) {
      const selectedCat = aiCategories.find(c => c.id === selectedCategory);
      if (selectedCat) {
        const catKeywords = new Set(selectedCat.keywords.map(k => k.toLowerCase().trim()));
        list = list.filter(k => catKeywords.has(k.keyword.toLowerCase().trim()));
      }
    }

    return list.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));
  }, [poolKeywords, approvedKeywords, searchQuery, selectedSeed, selectedCategory, aiCategories, aiCategorized]);

  const filteredTrash = useMemo(() => {
    let list = [...trashKeywords];
    if (searchQuery) list = list.filter(k => k.keyword.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [trashKeywords, searchQuery]);

  const filteredNegative = useMemo(() => {
    let list = [...negativeKeywords];
    if (searchQuery) list = list.filter(k => k.keyword.toLowerCase().includes(searchQuery.toLowerCase()));
    return list.sort((a, b) => a.keyword.localeCompare(b.keyword));
  }, [negativeKeywords, searchQuery]);

  // ============================================
  // STATS
  // ============================================

  const stats = useMemo(() => ({
    approved: approvedKeywords.length,
    pool: poolKeywords.length,
    trash: trashKeywords.length,
    negative: negativeKeywords.length,
    totalVolume: approvedKeywords.reduce((sum, k) => sum + (k.search_volume || 0), 0),
  }), [approvedKeywords, poolKeywords, trashKeywords, negativeKeywords]);

  // ============================================
  // ACTIVE DRAG ITEM
  // ============================================

  const activeDragItem = activeId ? findKeywordById(activeId) : null;

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <PageTransition className="h-screen flex items-center justify-center">
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-zinc-400">Proje yükleniyor...</p>
        </div>
      </PageTransition>
    );
  }

  if (error || !project) {
    return (
      <PageTransition className="h-screen flex items-center justify-center">
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-2xl bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-white font-medium">{error || 'Proje bulunamadı'}</p>
          <Link href="/projects">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Projelere Dön
            </button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  const isBulk = project.project_type === 'bulk';
  const countryFlag = COUNTRY_FLAGS[project.target_country] || '🌍';

  return (
    <PageTransition className="h-screen text-white overflow-hidden flex flex-col">
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
            {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="relative z-10 flex-shrink-0 px-3 py-2 border-b border-white/[0.06] bg-zinc-900/50 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          {/* Left: Back + Project Info */}
          <div className="flex items-center gap-3">
            <Link href="/projects">
              <button className="p-2 rounded-lg hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>

            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-lg', isBulk ? 'bg-purple-500/10' : 'bg-blue-500/10')}>
                {isBulk ? <Layers className="h-4 w-4 text-purple-400" /> : <Target className="h-4 w-4 text-blue-400" />}
              </div>
              <div>
                <h1 className="font-semibold text-white text-sm">{project.name}</h1>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <Hash className="h-2.5 w-2.5" />
                  <span>{project.main_keyword}</span>
                  <span>•</span>
                  <span>{countryFlag}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Stats */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm font-semibold tabular-nums">{stats.approved}</span>
              <span className="text-[10px] text-zinc-500">Onaylı</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-sm font-semibold tabular-nums">{stats.pool}</span>
              <span className="text-[10px] text-zinc-500">Havuz</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-sm font-semibold tabular-nums">{stats.trash}</span>
              <span className="text-[10px] text-zinc-500">Çöp</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5 text-red-400" />
              <span className="text-sm font-semibold tabular-nums">{stats.negative}</span>
              <span className="text-[10px] text-zinc-500">Negatif</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Global Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-3 w-3 text-zinc-500" />
                </button>
              )}
            </div>

            {/* Seed Filter */}
            {isBulk && seedKeywords.length > 0 && (
              <select
                value={selectedSeed || ''}
                onChange={(e) => setSelectedSeed(e.target.value || null)}
                className="appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">Tüm Seeds</option>
                {seedKeywords.map(seed => <option key={seed} value={seed}>{seed}</option>)}
              </select>
            )}

            <button onClick={() => loadProject()} className="p-2 rounded-lg hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link href="/keywords/agent">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Yeni
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - 4 Column Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-3 overflow-hidden">

          {/* Column 1: Ana Liste (Approved) */}
          <DroppableColumn
            id="approved"
            title="Ana Liste"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            iconBg="bg-emerald-500/10"
            count={filteredApproved.length}
            isOver={overId === 'approved'}
            emptyIcon={<CheckCircle2 className="h-6 w-6" />}
            emptyText="Onaylı keyword yok"
            headerContent={
              <div className="flex items-center gap-1.5 mt-2">
                {filteredApproved.length > 0 && (
                  <button
                    onClick={() => selectedApproved.size === filteredApproved.length ? deselectAll('approved') : selectAll('approved')}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    {selectedApproved.size === filteredApproved.length ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                    {selectedApproved.size === filteredApproved.length ? 'Kaldır' : 'Tümü'}
                  </button>
                )}
                {selectedApproved.size > 0 && (
                  <>
                    <span className="text-[10px] text-zinc-400">{selectedApproved.size} seçili</span>
                    <button onClick={() => deselectAll('approved')} className="p-1 rounded hover:bg-zinc-700">
                      <X className="h-3 w-3 text-zinc-500" />
                    </button>
                  </>
                )}
              </div>
            }
          >
            {filteredApproved.map(kw => (
              <DraggableKeyword
                key={kw.id}
                kw={kw}
                columnType="approved"
                isSelected={selectedApproved.has(kw.id!)}
                onSelect={() => toggleSelection('approved', kw.id!)}
                selectedCount={selectedApproved.has(kw.id!) ? selectedApproved.size : 1}
              />
            ))}
          </DroppableColumn>

          {/* Column 2: Havuz (Pool) */}
          <DroppableColumn
            id="pool"
            title="Havuz"
            icon={<Database className="h-4 w-4 text-blue-400" />}
            iconBg="bg-blue-500/10"
            count={filteredPool.length}
            isOver={overId === 'pool'}
            emptyIcon={<Database className="h-6 w-6" />}
            emptyText="Havuz boş"
            headerContent={
              <div className="flex items-center gap-1.5 mt-2">
                {/* AI Categorization Button */}
                {isAiCategorizing ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-[10px] text-primary">Kategorileniyor...</span>
                  </div>
                ) : !aiCategorized && poolKeywords.length > 0 ? (
                  <button onClick={runAiCategorization} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-3 w-3" />AI
                  </button>
                ) : null}

                {/* Category Dropdown */}
                {aiCategorized && categoryStats.length > 0 && (
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="appearance-none bg-zinc-800/80 border border-zinc-700 rounded-lg px-2 py-1 text-[10px] text-white focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer min-w-[100px]"
                  >
                    <option value="">Tüm Kategoriler ({filteredPool.length})</option>
                    {categoryStats.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name} ({cat.count})
                      </option>
                    ))}
                  </select>
                )}

                {filteredPool.length > 0 && (
                  <button
                    onClick={() => selectedPool.size === filteredPool.length ? deselectAll('pool') : selectAll('pool')}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    {selectedPool.size === filteredPool.length ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                    {selectedPool.size === filteredPool.length ? 'Kaldır' : 'Tümü'}
                  </button>
                )}
                {selectedPool.size > 0 && (
                  <>
                    <span className="text-[10px] text-zinc-400">{selectedPool.size} seçili</span>
                    <button onClick={() => deselectAll('pool')} className="p-1 rounded hover:bg-zinc-700">
                      <X className="h-3 w-3 text-zinc-500" />
                    </button>
                  </>
                )}
              </div>
            }
          >
            {filteredPool.map(kw => (
              <DraggableKeyword
                key={kw.id}
                kw={kw}
                columnType="pool"
                isSelected={selectedPool.has(kw.id!)}
                onSelect={() => toggleSelection('pool', kw.id!)}
                selectedCount={selectedPool.has(kw.id!) ? selectedPool.size : 1}
              />
            ))}
          </DroppableColumn>

          {/* Column 3: Çöp Kutusu (Trash) */}
          <DroppableColumn
            id="trash"
            title="Çöp Kutusu"
            icon={<Trash2 className="h-4 w-4 text-zinc-400" />}
            iconBg="bg-zinc-500/10"
            count={filteredTrash.length}
            isOver={overId === 'trash'}
            emptyIcon={<Trash2 className="h-6 w-6" />}
            emptyText="Çöp kutusu boş"
            headerContent={
              <div className="flex items-center gap-1.5 mt-2">
                {trashKeywords.length > 0 && (
                  <button onClick={clearAllTrash} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20">
                    <Eraser className="h-3 w-3" />Temizle
                  </button>
                )}
                {filteredTrash.length > 0 && (
                  <button
                    onClick={() => selectedTrash.size === filteredTrash.length ? deselectAll('trash') : selectAll('trash')}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    {selectedTrash.size === filteredTrash.length ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                    {selectedTrash.size === filteredTrash.length ? 'Kaldır' : 'Tümü'}
                  </button>
                )}
                {selectedTrash.size > 0 && (
                  <>
                    <span className="text-[10px] text-zinc-400">{selectedTrash.size} seçili</span>
                    <button onClick={() => deselectAll('trash')} className="p-1 rounded hover:bg-zinc-700">
                      <X className="h-3 w-3 text-zinc-500" />
                    </button>
                  </>
                )}
              </div>
            }
          >
            {filteredTrash.map(kw => (
              <DraggableKeyword
                key={kw.id}
                kw={kw}
                columnType="trash"
                isSelected={selectedTrash.has(kw.id!)}
                onSelect={() => toggleSelection('trash', kw.id!)}
                onAction={() => permanentlyDeleteTrash()}
                actionIcon={<X className="h-3 w-3" />}
                actionColor="hover:bg-red-500/20 text-red-400"
                selectedCount={selectedTrash.has(kw.id!) ? selectedTrash.size : 1}
              />
            ))}
          </DroppableColumn>

          {/* Column 4: Negatif Kelimeler (Negative) */}
          <DroppableColumn
            id="negative"
            title="Negatif"
            icon={<Ban className="h-4 w-4 text-red-400" />}
            iconBg="bg-red-500/10"
            count={filteredNegative.length}
            isOver={overId === 'negative'}
            emptyIcon={<Ban className="h-6 w-6" />}
            emptyText="Negatif keyword yok"
            headerContent={
              <div className="flex items-center gap-1.5 mt-2">
                {filteredNegative.length > 0 && (
                  <button
                    onClick={() => selectedNegative.size === filteredNegative.length ? deselectAll('negative') : selectAll('negative')}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    {selectedNegative.size === filteredNegative.length ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                    {selectedNegative.size === filteredNegative.length ? 'Kaldır' : 'Tümü'}
                  </button>
                )}
                {selectedNegative.size > 0 && (
                  <>
                    <span className="text-[10px] text-zinc-400">{selectedNegative.size} seçili</span>
                    <button onClick={() => deselectAll('negative')} className="p-1 rounded hover:bg-zinc-700">
                      <X className="h-3 w-3 text-zinc-500" />
                    </button>
                  </>
                )}
              </div>
            }
          >
            {filteredNegative.map(kw => (
              <DraggableKeyword
                key={kw.id}
                kw={kw}
                columnType="negative"
                isSelected={selectedNegative.has(kw.id!)}
                onSelect={() => toggleSelection('negative', kw.id!)}
                selectedCount={selectedNegative.has(kw.id!) ? selectedNegative.size : 1}
              />
            ))}
          </DroppableColumn>
        </main>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem && (
            <div className="px-3 py-2 rounded-lg bg-zinc-800 border border-primary shadow-xl">
              <div className="flex items-center gap-2">
                <GripVertical className="h-3 w-3 text-zinc-400" />
                <span className="text-xs font-medium text-white">{activeDragItem.keyword.keyword}</span>
                {activeDragItem.keyword.id && getSelectedFromColumn(activeDragItem.columnType).has(activeDragItem.keyword.id) && getSelectedFromColumn(activeDragItem.columnType).size > 1 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary text-white">
                    +{getSelectedFromColumn(activeDragItem.columnType).size - 1}
                  </span>
                )}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {totalSelected > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/[0.15] shadow-2xl">
              <span className="text-sm font-semibold text-white tabular-nums min-w-[60px]">
                {totalSelected} seçili
              </span>

              <div className="h-5 w-px bg-white/10" />

              {/* Move to Column buttons - only show if not selected from that column */}
              {selectedApproved.size === 0 && (
                <button onClick={() => moveSelectedTo('approved')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-xs font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />Ana Liste
                </button>
              )}
              {selectedPool.size === 0 && (
                <button onClick={() => moveSelectedTo('pool')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all text-xs font-medium">
                  <Database className="h-3.5 w-3.5" />Havuz
                </button>
              )}
              {selectedTrash.size === 0 && (
                <button onClick={() => moveSelectedTo('trash')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-400 bg-zinc-500/10 hover:bg-zinc-500/20 transition-all text-xs font-medium">
                  <Trash2 className="h-3.5 w-3.5" />Çöp
                </button>
              )}
              {selectedNegative.size === 0 && (
                <button onClick={() => moveSelectedTo('negative')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all text-xs font-medium">
                  <Ban className="h-3.5 w-3.5" />Negatif
                </button>
              )}

              <div className="h-5 w-px bg-white/10" />

              {/* Export buttons */}
              <button onClick={copySelectedKeywords} className="p-2 rounded-lg text-white bg-white/5 hover:bg-white/10 transition-all" title="Kopyala">
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={exportSelectedCSV} className="p-2 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all" title="CSV İndir">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={() => setShowSheetsAdvancedModal(true)} className="p-2 rounded-lg text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-all" title="Google Sheets">
                <FileSpreadsheet className="h-4 w-4" />
              </button>

              <div className="h-5 w-px bg-white/10" />

              <button onClick={clearAllSelections} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all" title="Seçimi Temizle">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modals */}
      <SheetsExportModal
        open={showSheetsExportModal}
        onOpenChange={setShowSheetsExportModal}
        projectId={projectId}
        clientId={project.client_id}
        selectedKeywords={getSelectedKeywords()}
      />

      <SheetsAdvancedModal
        open={showSheetsAdvancedModal}
        onOpenChange={setShowSheetsAdvancedModal}
        clientId={project.client_id}
        selectedKeywords={getSelectedKeywords()}
      />
    </PageTransition>
  );
}
