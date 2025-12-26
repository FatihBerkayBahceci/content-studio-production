'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Minus, Plus, ChevronDown, ChevronRight, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTestScenarios, useSubmitTestResult, TestScenario } from '@/lib/hooks/use-test-scenarios';

const statusColors = {
  passed: 'bg-emerald-500',
  failed: 'bg-red-500',
  partial: 'bg-amber-500',
  pending: 'bg-zinc-600',
  skipped: 'bg-zinc-700',
};

function TestRow({ scenario, onStatusChange }: { scenario: TestScenario; onStatusChange: (status: string) => void }) {
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitResult = useSubmitTestResult();

  const handleStatusClick = async (status: string) => {
    setSaving(true);
    try {
      await submitResult.mutateAsync({
        scenarioId: scenario.id,
        data: { status, notes: note || undefined }
      });
      onStatusChange(status);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-3 py-3 px-4">
        {/* Status indicator */}
        <div className={cn('w-2 h-2 rounded-full', statusColors[scenario.status])} />

        {/* Title */}
        <span className="flex-1 text-sm text-white">{scenario.title}</span>

        {/* Quick status buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStatusClick('passed')}
            disabled={saving}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              scenario.status === 'passed'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10'
            )}
            title="Basarili"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleStatusClick('failed')}
            disabled={saving}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              scenario.status === 'failed'
                ? 'bg-red-500/20 text-red-400'
                : 'text-zinc-600 hover:text-red-400 hover:bg-red-500/10'
            )}
            title="Basarisiz"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleStatusClick('partial')}
            disabled={saving}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              scenario.status === 'partial'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-zinc-600 hover:text-amber-400 hover:bg-amber-500/10'
            )}
            title="Kismen"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Note toggle */}
        <button
          onClick={() => setShowNote(!showNote)}
          className="p-1.5 text-zinc-600 hover:text-white rounded-lg hover:bg-white/5"
          title="Not ekle"
        >
          {showNote ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {saving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>

      {/* Note input */}
      {showNote && (
        <div className="px-4 pb-3 flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Not ekle..."
            className="flex-1 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {scenario.latest_result_notes && (
            <span className="text-xs text-zinc-500 self-center">Son: "{scenario.latest_result_notes}"</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestsPage() {
  const { data: scenarios, isLoading, refetch } = useTestScenarios();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['ui_ux', 'backend']);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const uiuxTests = scenarios?.filter(s => s.category === 'ui_ux') || [];
  const backendTests = scenarios?.filter(s => s.category === 'backend') || [];

  const getStats = (tests: TestScenario[]) => {
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    return { passed, failed, total: tests.length };
  };

  const uiStats = getStats(uiuxTests);
  const backendStats = getStats(backendTests);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Test Senaryolari</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-emerald-400">{uiStats.passed + backendStats.passed} basarili</span>
          <span className="text-red-400">{uiStats.failed + backendStats.failed} basarisiz</span>
          <span className="text-zinc-500">{(scenarios?.length || 0)} toplam</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* UI/UX Section */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <button
            onClick={() => toggleCategory('ui_ux')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedCategories.includes('ui_ux') ? (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              )}
              <span className="font-medium">UI/UX Testleri</span>
              <span className="text-xs text-zinc-500">({uiuxTests.length})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400">{uiStats.passed}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-red-400">{uiStats.failed}</span>
            </div>
          </button>

          {expandedCategories.includes('ui_ux') && (
            <div className="border-t border-white/[0.06]">
              {uiuxTests.map(scenario => (
                <TestRow
                  key={scenario.id}
                  scenario={scenario}
                  onStatusChange={() => refetch()}
                />
              ))}
            </div>
          )}
        </div>

        {/* Backend Section */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <button
            onClick={() => toggleCategory('backend')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedCategories.includes('backend') ? (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              )}
              <span className="font-medium">Backend Testleri</span>
              <span className="text-xs text-zinc-500">({backendTests.length})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400">{backendStats.passed}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-red-400">{backendStats.failed}</span>
            </div>
          </button>

          {expandedCategories.includes('backend') && (
            <div className="border-t border-white/[0.06]">
              {backendTests.map(scenario => (
                <TestRow
                  key={scenario.id}
                  scenario={scenario}
                  onStatusChange={() => refetch()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
