'use client';

import { useState, useEffect } from 'react';
import {
  X, FileSpreadsheet, Loader2, Check, AlertCircle,
  ExternalLink, PenLine, Plus, RefreshCw, ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import {
  useSheetsConfigs,
  useAdvancedSheetsWrite,
  useGetCellValue,
  useGetRowData,
} from '@/lib/hooks/use-sheets-config';
import type { SheetsConfig, WriteMode } from '@/lib/api/sheets-config';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

type AdvancedMode = 'update_cell' | 'insert_row' | 'update_row';

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

interface SheetsAdvancedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number | null;
  selectedKeywords: KeywordData[];
  initialMode?: AdvancedMode;
}

type Step = 'config' | 'processing' | 'success' | 'error';

const TABS: { key: AdvancedMode; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: 'update_cell',
    label: 'Hücreye Ekle',
    icon: <PenLine className="h-4 w-4" />,
    description: 'Mevcut hücreye değer ekle',
  },
  {
    key: 'insert_row',
    label: 'Araya Satır',
    icon: <Plus className="h-4 w-4" />,
    description: 'Belirtilen satıra ekle',
  },
  {
    key: 'update_row',
    label: 'Satır Güncelle',
    icon: <RefreshCw className="h-4 w-4" />,
    description: 'Mevcut satırı değiştir',
  },
];

