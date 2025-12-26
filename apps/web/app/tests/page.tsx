'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  SkipForward,
  Plus,
  Search,
  Filter,
  Monitor,
  Server,
  ChevronRight,
  Loader2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { useTestScenarios, useTestStats, TestScenario } from '@/lib/hooks/use-test-scenarios';

// Status config
const statusConfig = {
  passed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Basarili' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Basarisiz' },
  partial: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Kismen' },
  pending: { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-400/10', label: 'Beklemede' },
  skipped: { icon: SkipForward, color: 'text-zinc-500', bg: 'bg-zinc-500/10', label: 'Atlandi' },
};

const priorityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Kritik' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Yuksek' },
  medium: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Orta' },
  low: { color: 'text-zinc-400', bg: 'bg-zinc-400/10', label: 'Dusuk' },
};

const categoryConfig = {
  ui_ux: { icon: Monitor, label: 'UI/UX', color: 'text-purple-400' },
  backend: { icon: Server, label: 'Backend', color: 'text-cyan-400' },
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', color.replace('text-', 'bg-') + '/10')}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: TestScenario }) {
  const status = statusConfig[scenario.status];
  const priority = priorityConfig[scenario.priority];
  const category = categoryConfig[scenario.category];
  const StatusIcon = status.icon;
  const CategoryIcon = category.icon;

  return (
    <Link href={`/tests/${scenario.uuid}`}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-lg', category.color.replace('text-', 'bg-') + '/10')}>
              <CategoryIcon className={cn('h-4 w-4', category.color)} />
            </div>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', priority.bg, priority.color)}>
              {priority.label}
            </span>
          </div>
          <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg', status.bg)}>
            <StatusIcon className={cn('h-4 w-4', status.color)} />
            <span className={cn('text-xs font-medium', status.color)}>{status.label}</span>
          </div>
        </div>

        <h3 className="font-medium text-white mb-2 group-hover:text-primary transition-colors">
          {scenario.title}
        </h3>

        {scenario.description && (
          <p className="text-sm text-zinc-500 mb-3 line-clamp-2">{scenario.description}</p>
        )}

        {scenario.latest_tester_name && (
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>Son test:</span>
            <span className="text-zinc-400">{scenario.latest_tester_name}</span>
            {scenario.latest_result_date && (
              <>
                <span>-</span>
                <span>{new Date(scenario.latest_result_date).toLocaleDateString('tr-TR')}</span>
              </>
            )}
          </div>
        )}

        {scenario.latest_result_notes && (
          <p className="mt-2 text-xs text-zinc-500 italic line-clamp-1">
            "{scenario.latest_result_notes}"
          </p>
        )}

        <div className="flex items-center justify-end mt-3 text-zinc-600 group-hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4" />
        </div>
      </motion.div>
    </Link>
  );
}

export default function TestsPage() {
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: scenarios, isLoading } = useTestScenarios({
    category: category !== 'all' ? category : undefined,
    status: status !== 'all' ? status : undefined,
    search: search || undefined,
  });
  const { data: stats } = useTestStats();

  const uiuxScenarios = scenarios?.filter(s => s.category === 'ui_ux') || [];
  const backendScenarios = scenarios?.filter(s => s.category === 'backend') || [];

  return (
    <PageTransition className="min-h-screen text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Test Senaryolari</h1>
          <p className="text-zinc-500 mt-1">UI/UX ve Backend testlerini yonetin</p>
        </div>
        <Link href="/tests/new">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            Yeni Test
          </motion.button>
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Toplam" value={stats.total} icon={TrendingUp} color="text-blue-400" />
          <StatCard label="Basarili" value={stats.byStatus.passed} icon={CheckCircle2} color="text-emerald-400" />
          <StatCard label="Basarisiz" value={stats.byStatus.failed} icon={XCircle} color="text-red-400" />
          <StatCard label="Kismen" value={stats.byStatus.partial} icon={AlertCircle} color="text-amber-400" />
          <StatCard label="Beklemede" value={stats.byStatus.pending} icon={Clock} color="text-zinc-400" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Category Filter */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
          <button
            onClick={() => setCategory('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              category === 'all' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'
            )}
          >
            Tumu
          </button>
          <button
            onClick={() => setCategory('ui_ux')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              category === 'ui_ux' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'
            )}
          >
            <Monitor className="h-4 w-4" />
            UI/UX
          </button>
          <button
            onClick={() => setCategory('backend')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              category === 'backend' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'
            )}
          >
            <Server className="h-4 w-4" />
            Backend
          </button>
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tum Durumlar</option>
          <option value="pending">Beklemede</option>
          <option value="passed">Basarili</option>
          <option value="failed">Basarisiz</option>
          <option value="partial">Kismen</option>
          <option value="skipped">Atlandi</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && scenarios?.length === 0 && (
        <div className="text-center py-20">
          <AlertTriangle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-400 mb-2">Test bulunamadi</h3>
          <p className="text-zinc-600">Filtreleri degistirmeyi deneyin veya yeni test ekleyin.</p>
        </div>
      )}

      {/* Grouped Scenarios */}
      {!isLoading && scenarios && scenarios.length > 0 && (
        <div className="space-y-8">
          {(category === 'all' || category === 'ui_ux') && uiuxScenarios.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">UI/UX Testleri</h2>
                <span className="text-sm text-zinc-500">({uiuxScenarios.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uiuxScenarios.map((scenario) => (
                  <ScenarioCard key={scenario.id} scenario={scenario} />
                ))}
              </div>
            </div>
          )}

          {(category === 'all' || category === 'backend') && backendScenarios.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Backend Testleri</h2>
                <span className="text-sm text-zinc-500">({backendScenarios.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backendScenarios.map((scenario) => (
                  <ScenarioCard key={scenario.id} scenario={scenario} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}
