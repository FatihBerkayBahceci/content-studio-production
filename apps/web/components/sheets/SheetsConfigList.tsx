'use client';

import { useState } from 'react';
import {
  FileSpreadsheet, ExternalLink, Edit3, Trash2, Star, Clock,
  MoreHorizontal, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { useSheetsConfigs, useDeleteSheetsConfig } from '@/lib/hooks/use-sheets-config';
import type { SheetsConfig } from '@/lib/api/sheets-config';

interface SheetsConfigListProps {
  clientId: number;
  onEdit: (config: SheetsConfig) => void;
}

export function SheetsConfigList({ clientId, onEdit }: SheetsConfigListProps) {
  const { data, isLoading, error } = useSheetsConfigs(clientId);
  const deleteConfig = useDeleteSheetsConfig();
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const configs = data?.success && data.data ? data.data : [];

  const handleDelete = async (configId: number) => {
    try {
      await deleteConfig.mutateAsync({ clientId, configId });
      setDeleteConfirm(null);
      setMenuOpen(null);
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
        <p className="text-sm text-muted-foreground">Konfigürasyonlar yüklenemedi</p>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-2xl bg-[hsl(var(--glass-bg-2))] mb-4">
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium mb-1">Henüz konfigürasyon yok</p>
        <p className="text-sm text-muted-foreground">
          Google Sheets entegrasyonu için yeni bir konfigürasyon ekleyin
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <motion.div
          key={config.id}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'relative p-4 rounded-xl border transition-colors',
            config.is_default
              ? 'bg-primary/5 border-primary/20'
              : 'bg-[hsl(var(--glass-bg-1))] border-[hsl(var(--glass-border-subtle))]'
          )}
        >
          {/* Delete confirmation overlay */}
          <AnimatePresence>
            {deleteConfirm === config.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/90 backdrop-blur-sm"
              >
                <div className="text-center">
                  <p className="text-sm text-foreground mb-3">
                    Bu konfigürasyonu silmek istediğinizden emin misiniz?
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[hsl(var(--glass-bg-2))] hover:bg-[hsl(var(--glass-bg-3))] transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      disabled={deleteConfig.isPending}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {deleteConfig.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Sil'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={cn(
                'p-2.5 rounded-lg',
                config.is_default ? 'bg-primary/10' : 'bg-[hsl(var(--glass-bg-2))]'
              )}>
                <FileSpreadsheet className={cn(
                  'h-5 w-5',
                  config.is_default ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground truncate">
                    {config.config_name}
                  </h4>
                  {config.is_default && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary">
                      <Star className="h-3 w-3" />
                      Varsayılan
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground truncate mb-2">
                  {config.spreadsheet_name || 'Google Sheet'} → {config.sheet_name}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{Object.keys(config.column_mappings).length} sütun eşleşmesi</span>
                  {config.last_export_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Son: {formatDate(config.last_export_at)}
                      {config.last_export_count && ` (${config.last_export_count} satır)`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={config.spreadsheet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
                title="Sheet'i aç"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(menuOpen === config.id ? null : config.id)}
                  className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-2))] transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {menuOpen === config.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl glass-3 border border-[hsl(var(--glass-border-default))] shadow-xl py-1 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          onEdit(config);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                      >
                        <Edit3 className="h-4 w-4 text-muted-foreground" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirm(config.id);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Sil
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  );
}
