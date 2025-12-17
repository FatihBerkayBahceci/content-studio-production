'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Search, Lightbulb, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCreateKeywordProject } from '@/lib/hooks/use-tool1';
import { useClients } from '@/lib/hooks/use-clients';
import { useClientStore } from '@/lib/stores/client-store';
import { cn } from '@/lib/utils/cn';
import { APIError } from '@/lib/api/client';
import { PageTransition } from '@/components/motion';

type ScenarioType = 'seed_keyword' | 'topic_based';

export default function NewKeywordProjectPage() {
  const router = useRouter();
  const selectedClientId = useClientStore((state) => state.selectedClientId);
  const { data: clientsData } = useClients();
  const createProject = useCreateKeywordProject();

  const [formData, setFormData] = useState({
    client_id: selectedClientId || 0,
    project_name: '',
    main_keyword: '',
    scenario_type: 'seed_keyword' as ScenarioType,
    target_country: 'TR',
    target_language: 'tr',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const clients = clientsData?.success ? clientsData.data : [];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Müşteri seçimi zorunludur';
    }
    if (!formData.project_name.trim()) {
      newErrors.project_name = 'Proje adı zorunludur';
    }
    if (!formData.main_keyword.trim()) {
      newErrors.main_keyword = 'Keyword zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    try {
      const result = await createProject.mutateAsync(formData);

      if (result.success && result.data) {
        router.push(`/tool1/${result.data.uuid || result.data.project_id}`);
      } else {
        const errorMessage = result.error || 'Proje oluşturulamadı';
        const details = (result as any).details;
        if (details && Array.isArray(details)) {
          setApiError(`${errorMessage}: ${details.join(', ')}`);
        } else {
          setApiError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Failed to create project:', error);

      if (error instanceof APIError) {
        try {
          const errorData = JSON.parse(error.message);
          const details = errorData.details;
          if (details && Array.isArray(details)) {
            setApiError(`${errorData.error || 'Hata'}: ${details.join(', ')}`);
          } else {
            setApiError(errorData.error || error.message);
          }
        } catch {
          setApiError(`Sunucu hatası: ${error.status} ${error.statusText}`);
        }
      } else {
        setApiError('Beklenmeyen bir hata oluştu');
      }
    }
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Header */}
      <section className="px-6 py-6 border-b border-[hsl(var(--glass-border-subtle))]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/tool1" className="hover:text-foreground transition-colors">
            Keyword Research
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Yeni Proje</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">Yeni Keyword Projesi</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs font-semibold text-primary">AI</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Keyword araştırması için yeni bir proje oluşturun
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="px-6 py-6">
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Error Alert */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Hata</p>
                  <p className="mt-1 text-red-300">{apiError}</p>
                </div>
              </motion.div>
            )}

            {/* Scenario Selection */}
            <Section title="Senaryo Tipi">
              <div className="grid grid-cols-2 gap-4">
                <ScenarioCard
                  icon={Search}
                  title="Seed Keyword"
                  description="Bir çekirdek keyword'den varyasyonlar üretin"
                  selected={formData.scenario_type === 'seed_keyword'}
                  onClick={() => setFormData({ ...formData, scenario_type: 'seed_keyword' })}
                />
                <ScenarioCard
                  icon={Lightbulb}
                  title="Topic Based"
                  description="Geniş bir konudan alt başlıklara inin"
                  selected={formData.scenario_type === 'topic_based'}
                  onClick={() => setFormData({ ...formData, scenario_type: 'topic_based' })}
                />
              </div>
            </Section>

            {/* Client Selection */}
            <Section title="Müşteri">
              <Field label="Müşteri Seçimi" required error={errors.client_id}>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: Number(e.target.value) })}
                  className={cn('form-input', errors.client_id && 'border-red-500/50')}
                >
                  <option value={0}>Müşteri seçin...</option>
                  {clients?.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </Field>
            </Section>

            {/* Project Details */}
            <Section title="Proje Bilgileri">
              <Field label="Proje Adı" required error={errors.project_name}>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  placeholder="Örn: Su Deposu Keyword Analizi"
                  className={cn('form-input', errors.project_name && 'border-red-500/50')}
                />
              </Field>

              <Field
                label={formData.scenario_type === 'seed_keyword' ? 'Seed Keyword' : 'Konu Başlığı'}
                required
                error={errors.main_keyword}
              >
                <input
                  type="text"
                  value={formData.main_keyword}
                  onChange={(e) => setFormData({ ...formData, main_keyword: e.target.value })}
                  placeholder={
                    formData.scenario_type === 'seed_keyword'
                      ? 'Örn: modüler su deposu'
                      : 'Örn: Su Depolama Sistemleri'
                  }
                  className={cn('form-input', errors.main_keyword && 'border-red-500/50')}
                />
              </Field>
            </Section>

            {/* Location Settings */}
            <Section title="Hedef Lokasyon">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ülke">
                  <select
                    value={formData.target_country}
                    onChange={(e) => setFormData({ ...formData, target_country: e.target.value })}
                    className="form-input"
                  >
                    <option value="TR">Türkiye</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                  </select>
                </Field>
                <Field label="Dil">
                  <select
                    value={formData.target_language}
                    onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
                    className="form-input"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Link
                href="/tool1"
                className="flex-1 rounded-xl border border-[hsl(var(--glass-border-default))] px-6 py-3.5 text-center font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                İptal
              </Link>
              <button
                type="submit"
                disabled={createProject.isPending}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-colors',
                  'bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {createProject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Proje Oluştur
              </button>
            </div>
          </form>
        </div>
      </section>
    </PageTransition>
  );
}

// Section Component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass-2 p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Field Component
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

// Scenario Card Component
function ScenarioCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start gap-3 rounded-xl p-5 text-left transition-all duration-200',
        selected
          ? 'bg-primary/10 border border-primary/30'
          : 'bg-[hsl(var(--glass-bg-1))] border border-[hsl(var(--glass-border-subtle))] hover:bg-[hsl(var(--glass-bg-interactive))]'
      )}
    >
      <div
        className={cn(
          'p-2.5 rounded-lg transition-colors',
          selected ? 'bg-primary/20' : 'bg-[hsl(var(--glass-bg-3))]'
        )}
      >
        <Icon className={cn('h-5 w-5 transition-colors', selected ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <div>
        <p className={cn('font-semibold transition-colors', selected ? 'text-primary' : 'text-foreground')}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </button>
  );
}
