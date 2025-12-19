'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Link2, ChevronRight, ChevronLeft, Loader2, Check, X,
  FileSpreadsheet, Table2, Settings2, AlertCircle, Clipboard,
  Wand2, ChevronDown, AlertTriangle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import {
  validateSheetsUrl,
  getRecentSheetsUrls,
  addRecentSheetsUrl,
} from '@/lib/utils/sheets-url';
import {
  suggestColumnMappings,
  findDuplicateMappings,
  getConfidenceColor,
  getConfidenceLabel,
  type SheetColumn,
  type MappingSuggestion,
} from '@/lib/utils/column-matcher';
import {
  useSheetsConnect,
  useSheetsGetColumns,
  useCreateSheetsConfig,
  useUpdateSheetsConfig,
  KEYWORD_FIELDS,
} from '@/lib/hooks/use-sheets-config';
import type { SheetsConfig, CreateSheetsConfigInput } from '@/lib/api/sheets-config';

interface SheetsConfigFormProps {
  clientId: number;
  editConfig?: SheetsConfig | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: 'Bağlantı', icon: Link2 },
  { num: 2, label: 'Sayfa', icon: Table2 },
  { num: 3, label: 'Sütunlar', icon: FileSpreadsheet },
  { num: 4, label: 'Ayarlar', icon: Settings2 },
];

// Generate column letters A-Z, then AA-AZ
const COLUMN_LETTERS = [
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  ...Array.from({ length: 26 }, (_, i) => 'A' + String.fromCharCode(65 + i)),
];

