'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Building2, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCreateClient } from '@/lib/hooks/use-clients';
import { getAPIErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

const INDUSTRIES = [
  { value: 'E-commerce', label: 'E-Ticaret' },
  { value: 'Technology', label: 'Teknoloji' },
  { value: 'Finance', label: 'Finans' },
  { value: 'Healthcare', label: 'Sağlık' },
  { value: 'Education', label: 'Eğitim' },
  { value: 'Manufacturing', label: 'Üretim' },
  { value: 'Real Estate', label: 'Gayrimenkul' },
  { value: 'Retail', label: 'Perakende' },
  { value: 'Services', label: 'Hizmet' },
  { value: 'Other', label: 'Diğer' },
];

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    industry: '',
    default_language: 'tr',
    default_country: 'TR',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Müşteri adı zorunludur';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'URL slug zorunludur';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug sadece küçük harf, rakam ve tire içerebilir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    try {
      const result = await createClient.mutateAsync(formData);
      if (result.success && result.data) {
        router.push(`/clients/${result.data.id}`);
      } else {
        setApiError((result as any).error || 'Müşteri oluşturulamadı');
      }
    } catch (error) {
      console.error('Failed to create client:', error);
      setApiError(getAPIErrorMessage(error));
    }
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Header Section */}
      <section className="relative overflow-hidden border-b border-[hsl(var(--glass-border-subtle))]">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,#0a0a0a_50%,transparent_100%)] opacity-50" />
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-start gap-5">
              {/* Back Button */}
              <Link
                href="/clients"
                className="p-2 rounded-xl glass-1 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>

              {/* Icon */}
              <motion.div
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="absolute inset-0 bg-purple-500/40 rounded-2xl blur-xl" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Building2 className="h-8 w-8 text-purple-400" />
                </div>
              </motion.div>

              {/* Title & Description */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">Yeni Müşteri</h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400">Enterprise</span>
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Yeni bir müşteri hesabı oluşturun ve yapılandırın.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="max-w-2xl mx-auto px-6 py-8">
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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

          {/* Client Name */}
          <div className="rounded-2xl glass-2 p-6 space-y-4">
            <label htmlFor="name" className="text-sm font-semibold text-foreground">
              Müşteri Adı <span className="text-purple-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Örn: ABC Şirketi"
              className={cn(
                'glass-input',
                errors.name && 'border-red-500/50'
              )}
            />
            {errors.name && (
              <p className="text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div className="rounded-2xl glass-2 p-6 space-y-4">
            <label htmlFor="slug" className="text-sm font-semibold text-foreground">
              URL Slug <span className="text-purple-400">*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value.toLowerCase() })
              }
              placeholder="abc-sirketi"
              className={cn(
                'glass-input',
                errors.slug && 'border-red-500/50'
              )}
            />
            {errors.slug ? (
              <p className="text-sm text-red-400">{errors.slug}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sadece küçük harf, rakam ve tire kullanın
              </p>
            )}
          </div>

          {/* Domain */}
          <div className="rounded-2xl glass-2 p-6 space-y-4">
            <label htmlFor="domain" className="text-sm font-semibold text-foreground">
              Web Sitesi
            </label>
            <input
              id="domain"
              type="url"
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
              placeholder="https://example.com"
              className="glass-input"
            />
          </div>

          {/* Industry */}
          <div className="rounded-2xl glass-2 p-6 space-y-4">
            <label htmlFor="industry" className="text-sm font-semibold text-foreground">
              Sektör
            </label>
            <select
              id="industry"
              value={formData.industry}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
              className="glass-input"
            >
              <option value="">Sektör seçin...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Settings */}
          <div className="rounded-2xl glass-2 p-6 space-y-4">
            <label className="text-sm font-semibold text-foreground">Bölge Ayarları</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="default_country" className="text-xs text-muted-foreground">
                  Varsayılan Ülke
                </label>
                <select
                  id="default_country"
                  value={formData.default_country}
                  onChange={(e) =>
                    setFormData({ ...formData, default_country: e.target.value })
                  }
                  className="glass-input"
                >
                  <option value="TR">Türkiye</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="default_language" className="text-xs text-muted-foreground">
                  Varsayılan Dil
                </label>
                <select
                  id="default_language"
                  value={formData.default_language}
                  onChange={(e) =>
                    setFormData({ ...formData, default_language: e.target.value })
                  }
                  className="glass-input"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/clients"
              className="flex-1 rounded-xl border border-[hsl(var(--glass-border-default))] px-6 py-3.5 text-center font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
            >
              İptal
            </Link>
            <motion.button
              type="submit"
              disabled={createClient.isPending}
              className="group relative flex-1 flex items-center justify-center gap-2 rounded-xl font-semibold text-white overflow-hidden disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500 bg-[length:200%_auto] opacity-0 group-hover:opacity-100 animate-gradient-shift transition-opacity" />
              <div className="absolute inset-0 shadow-[0_0_30px_rgba(168,85,247,0.3)] opacity-0 group-hover:opacity-100 transition-opacity" />
              {createClient.isPending && (
                <Loader2 className="relative h-5 w-5 animate-spin" />
              )}
              <span className="relative py-3.5">Müşteri Oluştur</span>
            </motion.button>
          </div>
        </motion.form>
      </section>
    </PageTransition>
  );
}
