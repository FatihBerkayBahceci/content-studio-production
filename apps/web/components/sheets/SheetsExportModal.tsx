'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X, FileSpreadsheet, Loader2, Check, AlertCircle,
  ExternalLink, ChevronRight, RefreshCw, Plus, Eye, Table2,
  ChevronLeft, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import {
  useSheetsConfigs,
  useSheetsCheck,
  useExportToSheets,
  KEYWORD_FIELDS,
} from '@/lib/hooks/use-sheets-config';
import type { SheetsConfig } from '@/lib/api/sheets-config';
import { setLastUsedConfig } from '@/lib/utils/sheets-preferences';

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
  source?: string;
  keyword_cluster?: string | null;
  content_priority?: string | null;
}

interface SheetsExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  clientId: number | null;
  selectedKeywords: KeywordData[];
}

type Step = 'select' | 'preview' | 'check' | 'confirm' | 'exporting' | 'success' | 'error';

export function SheetsExportModal({
  open,
  onOpenChange,
  projectId,
  clientId,
  selectedKeywords,
}: SheetsExportModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<SheetsConfig | null>(null);
  const [existingDataInfo, setExistingDataInfo] = useState<{
    has_data: boolean;
    row_count: number;
  } | null>(null);
  const [writeMode, setWriteMode] = useState<'append' | 'replace'>('append');
  const [exportResult, setExportResult] = useState<{
    rows_written: number;
    url: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: configsData, isLoading: configsLoading } = useSheetsConfigs(clientId);
  const sheetsCheck = useSheetsCheck();
  const exportToSheets = useExportToSheets();

  const configs = configsData?.success && configsData.data ? configsData.data : [];

  // Get mapped columns for preview
  const mappedColumns = useMemo(() => {
    if (!selectedConfig) return [];

    return Object.entries(selectedConfig.column_mappings)
      .map(([field, column]) => {
        const fieldInfo = KEYWORD_FIELDS.find(f => f.key === field);
        return {
          field,
          column,
          label: fieldInfo?.label || field,
        };
      })
      .sort((a, b) => a.column.localeCompare(b.column));
  }, [selectedConfig]);

  // Get preview data (first 5 rows)
  const previewData = useMemo(() => {
    if (!selectedConfig) return [];

    const getFieldValue = (kw: KeywordData, field: string): unknown => {
      switch (field) {
        case 'keyword': return kw.keyword;
        case 'search_volume': return kw.search_volume;
        case 'keyword_difficulty': return kw.keyword_difficulty;
        case 'cpc': return kw.cpc;
        case 'competition': return kw.competition;
        case 'search_intent': return kw.search_intent;
        case 'opportunity_score': return kw.opportunity_score;
        case 'ai_category': return kw.ai_category;
        default: return '';
      }
    };

    return selectedKeywords.slice(0, 5).map(kw => {
      const row: Record<string, unknown> = {};
      for (const [field, column] of Object.entries(selectedConfig.column_mappings)) {
        row[column] = getFieldValue(kw, field) ?? '';
      }
      return row;
    });
  }, [selectedConfig, selectedKeywords]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('select');
      setSelectedConfigId(null);
      setSelectedConfig(null);
      setExistingDataInfo(null);
      setWriteMode('append');
      setExportResult(null);
      setError(null);

      // Auto-select default config if exists
      const defaultConfig = configs.find(c => c.is_default);
      if (defaultConfig) {
        setSelectedConfigId(defaultConfig.id);
        setSelectedConfig(defaultConfig);
      }
    }
  }, [open, configs]);

  // Handle config selection
  const handleConfigSelect = (config: SheetsConfig) => {
    setSelectedConfigId(config.id);
    setSelectedConfig(config);
  };

  // Go to preview step
  const handleGoToPreview = () => {
    if (selectedConfig) {
      setStep('preview');
    }
  };

  // Handle check and proceed
  const handleCheck = async () => {
    if (!selectedConfig) return;

    setStep('check');
    setError(null);

    try {
      const result = await sheetsCheck.mutateAsync({
        spreadsheetId: selectedConfig.spreadsheet_id,
        sheetName: selectedConfig.sheet_name,
        columnMappings: selectedConfig.column_mappings,
        startRow: selectedConfig.start_row,
      });

      if (result.success) {
        setExistingDataInfo({
          has_data: result.has_existing_data,
          row_count: result.existing_row_count,
        });

        if (result.has_existing_data) {
          setStep('confirm');
        } else {
          // No existing data, proceed to export
          handleExport('append');
        }
      } else {
        setError(result.error || 'Kontrol sırasında hata oluştu');
        setStep('error');
      }
    } catch (err) {
      // If check fails (e.g., n8n not configured), proceed anyway
      console.warn('Sheets check failed, proceeding with export:', err);
      handleExport('append');
    }
  };

  // Handle export
  const handleExport = async (mode: 'append' | 'replace') => {
    if (!selectedConfig) return;

    setWriteMode(mode);
    setStep('exporting');
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
          rows_written: result.data.rows_written,
          url: result.data.spreadsheet_url,
        });
        setStep('success');
      } else {
        setError(result.error || 'Export sırasında hata oluştu');
        setStep('error');
      }
    } catch (err) {
      setError('Export işlemi başarısız oldu');
      setStep('error');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "relative w-full rounded-2xl glass-3 border border-[hsl(var(--glass-border-default))] shadow-2xl overflow-hidden",
            step === 'preview' ? 'max-w-2xl' : 'max-w-lg'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--glass-border-subtle))]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FileSpreadsheet className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Sheets'e Aktar</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedKeywords.length} anahtar kelime seçili
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step: Select Config */}
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {configsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : configs.length === 0 ? (
                    <div className="text-center py-8">
                      <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-foreground font-medium mb-1">Konfigürasyon bulunamadı</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Önce müşteri ayarlarından bir Sheets konfigürasyonu ekleyin
                      </p>
                      {clientId && (
                        <a
                          href={`/clients/${clientId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Müşteri Ayarlarına Git
                        </a>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Verilerin aktarılacağı Sheets konfigürasyonunu seçin
                      </p>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {configs.map((config) => (
                          <button
                            key={config.id}
                            onClick={() => handleConfigSelect(config)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                              selectedConfigId === config.id
                                ? 'border-primary bg-primary/5'
                                : 'border-[hsl(var(--glass-border-subtle))] hover:border-primary/50'
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg',
                              selectedConfigId === config.id ? 'bg-primary/10' : 'bg-[hsl(var(--glass-bg-2))]'
                            )}>
                              <FileSpreadsheet className={cn(
                                'h-4 w-4',
                                selectedConfigId === config.id ? 'text-primary' : 'text-muted-foreground'
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {config.config_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {config.sheet_name}
                              </p>
                            </div>
                            {config.is_default && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                Varsayılan
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step: Preview */}
              {step === 'preview' && selectedConfig && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Summary */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--glass-bg-1))]">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Veri Önizlemesi</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedKeywords.length} satır → {selectedConfig.sheet_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Hedef</p>
                      <p className="text-sm font-medium text-foreground">{selectedConfig.config_name}</p>
                    </div>
                  </div>

                  {/* Column mapping info */}
                  <div className="flex flex-wrap gap-2">
                    {mappedColumns.map(({ field, column, label }) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[hsl(var(--glass-bg-2))] text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">{column}</span>
                        <span>→</span>
                        <span>{label}</span>
                      </span>
                    ))}
                  </div>

                  {/* Preview table */}
                  <div className="border border-[hsl(var(--glass-border-subtle))] rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[hsl(var(--glass-bg-2))]">
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                            {mappedColumns.map(({ column, label }) => (
                              <th
                                key={column}
                                className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-foreground">{column}</span>
                                  <span className="text-muted-foreground">({label})</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-t border-[hsl(var(--glass-border-subtle))]"
                            >
                              <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                              {mappedColumns.map(({ column }) => (
                                <td
                                  key={column}
                                  className="px-3 py-2 text-foreground truncate max-w-[150px]"
                                >
                                  {String(row[column] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {selectedKeywords.length > 5 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center bg-[hsl(var(--glass-bg-1))] border-t border-[hsl(var(--glass-border-subtle))]">
                        ... ve {selectedKeywords.length - 5} satır daha
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step: Checking */}
              {step === 'check' && (
                <motion.div
                  key="check"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-foreground font-medium">Kontrol ediliyor...</p>
                  <p className="text-sm text-muted-foreground">
                    Hedef sütunlarda mevcut veri kontrol ediliyor
                  </p>
                </motion.div>
              )}

              {/* Step: Confirm (existing data) */}
              {step === 'confirm' && existingDataInfo && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-400">Mevcut veri bulundu</p>
                      <p className="text-sm text-amber-300/80 mt-1">
                        Hedef sütunlarda <strong>{existingDataInfo.row_count}</strong> satır veri mevcut.
                        Ne yapmak istersiniz?
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleExport('append')}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-[hsl(var(--glass-border-subtle))] hover:border-primary/50 transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground">Alta Ekle</p>
                        <p className="text-sm text-muted-foreground">
                          Mevcut verilerin altına yeni satırlar ekle
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>

                    <button
                      onClick={() => handleExport('replace')}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-[hsl(var(--glass-border-subtle))] hover:border-red-500/50 transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground">Üzerine Yaz</p>
                        <p className="text-sm text-muted-foreground">
                          Mevcut verileri sil ve yenilerini yaz
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step: Exporting */}
              {step === 'exporting' && (
                <motion.div
                  key="exporting"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-green-400 mb-4" />
                  <p className="text-foreground font-medium">Aktarılıyor...</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedKeywords.length} anahtar kelime Google Sheets'e yazılıyor
                  </p>
                </motion.div>
              )}

              {/* Step: Success */}
              {step === 'success' && exportResult && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-1">
                    Aktarım Başarılı!
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {exportResult.rows_written} satır başarıyla aktarıldı
                  </p>
                  <a
                    href={exportResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Sheet'i Aç
                  </a>
                </motion.div>
              )}

              {/* Step: Error */}
              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <X className="h-8 w-8 text-red-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-1">
                    Hata Oluştu
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {error || 'Aktarım sırasında bir hata oluştu'}
                  </p>
                  <button
                    onClick={() => setStep('select')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-2))] hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tekrar Dene
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer - hide during setup as form has its own buttons */}
          {(step === 'select' || step === 'preview' || step === 'success' || step === 'error') && (
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[hsl(var(--glass-border-subtle))]">
              <div>
                {step === 'preview' && (
                  <button
                    onClick={() => setStep('select')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Geri
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
                >
                  {step === 'success' || step === 'error' ? 'Kapat' : 'İptal'}
                </button>

                {step === 'select' && configs.length > 0 && (
                  <button
                    onClick={handleGoToPreview}
                    disabled={!selectedConfigId}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Önizle
                  </button>
                )}

                {step === 'preview' && (
                  <button
                    onClick={handleCheck}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-500/90 text-white transition-colors"
                  >
                    Aktar
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
