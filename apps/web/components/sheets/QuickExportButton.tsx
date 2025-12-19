'use client';

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Loader2,
  Check,
  ChevronDown,
  Settings,
  ExternalLink,
  AlertCircle,
  Plus,
  Replace,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import {
  useSheetsConfigs,
  useExportToSheets,
} from '@/lib/hooks/use-sheets-config';
import type { SheetsConfig } from '@/lib/api/sheets-config';
import { getLastUsedConfig, setLastUsedConfig } from '@/lib/utils/sheets-preferences';

interface KeywordData {
  id?: number;
  keyword: string;
  search_volume?: number | null;
  keyword_difficulty?: number | null;
  cpc?: number | null;
  competition?: string | null;
  search_intent?: string | null;
  opportunity_score?: number | null;
  ai_category?: string | null;
}

interface QuickExportButtonProps {
  projectId: string;
  clientId: number | null;
  selectedKeywords: KeywordData[];
  disabled?: boolean;
  className?: string;
}

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

export function QuickExportButton({
  projectId,
  clientId,
  selectedKeywords,
  disabled = false,
  className,
}: QuickExportButtonProps) {
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SheetsConfig | null>(null);
  const [exportResult, setExportResult] = useState<{
    rows: number;
    url: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: configsData, isLoading: configsLoading } = useSheetsConfigs(clientId);
  const exportToSheets = useExportToSheets();

  const configs = configsData?.success && configsData.data ? configsData.data : [];
  const hasConfigs = configs.length > 0;
  const defaultConfig = configs.find(c => c.is_default) || configs[0];

  // Load last used config preference
  useEffect(() => {
    if (!configs.length) return;

    const lastUsedId = getLastUsedConfig(projectId);
    if (lastUsedId) {
      const found = configs.find(c => c.id === lastUsedId);
      if (found) {
        setSelectedConfig(found);
        return;
      }
    }

    // Fall back to default config
    if (defaultConfig) {
      setSelectedConfig(defaultConfig);
    }
  }, [configs, projectId, defaultConfig]);

  // Handle export
  const handleExport = async (mode: 'append' | 'replace') => {
    if (!selectedConfig || !selectedKeywords.length) return;

    setShowDropdown(false);
    setExportState('exporting');
    setError(null);

    try {
      const keywordIds = selectedKeywords
        .map(kw => kw.id)
        .filter((id): id is number => id !== undefined);

      const result = await exportToSheets.mutateAsync({
        projectId,
        configId: selectedConfig.id,
        keywordIds,
        writeMode: mode,
      });

      if (result.success && result.data) {
        setExportResult({
          rows: result.data.rows_written,
          url: result.data.spreadsheet_url,
        });
        setExportState('success');

        // Save preference
        setLastUsedConfig(projectId, selectedConfig.id);

        // Reset after 4 seconds
        setTimeout(() => {
          setExportState('idle');
          setExportResult(null);
        }, 4000);
      } else {
        setError(result.error || 'Export başarısız');
        setExportState('error');

        setTimeout(() => {
          setExportState('idle');
          setError(null);
        }, 4000);
      }
    } catch (err) {
      setError('Export başarısız');
      setExportState('error');

      setTimeout(() => {
        setExportState('idle');
        setError(null);
      }, 4000);
    }
  };

  // Loading state
  if (configsLoading) {
    return (
      <button
        disabled
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
          'bg-[hsl(var(--glass-bg-2))] text-muted-foreground',
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </button>
    );
  }

  // No configs - show link to client settings
  if (!hasConfigs) {
    if (!clientId) {
      return null; // Don't show anything if no clientId
    }

    return (
      <a
        href={`/clients/${clientId}`}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
          'bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary',
          className
        )}
      >
        <Settings className="h-4 w-4" />
        Sheets Ayarla
      </a>
    );
  }

  // Success state
  if (exportState === 'success' && exportResult) {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        className
      )}>
        <Check className="h-4 w-4" />
        <span>{exportResult.rows} satır aktarıldı</span>
        <a
          href={exportResult.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 hover:text-emerald-300"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  // Error state
  if (exportState === 'error') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
        'bg-red-500/20 text-red-400 border border-red-500/30',
        className
      )}>
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  // Exporting state
  if (exportState === 'exporting') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
        'bg-green-500/10 text-green-400 border border-green-500/30',
        className
      )}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Aktarılıyor...</span>
      </div>
    );
  }

  // Normal state - show export button with dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled || !selectedKeywords.length}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
          'bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span>Sheets'e Aktar</span>
        {selectedKeywords.length > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20">
            {selectedKeywords.length}
          </span>
        )}
        <ChevronDown className={cn(
          'h-4 w-4 transition-transform',
          showDropdown && 'rotate-180'
        )} />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl glass-3 border border-[hsl(var(--glass-border-default))] shadow-xl overflow-hidden"
            >
              {/* Target info */}
              <div className="px-3 py-2 border-b border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))]">
                <p className="text-xs text-muted-foreground">Hedef:</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedConfig?.config_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedConfig?.sheet_name}
                </p>
              </div>

              {/* Export options */}
              <div className="p-2">
                <button
                  onClick={() => handleExport('append')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <Plus className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Altına Ekle</p>
                    <p className="text-xs text-muted-foreground">Mevcut verilerin altına ekle</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('replace')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <Replace className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Üzerine Yaz</p>
                    <p className="text-xs text-muted-foreground">Mevcut verileri sil ve yaz</p>
                  </div>
                </button>
              </div>

              {/* Config selection - only if multiple configs */}
              {configs.length > 1 && (
                <div className="border-t border-[hsl(var(--glass-border-subtle))] p-2">
                  <p className="px-2 py-1 text-xs text-muted-foreground">Farklı Sheet seç:</p>
                  {configs.filter(c => c.id !== selectedConfig?.id).map((config) => (
                    <button
                      key={config.id}
                      onClick={() => {
                        setSelectedConfig(config);
                        setLastUsedConfig(projectId, config.id);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span className="truncate">{config.config_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Settings link */}
              {clientId && (
                <div className="border-t border-[hsl(var(--glass-border-subtle))] p-2">
                  <a
                    href={`/clients/${clientId}`}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Ayarları Düzenle
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
