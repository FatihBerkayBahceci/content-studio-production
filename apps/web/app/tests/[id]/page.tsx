'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  SkipForward,
  Monitor,
  Server,
  Loader2,
  CheckCircle,
  Send,
  History,
  User,
  Globe,
  Smartphone,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import {
  useTestScenario,
  useTestScenarioResults,
  useSubmitTestResult,
  useDeleteScenario,
} from '@/lib/hooks/use-test-scenarios';

const statusConfig = {
  passed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Basarili' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Basarisiz' },
  partial: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Kismen Basarili' },
  pending: { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-400/10', label: 'Beklemede' },
  skipped: { icon: SkipForward, color: 'text-zinc-500', bg: 'bg-zinc-500/10', label: 'Atlandi' },
};

const priorityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Kritik' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Yuksek' },
  medium: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Orta' },
  low: { color: 'text-zinc-400', bg: 'bg-zinc-400/10', label: 'Dusuk' },
};

const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Diger'];
const devices = ['Desktop', 'Mobile', 'Tablet'];

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: scenario, isLoading: loadingScenario } = useTestScenario(id);
  const { data: resultsData, isLoading: loadingResults } = useTestScenarioResults(id);
  const submitResult = useSubmitTestResult();
  const deleteScenario = useDeleteScenario();

  const [resultForm, setResultForm] = useState({
    status: 'passed' as string,
    notes: '',
    browser: 'Chrome',
    device: 'Desktop',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmitResult = async () => {
    try {
      await submitResult.mutateAsync({
        scenarioId: id,
        data: resultForm,
      });
      showNotification('success', 'Test sonucu kaydedildi');
      setResultForm(prev => ({ ...prev, notes: '' }));
    } catch (error: any) {
      showNotification('error', error.message || 'Bir hata olustu');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu test senaryosunu silmek istediginize emin misiniz?')) return;
    try {
      await deleteScenario.mutateAsync(id);
      showNotification('success', 'Test senaryosu silindi');
      router.push('/tests');
    } catch (error: any) {
      showNotification('error', error.message || 'Silinemedi');
    }
  };

  if (loadingScenario) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </PageTransition>
    );
  }

  if (!scenario) {
    return (
      <PageTransition className="min-h-screen flex flex-col items-center justify-center text-white">
        <AlertCircle className="h-12 w-12 text-zinc-600 mb-4" />
        <h2 className="text-xl font-medium mb-2">Senaryo bulunamadi</h2>
        <Link href="/tests" className="text-primary hover:underline">
          Geri don
        </Link>
      </PageTransition>
    );
  }

  const status = statusConfig[scenario.status];
  const priority = priorityConfig[scenario.priority];
  const StatusIcon = status.icon;
  const CategoryIcon = scenario.category === 'ui_ux' ? Monitor : Server;

  return (
    <PageTransition className="min-h-screen text-white p-6">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={cn(
              'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium',
              notification.type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90'
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <Link href="/tests">
            <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors mt-1">
              <ArrowLeft className="h-5 w-5 text-zinc-400" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('p-2 rounded-lg', scenario.category === 'ui_ux' ? 'bg-purple-500/10' : 'bg-cyan-500/10')}>
                <CategoryIcon className={cn('h-5 w-5', scenario.category === 'ui_ux' ? 'text-purple-400' : 'text-cyan-400')} />
              </div>
              <span className={cn('text-xs font-medium px-2 py-1 rounded-full', priority.bg, priority.color)}>
                {priority.label}
              </span>
              <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg', status.bg)}>
                <StatusIcon className={cn('h-4 w-4', status.color)} />
                <span className={cn('text-xs font-medium', status.color)}>{status.label}</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold">{scenario.title}</h1>
            {scenario.description && (
              <p className="text-zinc-400 mt-2">{scenario.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Scenario Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Steps */}
          {scenario.steps && scenario.steps.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Test Adimlari</h2>
              <ol className="space-y-3">
                {scenario.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-sm text-zinc-400">
                      {index + 1}
                    </span>
                    <span className="text-zinc-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Expected Result */}
          {scenario.expected_result && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3">Beklenen Sonuc</h2>
              <p className="text-zinc-300">{scenario.expected_result}</p>
            </div>
          )}

          {/* Results History */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold">Gecmis Sonuclar</h2>
              {resultsData?.stats && (
                <span className="text-sm text-zinc-500">({resultsData.stats.total} sonuc)</span>
              )}
            </div>

            {loadingResults ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : resultsData?.results && resultsData.results.length > 0 ? (
              <div className="space-y-3">
                {resultsData.results.map((result) => {
                  const resultStatus = statusConfig[result.status as keyof typeof statusConfig];
                  const ResultIcon = resultStatus.icon;
                  return (
                    <div
                      key={result.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className={cn('p-1.5 rounded-lg', resultStatus.bg)}>
                        <ResultIcon className={cn('h-4 w-4', resultStatus.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-white">{result.tester_name || 'Anonim'}</span>
                          <span className="text-zinc-600">-</span>
                          <span className={cn('font-medium', resultStatus.color)}>{resultStatus.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                          {result.browser && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {result.browser}
                            </span>
                          )}
                          {result.device && (
                            <span className="flex items-center gap-1">
                              <Smartphone className="h-3 w-3" />
                              {result.device}
                            </span>
                          )}
                          <span>{new Date(result.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                        {result.notes && (
                          <p className="mt-2 text-sm text-zinc-400 italic">"{result.notes}"</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-zinc-500 py-8">Henuz sonuc yok</p>
            )}
          </div>
        </div>

        {/* Right Column - Submit Result */}
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Sonucunu Bildir</h2>

            {/* Status Selection */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-zinc-400">Durum</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statusConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setResultForm(prev => ({ ...prev, status: key }))}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                        resultForm.status === key
                          ? cn(config.bg, 'border-current', config.color)
                          : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.12]'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Browser & Device */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Tarayici</label>
                <select
                  value={resultForm.browser}
                  onChange={(e) => setResultForm(prev => ({ ...prev, browser: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {browsers.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Cihaz</label>
                <select
                  value={resultForm.device}
                  onChange={(e) => setResultForm(prev => ({ ...prev, device: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {devices.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-sm text-zinc-400 mb-1 block">Notlar (Opsiyonel)</label>
              <textarea
                value={resultForm.notes}
                onChange={(e) => setResultForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ek bilgi veya sorun aciklamasi..."
                rows={3}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmitResult}
              disabled={submitResult.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {submitResult.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              Gonder
            </motion.button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