export function SheetsConfigForm({
  clientId,
  editConfig,
  onSuccess,
  onCancel,
}: SheetsConfigFormProps) {
  const isEditing = !!editConfig;

  // Step state
  const [step, setStep] = useState<Step>(isEditing ? 3 : 1);

  // Step 1: Connection
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(editConfig?.spreadsheet_url || '');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showRecentUrls, setShowRecentUrls] = useState(false);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);

  // Step 2: Sheet selection (populated after connect)
  const [spreadsheetId, setSpreadsheetId] = useState(editConfig?.spreadsheet_id || '');
  const [spreadsheetName, setSpreadsheetName] = useState(editConfig?.spreadsheet_name || '');
  const [availableSheets, setAvailableSheets] = useState<{ name: string; gid: string }[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(editConfig?.sheet_name || '');
  const [selectedSheetGid, setSelectedSheetGid] = useState(editConfig?.sheet_gid || '');

  // Step 3: Column mapping
  const [availableColumns, setAvailableColumns] = useState<SheetColumn[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>(
    editConfig?.column_mappings || { keyword: 'A' }
  );
  const [autoMappingSuggestions, setAutoMappingSuggestions] = useState<MappingSuggestion[]>([]);
  const [showAutoMappingResult, setShowAutoMappingResult] = useState(false);

  // Step 4: Settings
  const [configName, setConfigName] = useState(editConfig?.config_name || '');
  const [startRow, setStartRow] = useState(editConfig?.start_row || 2);
  const [includeHeaders, setIncludeHeaders] = useState(editConfig?.include_headers ?? true);
  const [isDefault, setIsDefault] = useState(editConfig?.is_default ?? false);

  // Mutations
  const sheetsConnect = useSheetsConnect();
  const sheetsGetColumns = useSheetsGetColumns();
  const createConfig = useCreateSheetsConfig();
  const updateConfig = useUpdateSheetsConfig();

  const isLoading = sheetsConnect.isPending || sheetsGetColumns.isPending ||
    createConfig.isPending || updateConfig.isPending;

  // Load recent URLs on mount
  useEffect(() => {
    setRecentUrls(getRecentSheetsUrls());
  }, []);

  // Real-time URL validation
  const urlValidation = useMemo(() => {
    return validateSheetsUrl(spreadsheetUrl);
  }, [spreadsheetUrl]);

  // Check for duplicate column mappings
  const duplicateCheck = useMemo(() => {
    return findDuplicateMappings(columnMappings);
  }, [columnMappings]);

  // Handle paste from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSpreadsheetUrl(text.trim());
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  // Handle connect
  const handleConnect = async () => {
    setConnectionError(null);

    if (!urlValidation.valid || !urlValidation.spreadsheetId) {
      setConnectionError(urlValidation.error || 'Geçersiz URL');
      return;
    }

    try {
      const result = await sheetsConnect.mutateAsync(spreadsheetUrl);

      if (!result.success) {
        setConnectionError(result.error || 'Bağlantı hatası');
        return;
      }

      // Save to recent URLs
      addRecentSheetsUrl(spreadsheetUrl);

      setSpreadsheetId(result.spreadsheet_id);
      setSpreadsheetName(result.spreadsheet_name);
      setAvailableSheets(result.sheets || []);

      // Auto-select first sheet if only one
      if (result.sheets?.length === 1) {
        setSelectedSheet(result.sheets[0].name);
        setSelectedSheetGid(result.sheets[0].gid);
      }

      setStep(2);
    } catch (error) {
      setConnectionError('Bağlantı sırasında hata oluştu');
    }
  };

  // Handle sheet selection
  const handleSheetSelect = async (sheetName: string) => {
    const sheet = availableSheets.find(s => s.name === sheetName);
    setSelectedSheet(sheetName);
    setSelectedSheetGid(sheet?.gid || '');

    // Fetch columns
    try {
      const result = await sheetsGetColumns.mutateAsync({
        spreadsheetId,
        sheetName,
      });

      if (result.success && result.columns) {
        const cols: SheetColumn[] = result.columns.map((c, i) => ({
          letter: c.letter,
          header: c.header,
          index: i,
        }));
        setAvailableColumns(cols);

        // Auto-suggest mappings if columns have headers
        if (cols.some(c => c.header)) {
          const { suggestions } = suggestColumnMappings(cols);
          setAutoMappingSuggestions(suggestions);
        }
      }
    } catch (error) {
      console.error('Failed to get columns:', error);
    }

    setStep(3);
  };

  // Handle auto-mapping
  const handleAutoMapping = () => {
    if (availableColumns.length === 0) return;

    const { mappings, suggestions } = suggestColumnMappings(availableColumns);

    // Merge with existing (keep keyword if not suggested)
    const newMappings = { ...mappings };
    if (!newMappings.keyword && columnMappings.keyword) {
      newMappings.keyword = columnMappings.keyword;
    }

    setColumnMappings(newMappings);
    setAutoMappingSuggestions(suggestions);
    setShowAutoMappingResult(true);

    // Hide result after 3 seconds
    setTimeout(() => setShowAutoMappingResult(false), 3000);
  };

  // Handle column mapping change
  const handleMappingChange = (field: string, column: string) => {
    setColumnMappings(prev => {
      if (column === '') {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: column };
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!configName.trim()) {
      return;
    }

    // Check for duplicates
    if (duplicateCheck.hasDuplicates) {
      return;
    }

    const data: CreateSheetsConfigInput = {
      config_name: configName.trim(),
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: spreadsheetUrl,
      spreadsheet_name: spreadsheetName,
      sheet_name: selectedSheet,
      sheet_gid: selectedSheetGid,
      start_row: startRow,
      column_mappings: columnMappings,
      include_headers: includeHeaders,
      is_default: isDefault,
    };

    try {
      if (isEditing && editConfig) {
        await updateConfig.mutateAsync({
          clientId,
          configId: editConfig.id,
          data,
        });
      } else {
        await createConfig.mutateAsync({
          clientId,
          data,
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  // Check if can proceed to next step
  const canProceed = () => {
    switch (step) {
      case 1:
        return urlValidation.valid;
      case 2:
        return selectedSheet.length > 0;
      case 3:
        return columnMappings.keyword?.length > 0 && !duplicateCheck.hasDuplicates;
      case 4:
        return configName.trim().length > 0;
      default:
        return false;
    }
  };

  // Get suggestion for a field
  const getSuggestionForField = (fieldKey: string): MappingSuggestion | undefined => {
    return autoMappingSuggestions.find(s => s.field === fieldKey);
  };

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                step === s.num
                  ? 'bg-primary/10 text-primary'
                  : step > s.num
                    ? 'text-emerald-400'
                    : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  step === s.num
                    ? 'bg-primary text-primary-foreground'
                    : step > s.num
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {step > s.num ? <Check className="h-3 w-3" /> : s.num}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 1: Connection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Google Sheets URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    onFocus={() => recentUrls.length > 0 && setShowRecentUrls(true)}
                    onBlur={() => setTimeout(() => setShowRecentUrls(false), 200)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className={cn(
                      'form-input w-full pr-20',
                      urlValidation.valid && spreadsheetUrl && 'border-emerald-500/50 focus:ring-emerald-500/30',
                      urlValidation.error && 'border-red-500/50 focus:ring-red-500/30'
                    )}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {spreadsheetUrl && urlValidation.valid && (
                      <span className="p-1 rounded bg-emerald-500/20">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="p-1.5 rounded-lg hover:bg-[hsl(var(--glass-bg-2))] text-muted-foreground hover:text-foreground transition-colors"
                      title="Panoya yapıştır"
                    >
                      <Clipboard className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Recent URLs dropdown */}
                  <AnimatePresence>
                    {showRecentUrls && recentUrls.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-10 top-full left-0 right-0 mt-1 rounded-xl glass-3 border border-[hsl(var(--glass-border-default))] shadow-xl overflow-hidden"
                      >
                        <div className="p-2 border-b border-[hsl(var(--glass-border-subtle))]">
                          <span className="text-xs text-muted-foreground">Son kullanılanlar</span>
                        </div>
                        {recentUrls.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSpreadsheetUrl(url);
                              setShowRecentUrls(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm truncate hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                          >
                            {url}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Validation messages */}
                {urlValidation.error && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {urlValidation.error}
                  </p>
                )}
                {urlValidation.warning && (
                  <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {urlValidation.warning}
                  </p>
                )}
                {!urlValidation.error && !urlValidation.warning && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Google Sheets dosyanızın URL'sini yapıştırın
                  </p>
                )}
              </div>

              {connectionError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {connectionError}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Sheet selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-400">
                  <Check className="h-4 w-4 inline mr-1" />
                  Bağlantı başarılı: <strong>{spreadsheetName}</strong>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Sayfa Seçin
                </label>
                <div className="grid gap-2">
                  {availableSheets.map((sheet) => (
                    <button
                      key={sheet.gid}
                      onClick={() => handleSheetSelect(sheet.name)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                        selectedSheet === sheet.name
                          ? 'border-primary bg-primary/5'
                          : 'border-[hsl(var(--glass-border-subtle))] hover:border-primary/50'
                      )}
                    >
                      <Table2 className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{sheet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Column mapping */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Her veri alanını hangi sütuna yazılacağını seçin
                </p>
                {availableColumns.some(c => c.header) && (
                  <button
                    onClick={handleAutoMapping}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Wand2 className="h-4 w-4" />
                    Otomatik Eşleştir
                  </button>
                )}
              </div>

              {/* Auto-mapping result notification */}
              <AnimatePresence>
                {showAutoMappingResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">
                      {autoMappingSuggestions.length} alan otomatik eşleştirildi
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Duplicate warning */}
              {duplicateCheck.hasDuplicates && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Çakışan sütunlar tespit edildi</p>
                    <p className="text-xs text-red-400/80 mt-0.5">
                      {duplicateCheck.duplicates.map(d =>
                        `${d.column} sütunu birden fazla alana atanmış`
                      ).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {KEYWORD_FIELDS.map((field) => {
                  const suggestion = getSuggestionForField(field.key);
                  const isDuplicate = duplicateCheck.duplicates.some(
                    d => d.column === columnMappings[field.key] && d.fields.includes(field.key)
                  );

                  return (
                    <div
                      key={field.key}
                      className={cn(
                        'flex items-center justify-between gap-4 p-3 rounded-lg',
                        isDuplicate
                          ? 'bg-red-500/10 border border-red-500/30'
                          : 'bg-[hsl(var(--glass-bg-1))]'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-xs text-red-400">*</span>
                        )}
                        {suggestion && columnMappings[field.key] === suggestion.column && (
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-medium',
                            getConfidenceColor(suggestion.confidence)
                          )}>
                            {getConfidenceLabel(suggestion.confidence)}
                          </span>
                        )}
                      </div>
                      <select
                        value={columnMappings[field.key] || ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className={cn(
                          'form-input w-40',
                          isDuplicate && 'border-red-500/50'
                        )}
                      >
                        <option value="">Seçiniz</option>
                        {(availableColumns.length > 0 ? availableColumns : COLUMN_LETTERS.slice(0, 26).map((l, i) => ({ letter: l, header: '', index: i }))).map((col) => (
                          <option key={col.letter} value={col.letter}>
                            {col.letter}{col.header ? `: ${col.header}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Konfigürasyon Adı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Örn: Ana Keyword Tablosu"
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Başlangıç Satırı
                </label>
                <input
                  type="number"
                  min={1}
                  value={startRow}
                  onChange={(e) => setStartRow(parseInt(e.target.value) || 2)}
                  className="form-input w-24"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Veriler bu satırdan itibaren yazılacak (1 = başlık satırı)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeHeaders"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
                />
                <label htmlFor="includeHeaders" className="text-sm text-foreground">
                  Başlık satırı ekle
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm text-foreground">
                  Varsayılan olarak ayarla
                </label>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-[hsl(var(--glass-bg-1))] space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Özet</p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Dosya:</span>{' '}
                  <span className="text-foreground">{spreadsheetName}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Sayfa:</span>{' '}
                  <span className="text-foreground">{selectedSheet}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Eşleşen alanlar:</span>{' '}
                  <span className="text-foreground">{Object.keys(columnMappings).length}</span>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--glass-border-subtle))]">
        <button
          onClick={step === 1 ? onCancel : () => setStep((s) => (s - 1) as Step)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
        >
          {step === 1 ? (
            <>
              <X className="h-4 w-4" />
              İptal
            </>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              Geri
            </>
          )}
        </button>

        {step < 4 ? (
          <button
            onClick={step === 1 ? handleConnect : step === 2 ? () => handleSheetSelect(selectedSheet) : () => setStep((s) => (s + 1) as Step)}
            disabled={!canProceed() || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {step === 1 ? 'Bağlan' : 'Devam'}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!canProceed() || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-500/90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                {isEditing ? 'Güncelle' : 'Kaydet'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