const COLUMN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export function SheetsAdvancedModal({
  open,
  onOpenChange,
  clientId,
  selectedKeywords,
  initialMode = 'update_cell',
}: SheetsAdvancedModalProps) {
  // State
  const [activeTab, setActiveTab] = useState<AdvancedMode>(initialMode);
  const [step, setStep] = useState<Step>('config');
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<SheetsConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    mode: WriteMode;
    message: string;
    url: string;
  } | null>(null);

  // Form state for each mode
  const [targetRow, setTargetRow] = useState<number>(2);
  const [targetColumn, setTargetColumn] = useState<string>('A');
  const [appendSeparator, setAppendSeparator] = useState<string>(', ');
  const [currentCellValue, setCurrentCellValue] = useState<string>('');
  const [currentRowData, setCurrentRowData] = useState<Record<string, string>>({});

  // Hooks
  const { data: configsData, isLoading: configsLoading } = useSheetsConfigs(clientId);
  const advancedWrite = useAdvancedSheetsWrite();
  const getCellValue = useGetCellValue();
  const getRowData = useGetRowData();

  const configs = configsData?.success && configsData.data ? configsData.data : [];

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialMode);
      setStep('config');
      setSelectedConfigId(null);
      setSelectedConfig(null);
      setError(null);
      setResult(null);
      setTargetRow(2);
      setTargetColumn('A');
      setAppendSeparator(', ');
      setCurrentCellValue('');
      setCurrentRowData({});

      // Auto-select default config
      const defaultConfig = configs.find(c => c.is_default);
      if (defaultConfig) {
        setSelectedConfigId(defaultConfig.id);
        setSelectedConfig(defaultConfig);
      }
    }
  }, [open, configs, initialMode]);

  // Fetch current cell value when config and target change (for update_cell)
  const fetchCellValue = async () => {
    if (!selectedConfig || activeTab !== 'update_cell') return;

    try {
      const result = await getCellValue.mutateAsync({
        spreadsheetId: selectedConfig.spreadsheet_id,
        sheetName: selectedConfig.sheet_name,
        row: targetRow,
        column: targetColumn,
      });
      if (result.success) {
        setCurrentCellValue(result.value);
      }
    } catch (err) {
      console.warn('Failed to fetch cell value:', err);
      setCurrentCellValue('');
    }
  };

  // Fetch current row data when config and target change (for update_row)
  const fetchRowData = async () => {
    if (!selectedConfig || activeTab !== 'update_row') return;

    try {
      const result = await getRowData.mutateAsync({
        spreadsheetId: selectedConfig.spreadsheet_id,
        sheetName: selectedConfig.sheet_name,
        row: targetRow,
        columnMappings: selectedConfig.column_mappings,
      });
      if (result.success) {
        setCurrentRowData(result.values);
      }
    } catch (err) {
      console.warn('Failed to fetch row data:', err);
      setCurrentRowData({});
    }
  };

  // Handle config selection
  const handleConfigSelect = (config: SheetsConfig) => {
    setSelectedConfigId(config.id);
    setSelectedConfig(config);
  };

  // Get keyword data for export
  const getKeywordData = (): Record<string, unknown>[] => {
    if (selectedKeywords.length === 0) return [];

    // For update_cell, we'll concatenate all keywords
    // For insert_row and update_row, use all keywords (bulk insert/update)
    return selectedKeywords.map(kw => ({
      keyword: kw.keyword,
      search_volume: kw.search_volume,
      keyword_difficulty: kw.keyword_difficulty,
      cpc: kw.cpc,
      competition: kw.competition,
      search_intent: kw.search_intent,
      opportunity_score: kw.opportunity_score,
      ai_category: kw.ai_category,
    }));
  };

  // Get all keywords as concatenated string (for update_cell preview)
  const getAllKeywordsText = (): string => {
    return selectedKeywords.map(kw => kw.keyword).join(appendSeparator);
  };

  // Get preview value for update_cell
  const getPreviewValue = (): string => {
    if (selectedKeywords.length === 0) return '';
    const newValue = getAllKeywordsText();
    if (!currentCellValue) return newValue;
    return `${currentCellValue}${appendSeparator}${newValue}`;
  };

  // Handle execute
  const handleExecute = async () => {
    if (!selectedConfig) return;

    setStep('processing');
    setError(null);

    try {
      // For update_cell mode, send concatenated keywords as single value
      // For other modes, send all keywords as array
      const dataToSend = activeTab === 'update_cell'
        ? [{ keyword: getAllKeywordsText() }]  // Single concatenated value
        : getKeywordData();  // All keywords as separate rows

      const params = {
        spreadsheet_id: selectedConfig.spreadsheet_id,
        sheet_name: selectedConfig.sheet_name,
        sheet_gid: selectedConfig.sheet_gid ? parseInt(selectedConfig.sheet_gid) : 0,
        write_mode: activeTab as WriteMode,
        column_mappings: selectedConfig.column_mappings,
        data: dataToSend,
        target_row: targetRow,
        target_column: activeTab === 'update_cell' ? targetColumn : undefined,
        append_separator: activeTab === 'update_cell' ? appendSeparator : undefined,
      };

      const response = await advancedWrite.mutateAsync(params);

      if (response.success) {
        let message = '';
        const keywordCount = selectedKeywords.length;
        switch (activeTab) {
          case 'update_cell':
            message = `${keywordCount} anahtar kelime ${response.cell} hücresine eklendi`;
            break;
          case 'insert_row':
            message = `${keywordCount} satır, ${response.inserted_at_row}. satırdan itibaren eklendi`;
            break;
          case 'update_row':
            message = `${keywordCount} satır güncellendi (satır ${response.updated_row}'den itibaren)`;
            break;
        }
        setResult({
          mode: activeTab,
          message,
          url: response.spreadsheet_url,
        });
        setStep('success');
      } else {
        setError(response.error || 'İşlem başarısız oldu');
        setStep('error');
      }
    } catch (err) {
      setError('İşlem sırasında hata oluştu');
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
          className="relative w-full max-w-xl rounded-2xl glass-3 border border-[hsl(var(--glass-border-default))] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--glass-border-subtle))]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileSpreadsheet className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Sheets İşlemleri</h3>
                <p className="text-xs text-muted-foreground">
                  Hassas düzenleme işlemleri
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

          {/* Tabs */}
          {step === 'config' && (
            <div className="flex border-b border-[hsl(var(--glass-border-subtle))]">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                    activeTab === tab.key
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step: Config */}
              {step === 'config' && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Config Selection */}
                  {configsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : configs.length === 0 ? (
                    <div className="text-center py-8">
                      <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-foreground font-medium mb-1">Konfigürasyon bulunamadı</p>
                      <p className="text-sm text-muted-foreground">
                        Önce müşteri ayarlarından bir Sheets konfigürasyonu ekleyin
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Config Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Sheets Konfigürasyonu
                        </label>
                        <select
                          value={selectedConfigId || ''}
                          onChange={(e) => {
                            const config = configs.find(c => c.id === Number(e.target.value));
                            if (config) handleConfigSelect(config);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Konfigürasyon seçin...</option>
                          {configs.map((config) => (
                            <option key={config.id} value={config.id}>
                              {config.config_name} - {config.sheet_name}
                              {config.is_default ? ' (Varsayılan)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedConfig && (
                        <>
                          {/* Mode-specific fields */}
                          {activeTab === 'update_cell' && (
                            <div className="space-y-4 pt-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-2">
                                    Satır
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={targetRow}
                                    onChange={(e) => setTargetRow(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-2">
                                    Sütun
                                  </label>
                                  <select
                                    value={targetColumn}
                                    onChange={(e) => setTargetColumn(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  >
                                    {COLUMN_LETTERS.map((letter) => (
                                      <option key={letter} value={letter}>{letter}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Ayırıcı
                                </label>
                                <input
                                  type="text"
                                  value={appendSeparator}
                                  onChange={(e) => setAppendSeparator(e.target.value)}
                                  placeholder=", "
                                  className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Mevcut Değer:</span>
                                <button
                                  onClick={fetchCellValue}
                                  disabled={getCellValue.isPending}
                                  className="text-sm text-primary hover:underline disabled:opacity-50"
                                >
                                  {getCellValue.isPending ? 'Yükleniyor...' : 'Yükle'}
                                </button>
                              </div>
                              {currentCellValue && (
                                <div className="p-3 rounded-lg bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
                                  <p className="text-sm text-muted-foreground mb-1">Mevcut:</p>
                                  <p className="text-foreground font-mono text-sm">{currentCellValue}</p>
                                </div>
                              )}

                              {selectedKeywords.length > 0 && (
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <p className="text-sm text-blue-400 mb-1">Önizleme:</p>
                                  <p className="text-blue-300 font-mono text-sm">{getPreviewValue()}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'insert_row' && (
                            <div className="space-y-4 pt-2">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Hedef Satır
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={targetRow}
                                  onChange={(e) => setTargetRow(Number(e.target.value))}
                                  className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Bu satıra yeni veri eklenecek, mevcut satırlar aşağı kayacak
                                </p>
                              </div>

                              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5" />
                                  <div className="text-sm text-amber-300">
                                    <p className="font-medium">Dikkat</p>
                                    <p>Satır {targetRow} ve altındaki tüm satırlar 1 aşağı kayacak</p>
                                  </div>
                                </div>
                              </div>

                              {selectedKeywords.length > 0 && (
                                <div className="p-3 rounded-lg bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
                                  <p className="text-sm text-muted-foreground mb-2">Eklenecek veri:</p>
                                  <p className="text-foreground font-medium">{selectedKeywords[0].keyword}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'update_row' && (
                            <div className="space-y-4 pt-2">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Güncellenecek Satır
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={targetRow}
                                  onChange={(e) => setTargetRow(Number(e.target.value))}
                                  className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Mevcut Satır Verisi:</span>
                                <button
                                  onClick={fetchRowData}
                                  disabled={getRowData.isPending}
                                  className="text-sm text-primary hover:underline disabled:opacity-50"
                                >
                                  {getRowData.isPending ? 'Yükleniyor...' : 'Yükle'}
                                </button>
                              </div>

                              {Object.keys(currentRowData).length > 0 && (
                                <div className="p-3 rounded-lg bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))] space-y-1">
                                  {Object.entries(currentRowData).map(([field, value]) => (
                                    <div key={field} className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">{field}:</span>
                                      <span className="text-foreground font-mono">{value || '-'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                                  <div className="text-sm text-red-300">
                                    <p className="font-medium">Dikkat</p>
                                    <p>Bu satır tamamen üzerine yazılacak</p>
                                  </div>
                                </div>
                              </div>

                              {selectedKeywords.length > 0 && (
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <p className="text-sm text-blue-400 mb-2">Yeni veri:</p>
                                  <p className="text-blue-300 font-medium">{selectedKeywords[0].keyword}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* Step: Processing */}
              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-4" />
                  <p className="text-foreground font-medium">İşlem yapılıyor...</p>
                  <p className="text-sm text-muted-foreground">
                    {TABS.find(t => t.key === activeTab)?.description}
                  </p>
                </motion.div>
              )}

              {/* Step: Success */}
              {step === 'success' && result && (
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
                    İşlem Başarılı!
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {result.message}
                  </p>
                  <a
                    href={result.url}
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
                    {error || 'İşlem sırasında bir hata oluştu'}
                  </p>
                  <button
                    onClick={() => setStep('config')}
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
          {(step === 'config' || step === 'success' || step === 'error') && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--glass-border-subtle))]">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
              >
                {step === 'success' || step === 'error' ? 'Kapat' : 'İptal'}
              </button>

              {step === 'config' && selectedConfig && selectedKeywords.length > 0 && (
                <button
                  onClick={handleExecute}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-500/90 text-white transition-colors"
                >
                  Uygula
                  <ArrowDown className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
