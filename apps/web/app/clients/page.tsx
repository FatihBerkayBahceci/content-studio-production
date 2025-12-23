'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Plus, Building2, Globe, Search, MoreHorizontal, Settings,
  Trash2, ExternalLink, CheckCircle2, XCircle, ChevronRight,
  Filter, ArrowUpDown, Users, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClients, useDeleteClient } from '@/lib/hooks/use-clients';
import { useClientStore } from '@/lib/stores/client-store';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import type { Client } from '@seo-tool-suite/shared/types';

/**
 * Extended Client type with n8n snake_case aliases
 */
interface ClientWithSnakeCase extends Client {
  is_active?: boolean;
  default_language?: string;
  default_country?: string;
  created_at?: string;
  updated_at?: string;
  logo_url?: string;
}

export default function ClientsPage() {
  const { data, isLoading, error } = useClients();
  const deleteClient = useDeleteClient();
  const { selectedClientId, setSelectedClientId } = useClientStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const clients = (data?.success ? data.data : []) as ClientWithSnakeCase[];

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && client.is_active) ||
      (filterStatus === 'inactive' && !client.is_active);

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (clientId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      await deleteClient.mutateAsync(clientId);
      setMenuOpen(null);
    }
  };

  const handleSelect = (clientId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedClientId(clientId);
    setMenuOpen(null);
  };

  // Stats
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.is_active).length,
    inactive: clients.filter(c => !c.is_active).length,
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Header Section - Minimal */}
      <section className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Müşteriler</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} müşteri · {stats.active} aktif
            </p>
          </div>

          {/* New Client Button */}
          <Link href="/clients/new">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
              <Plus className="h-4 w-4" />
              <span>Yeni Müşteri</span>
            </button>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Müşteri ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--glass-border-default))] bg-[hsl(var(--glass-bg-1))] text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                  filterStatus === status
                    ? 'bg-[hsl(var(--glass-bg-3))] text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {status === 'all' ? 'Tümü' : status === 'active' ? 'Aktif' : 'Pasif'}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))]">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid'
                  ? 'bg-[hsl(var(--glass-bg-3))] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Kart Görünümü"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-[hsl(var(--glass-bg-3))] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Liste Görünümü"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="px-6 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-3 rounded-xl bg-red-500/10 mb-3">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-foreground font-medium">Yükleme hatası</p>
            <p className="text-sm text-muted-foreground">Müşteriler yüklenirken bir hata oluştu</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-2xl bg-[hsl(var(--glass-bg-2))] mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {searchQuery ? 'Sonuç bulunamadı' : 'Henüz müşteri yok'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Farklı bir arama terimi deneyin' : 'İlk müşterinizi ekleyerek başlayın'}
            </p>
            {!searchQuery && (
              <Link href="/clients/new">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Yeni Müşteri</span>
                </button>
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid/Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClients.map((client) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'group relative rounded-2xl p-5 transition-all cursor-pointer',
                  'bg-white/[0.02] backdrop-blur-xl border border-white/[0.08]',
                  'hover:bg-white/[0.04] hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/20',
                  selectedClientId === client.id && 'ring-2 ring-primary border-primary/30'
                )}
                onClick={() => setSelectedClientId(client.id)}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium',
                    client.is_active
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-500/10 text-zinc-400'
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', client.is_active ? 'bg-emerald-400' : 'bg-zinc-400')} />
                    {client.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                {/* Logo */}
                <div className={cn(
                  'w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold mb-4 overflow-hidden',
                  'bg-white/[0.05] border border-white/[0.08]',
                  selectedClientId === client.id && 'ring-2 ring-primary ring-offset-2 ring-offset-transparent'
                )}>
                  {client.logo_url ? (
                    <img src={client.logo_url} alt={client.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary">{client.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Client Info */}
                <h3 className="font-semibold text-foreground text-lg mb-1 truncate">{client.name}</h3>

                {client.domain && (
                  <a
                    href={client.domain.startsWith('http') ? client.domain : `https://${client.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-2 truncate"
                  >
                    <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{client.domain}</span>
                  </a>
                )}

                {client.industry && (
                  <span className="inline-block px-2 py-0.5 rounded-md text-xs bg-white/[0.05] text-muted-foreground">
                    {client.industry}
                  </span>
                )}

                {/* Actions - visible on hover */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/clients/${client.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-muted-foreground hover:text-foreground transition-all"
                    title="Düzenle"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                  {client.domain && (
                    <a
                      href={client.domain.startsWith('http') ? client.domain : `https://${client.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-muted-foreground hover:text-foreground transition-all"
                      title="Siteyi Aç"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* Selected indicator */}
                {selectedClientId === client.id && (
                  <div className="absolute top-4 left-4">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          /* List/Table View */
          <div className="rounded-2xl glass-2 overflow-hidden">
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))]">
                <div className="col-span-4 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Building2 className="h-3.5 w-3.5" />
                  Müşteri
                </div>
                <div className="col-span-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:block">
                  Domain
                </div>
                <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:block">
                  Sektör
                </div>
                <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Durum
                </div>
                <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">

                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={cn(
                      'group grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors hover:bg-[hsl(var(--glass-bg-interactive))] cursor-pointer',
                      selectedClientId === client.id && 'bg-primary/5'
                    )}
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    {/* Client Name & Logo */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold overflow-hidden',
                        selectedClientId === client.id
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : '',
                        !client.logo_url && (selectedClientId === client.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-[hsl(var(--glass-bg-2))] text-foreground')
                      )}>
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          client.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.name}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate md:hidden">
                          {client.domain || 'Domain yok'}
                        </p>
                      </div>
                      {selectedClientId === client.id && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                          Seçili
                        </span>
                      )}
                    </div>

                    {/* Domain */}
                    <div className="col-span-3 hidden md:flex items-center gap-2 min-w-0">
                      {client.domain ? (
                        <a
                          href={client.domain.startsWith('http') ? client.domain : `https://${client.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
                        >
                          <Globe className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{client.domain}</span>
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground/50">—</span>
                      )}
                    </div>

                    {/* Industry */}
                    <div className="col-span-2 hidden lg:block">
                      <span className="text-sm text-muted-foreground truncate">
                        {client.industry || '—'}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          client.is_active
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground'
                        )}
                      >
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          client.is_active ? 'bg-emerald-400' : 'bg-muted-foreground'
                        )} />
                        {client.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpen(menuOpen === client.id ? null : client.id);
                          }}
                          className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-3))] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <AnimatePresence>
                          {menuOpen === client.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl glass-3 border border-[hsl(var(--glass-border-default))] shadow-xl py-1 overflow-hidden"
                            >
                              <button
                                onClick={(e) => handleSelect(client.id, e)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                              >
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                <span>Müşteri Seç</span>
                              </button>
                              <Link
                                href={`/clients/${client.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                              >
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                <span>Düzenle</span>
                              </Link>
                              {client.domain && (
                                <a
                                  href={client.domain.startsWith('http') ? client.domain : `https://${client.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                  <span>Siteyi Aç</span>
                                </a>
                              )}
                              <div className="my-1 border-t border-[hsl(var(--glass-border-subtle))]" />
                              <button
                                onClick={(e) => handleDelete(client.id, e)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Sil</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <Link
                        href={`/clients/${client.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-3))] transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Footer */}
              <div className="px-5 py-3 border-t border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg-1))]">
                <p className="text-xs text-muted-foreground">
                  {filteredClients.length} müşteri gösteriliyor
                  {filterStatus !== 'all' && ` (${filterStatus === 'active' ? 'aktif' : 'pasif'} filtresi)`}
                </p>
              </div>
            </>
          </div>
        )}
      </section>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </PageTransition>
  );
}
