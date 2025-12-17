'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Settings, Bot, Save, Loader2,
  CheckCircle2, XCircle, MessageSquare, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

const AI_MODELS = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [settings, setSettings] = useState({
    default_ai_model: 'gemini-2.0-flash',
    default_ai_temperature: 0.7,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.data) {
          const settingsMap: Record<string, string> = {};
          data.data.forEach((s: { setting_key: string; setting_value: string }) => {
            settingsMap[s.setting_key] = s.setting_value;
          });
          setSettings({
            default_ai_model: settingsMap.default_ai_model || 'gemini-2.0-flash',
            default_ai_temperature: parseFloat(settingsMap.default_ai_temperature) || 0.7,
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'default_ai_model', value: settings.default_ai_model }),
      });

      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'default_ai_temperature', value: settings.default_ai_temperature.toString() }),
      });

      showNotification('success', 'Ayarlar kaydedildi');
      setHasChanges(false);
    } catch (err) {
      showNotification('error', 'Kaydetme hatası');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              'fixed top-4 left-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-xl',
              notification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <section className="relative overflow-hidden border-b border-[hsl(var(--glass-border-subtle))]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="p-2 rounded-xl glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>

              <motion.div
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-xl" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
              </motion.div>

              <div>
                <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
                <p className="text-muted-foreground">Sistem geneli ayarları yönetin</p>
              </div>
            </div>

            <motion.button
              onClick={handleSave}
              disabled={saving || loading || !hasChanges}
              className={cn(
                'group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all overflow-hidden',
                hasChanges
                  ? 'text-white'
                  : 'bg-[hsl(var(--glass-bg-2))] text-muted-foreground cursor-not-allowed'
              )}
              whileHover={hasChanges ? { scale: 1.02 } : {}}
              whileTap={hasChanges ? { scale: 0.98 } : {}}
            >
              {hasChanges && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500" />
                  <div className="absolute inset-0 shadow-[0_0_20px_rgba(249,115,22,0.3)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
              {saving ? <Loader2 className="relative h-4 w-4 animate-spin" /> : <Save className="relative h-4 w-4" />}
              <span className="relative">Kaydet</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                <div className="relative h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Ayarlar yükleniyor...</p>
            </div>
          </div>
        ) : (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* AI Settings */}
            <div className="rounded-2xl glass-2 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <Bot className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Varsayılan AI Ayarları</h2>
                  <p className="text-xs text-muted-foreground">Tüm müşteriler için geçerli varsayılan ayarlar</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Varsayılan AI Modeli</label>
                  <select
                    value={settings.default_ai_model}
                    onChange={(e) => handleChange('default_ai_model', e.target.value)}
                    className="glass-input"
                  >
                    {AI_MODELS.map(model => (
                      <option key={model.value} value={model.value}>{model.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Müşteri bazında override yapılmadığında kullanılacak model
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Varsayılan Temperature</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.default_ai_temperature}
                      onChange={(e) => handleChange('default_ai_temperature', parseFloat(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-mono w-12 text-right text-foreground">{settings.default_ai_temperature}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    0 = Tutarlı, 1 = Yaratıcı
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl glass-2 p-6">
              <h2 className="font-semibold text-foreground mb-4">Hızlı Erişim</h2>
              <div className="space-y-2">
                <Link
                  href="/settings/system-prompts"
                  className="group flex items-center justify-between p-4 rounded-xl glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-blue-400 transition-colors">System Prompts</p>
                      <p className="text-xs text-muted-foreground">AI sistem promptlarını yönetin</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </section>
    </PageTransition>
  );
}
