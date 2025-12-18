'use client';

import { useState, useEffect } from 'react';
import {
  X, FileSpreadsheet, Loader2, Check, AlertCircle,
  ExternalLink, ChevronRight, RefreshCw, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import {
  useSheetsConfigs,
  useSheetsCheck,
  useExportToSheets,
} from '@/lib/hooks/use-sheets-config';
import type { SheetsConfig } from '@/lib/api/sheets-config';

interface KeywordData {
  id?: number;
  keyword: string;
  search_volume?: number | null;
  [key: string]: any;
}

interface SheetsExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  clientId: number | null;
  selectedKeywords: KeywordData[];
}

type Step = 'select' | 'check' | 'confirm' | 'exporting' | 'success' | 'error';

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
          className="relative w-full max-w-lg rounded-2xl glass-3 border border-[hsl(var(--glass-border-default))] shadow-2xl overflow-hidden"
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
                      <button
                        onClick={handleClose}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-2))] hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Konfigürasyon Ekle
                      </button>
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

          {/* Footer */}
          {(step === 'select' || step === 'success' || step === 'error') && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--glass-border-subtle))]">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
              >
                {step === 'success' || step === 'error' ? 'Kapat' : 'İptal'}
              </button>

              {step === 'select' && configs.length > 0 && (
                <button
                  onClick={handleCheck}
                  disabled={!selectedConfigId}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-500/90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Aktar
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
