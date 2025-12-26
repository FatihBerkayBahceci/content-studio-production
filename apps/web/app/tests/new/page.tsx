'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Monitor,
  Server,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { useCreateScenario } from '@/lib/hooks/use-test-scenarios';

export default function NewTestPage() {
  const router = useRouter();
  const createScenario = useCreateScenario();

  const [formData, setFormData] = useState({
    category: 'ui_ux' as 'ui_ux' | 'backend',
    title: '',
    description: '',
    steps: [''],
    expected_result: '',
    priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, ''],
    }));
  };

  const removeStep = (index: number) => {
    if (formData.steps.length === 1) return;
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const updateStep = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? value : s)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showNotification('error', 'Baslik zorunludur');
      return;
    }

    try {
      const result = await createScenario.mutateAsync({
        ...formData,
        steps: formData.steps.filter(s => s.trim()),
      });
      showNotification('success', 'Test senaryosu olusturuldu');
      router.push(`/tests/${result.uuid}`);
    } catch (error: any) {
      showNotification('error', error.message || 'Bir hata olustu');
    }
  };

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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/tests">
          <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-zinc-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Yeni Test Senaryosu</h1>
          <p className="text-zinc-500 mt-1">Yeni bir test senaryosu olusturun</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Kategori</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: 'ui_ux' }))}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border transition-all',
                  formData.category === 'ui_ux'
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.12]'
                )}
              >
                <Monitor className="h-5 w-5" />
                UI/UX
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: 'backend' }))}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border transition-all',
                  formData.category === 'backend'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.12]'
                )}
              >
                <Server className="h-5 w-5" />
                Backend
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Baslik *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="ornek: Login Sayfasi Testi"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Oncelik</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="critical">Kritik</option>
              <option value="high">Yuksek</option>
              <option value="medium">Orta</option>
              <option value="low">Dusuk</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Aciklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Bu test ne yapar?"
              rows={3}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Steps */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Test Adimlari</label>
            <div className="space-y-3">
              {formData.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-zinc-500 text-sm w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Adim ${index + 1}`}
                    className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adim Ekle
              </button>
            </div>
          </div>

          {/* Expected Result */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Beklenen Sonuc</label>
            <textarea
              value={formData.expected_result}
              onChange={(e) => setFormData(prev => ({ ...prev, expected_result: e.target.value }))}
              placeholder="Test basarili oldugunda ne olmali?"
              rows={2}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Link href="/tests">
              <button
                type="button"
                className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
              >
                Iptal
              </button>
            </Link>
            <motion.button
              type="submit"
              disabled={createScenario.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {createScenario.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              Olustur
            </motion.button>
          </div>
        </div>
      </form>
    </PageTransition>
  );
}
