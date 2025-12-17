'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Download,
  FileText,
  Globe,
  TrendingUp,
  Target,
  BarChart3,
  Loader2,
  AlertCircle,
  Copy,
  Filter,
  List,
  LayoutGrid,
  ArrowRight,
  ExternalLink,
  Calendar,
  Building2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';

interface PageProps {
  params: { projectId: string };
}

interface KeywordResult {
  id?: number;
  keyword: string;
  source?: string;
  search_volume?: number | null;
  keyword_difficulty?: number | null;
  competition?: string | null;
  cpc?: number | null;
  search_intent?: string | null;
  keyword_cluster?: string | null;
  opportunity_score?: number | null;
  content_priority?: string | null;
}

interface Project {
  id: number;
  uuid: string;
  project_name: string;
  main_keyword: string;
  status: string;
  client_id: number;
  client_name?: string;
  total_keywords_found?: number;
  created_at: string;
}

export default function KeywordResultsPage({ params }: PageProps) {
  const { projectId } = params;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'keyword' | 'volume' | 'cpc' | 'difficulty'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch project and keywords
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project info
        const projectRes = await fetch(`/api/projects/${projectId}`);
        const projectData = await projectRes.json();

        if (!projectData.success) {
          setError(projectData.error || 'Proje bulunamadı');
          setIsLoading(false);
          return;
        }

        setProject(projectData.project);

        // Fetch keywords
        const keywordsRes = await fetch(`/api/projects/${projectId}/keywords`);
        const keywordsData = await keywordsRes.json();

        if (keywordsData.success) {
          setKeywords(keywordsData.data || []);
          setStats(keywordsData.stats);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Veriler yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let filtered = keywords.filter(kw =>
      !searchQuery || kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'volume':
          aVal = a.search_volume || 0;
          bVal = b.search_volume || 0;
          break;
        case 'cpc':
          aVal = a.cpc || 0;
          bVal = b.cpc || 0;
          break;
        case 'difficulty':
          aVal = a.keyword_difficulty || 0;
          bVal = b.keyword_difficulty || 0;
          break;
        default:
          aVal = a.keyword.toLowerCase();
          bVal = b.keyword.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [keywords, searchQuery, sortBy, sortOrder]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredKeywords.length) return;

    const headers = ['Keyword', 'Kaynak', 'Hacim', 'Zorluk', 'Rekabet', 'CPC', 'Intent', 'Fırsat Skoru'];
    const rows = filteredKeywords.map(kw => [
      kw.keyword,
      kw.source || '',
      kw.search_volume || '',
      kw.keyword_difficulty || '',
      kw.competition || '',
      kw.cpc || '',
      kw.search_intent || '',
      kw.opportunity_score || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${project?.main_keyword || projectId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!filteredKeywords.length) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Keyword Research - ${project?.main_keyword}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f97316; color: white; padding: 12px 8px; text-align: left; }
          td { padding: 10px 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>Keyword Research Report</h1>
        <div class="meta">
          <strong>Ana Keyword:</strong> ${project?.main_keyword}<br>
          <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}<br>
          <strong>Toplam Keyword:</strong> ${filteredKeywords.length}
        </div>
        <table>
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Hacim</th>
              <th>Zorluk</th>
              <th>CPC</th>
              <th>Intent</th>
            </tr>
          </thead>
          <tbody>
            ${filteredKeywords.map(kw => `
              <tr>
                <td>${kw.keyword}</td>
                <td>${kw.search_volume?.toLocaleString() || '-'}</td>
                <td>${kw.keyword_difficulty || '-'}</td>
                <td>${kw.cpc ? '$' + kw.cpc.toFixed(2) : '-'}</td>
                <td>${kw.search_intent || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <div className="relative h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Sonuçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 rounded-2xl bg-red-500/10 inline-block mb-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Hata</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            href="/keywords"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Yeni Arama Yap
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-[hsl(var(--glass-border-subtle))]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/keywords"
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
                <div className="absolute inset-0 bg-emerald-500/40 rounded-2xl blur-xl" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
              </motion.div>

              <div>
                <h1 className="text-2xl font-bold text-foreground">Keyword Sonuçları</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-primary">{project?.main_keyword}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {project?.created_at ? new Date(project.created_at).toLocaleDateString('tr-TR') : '-'}
                  </span>
                  {project?.client_name && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {project.client_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/tool1/${projectId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Tam Pipeline
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="px-6 py-4">
          <motion.div
            className="grid grid-cols-3 md:grid-cols-6 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard label="Toplam" value={stats.total || keywords.length} icon={FileText} color="primary" />
            <StatCard label="Ort. Hacim" value={Math.round(stats.avg_volume || 0)} icon={TrendingUp} color="emerald" />
            <StatCard label="Ort. Zorluk" value={Math.round(stats.avg_difficulty || 0)} icon={Target} color="amber" />
            <StatCard label="Ort. Fırsat" value={Math.round(stats.avg_opportunity || 0)} icon={BarChart3} color="blue" />
            <StatCard label="Yüksek Öncelik" value={stats.high_priority || 0} icon={Sparkles} color="red" />
            <StatCard label="Intent Var" value={stats.with_intent || 0} icon={Globe} color="purple" />
          </motion.div>
        </section>
      )}

      {/* Toolbar */}
      <section className="px-6">
        <motion.div
          className="rounded-xl glass-1 p-3 flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keyword ara..."
                className="pl-9 pr-4 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border-none text-sm focus:ring-2 focus:ring-primary/50 w-48"
              />
            </div>
            <div className="flex items-center gap-1 bg-[hsl(var(--glass-bg-2))] rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={cn('p-2 rounded-md transition-colors', viewMode === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={cn('p-2 rounded-md transition-colors', viewMode === 'cards' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-') as [typeof sortBy, 'asc' | 'desc'];
                setSortBy(by);
                setSortOrder(order);
              }}
              className="px-3 py-2 rounded-lg bg-[hsl(var(--glass-bg-2))] border-none text-sm"
            >
              <option value="volume-desc">Hacim (Yüksek)</option>
              <option value="volume-asc">Hacim (Düşük)</option>
              <option value="difficulty-asc">Zorluk (Düşük)</option>
              <option value="difficulty-desc">Zorluk (Yüksek)</option>
              <option value="cpc-desc">CPC (Yüksek)</option>
              <option value="cpc-asc">CPC (Düşük)</option>
              <option value="keyword-asc">A-Z</option>
              <option value="keyword-desc">Z-A</option>
            </select>
            <span className="text-sm text-muted-foreground">
              {filteredKeywords.length} sonuç
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!filteredKeywords.length}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!filteredKeywords.length}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </motion.div>
      </section>

      {/* Results */}
      <section className="px-6 py-4">
        {keywords.length === 0 ? (
          <motion.div
            className="rounded-2xl glass-2 p-12 flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="p-4 rounded-2xl bg-amber-500/10 mb-4">
              <AlertCircle className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Henüz Keyword Yok</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Bu proje için keyword verisi bulunamadı. Arama işlemi devam ediyor olabilir.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
          </motion.div>
        ) : viewMode === 'table' ? (
          <motion.div
            className="rounded-2xl glass-2 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-[hsl(var(--glass-bg-3))] sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keyword</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hacim</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zorluk</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rekabet</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">CPC</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intent</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fırsat</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--glass-border-subtle))]">
                  {filteredKeywords.map((kw, index) => (
                    <motion.tr
                      key={kw.id || index}
                      className="group hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(0.02 * index, 0.3) }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{kw.keyword}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-foreground">
                          {kw.search_volume?.toLocaleString() || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DifficultyBadge value={kw.keyword_difficulty} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CompetitionBadge competition={kw.competition} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {kw.cpc ? (
                          <span className="text-emerald-400 font-medium">${kw.cpc.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <IntentBadge intent={kw.search_intent} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <OpportunityBadge value={kw.opportunity_score} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => copyKeyword(kw.keyword)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                          title="Kopyala"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {filteredKeywords.slice(0, 60).map((kw, index) => (
              <motion.div
                key={kw.id || index}
                className="rounded-xl glass-1 p-4 hover:border-primary/30 transition-all group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.02 * index, 0.3) }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-foreground">{kw.keyword}</h4>
                  <button
                    onClick={() => copyKeyword(kw.keyword)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 inline mr-1" />
                    {kw.search_volume?.toLocaleString() || '-'}
                  </span>
                  {kw.keyword_difficulty && (
                    <DifficultyBadge value={kw.keyword_difficulty} />
                  )}
                  {kw.cpc && (
                    <span className="text-emerald-400">
                      ${kw.cpc.toFixed(2)}
                    </span>
                  )}
                  <IntentBadge intent={kw.search_intent} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Bottom Action Bar */}
      <section className="px-6 py-6">
        <motion.div
          className="rounded-2xl bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Daha Detaylı Analiz İster misiniz?</h3>
              <p className="text-sm text-muted-foreground">
                Rakip analizi, SERP özellikleri, içerik stratejisi ve daha fazlası için tam pipeline'a gidin.
              </p>
            </div>
            <Link
              href={`/tool1/${projectId}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              Tam Pipeline'a Git
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </PageTransition>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'primary' | 'red';
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    primary: 'text-primary bg-primary/10',
    red: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="rounded-xl glass-1 p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('p-1.5 rounded-lg', colors[color])}>
          <Icon className={cn('h-3.5 w-3.5', colors[color].split(' ')[0])} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value.toLocaleString()}</p>
    </div>
  );
}

// Difficulty Badge
function DifficultyBadge({ value }: { value?: number | null }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground">-</span>;

  const color = value <= 30 ? 'emerald' : value <= 60 ? 'amber' : 'red';
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-semibold', colors[color])}>
      {value}
    </span>
  );
}

// Opportunity Badge
function OpportunityBadge({ value }: { value?: number | null }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground">-</span>;

  const color = value >= 70 ? 'emerald' : value >= 40 ? 'amber' : 'red';
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-semibold', colors[color])}>
      {value}
    </span>
  );
}

// Competition Badge
function CompetitionBadge({ competition }: { competition?: string | null }) {
  if (!competition) return <span className="text-muted-foreground text-xs">-</span>;

  const colors: Record<string, string> = {
    'LOW': 'bg-emerald-500/20 text-emerald-400',
    'MEDIUM': 'bg-amber-500/20 text-amber-400',
    'HIGH': 'bg-red-500/20 text-red-400',
  };

  const labels: Record<string, string> = {
    'LOW': 'Düşük',
    'MEDIUM': 'Orta',
    'HIGH': 'Yüksek',
  };

  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded text-xs font-medium',
      colors[competition.toUpperCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground'
    )}>
      {labels[competition.toUpperCase()] || competition}
    </span>
  );
}

// Intent Badge
function IntentBadge({ intent }: { intent?: string | null }) {
  if (!intent) return <span className="text-muted-foreground text-xs">-</span>;

  const colors: Record<string, string> = {
    'informational': 'bg-blue-500/20 text-blue-400',
    'transactional': 'bg-emerald-500/20 text-emerald-400',
    'commercial': 'bg-purple-500/20 text-purple-400',
    'navigational': 'bg-amber-500/20 text-amber-400',
  };

  const labels: Record<string, string> = {
    'informational': 'Info',
    'transactional': 'Trans',
    'commercial': 'Comm',
    'navigational': 'Nav',
  };

  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded text-xs font-medium',
      colors[intent.toLowerCase()] || 'bg-[hsl(var(--glass-bg-3))] text-muted-foreground'
    )}>
      {labels[intent.toLowerCase()] || intent}
    </span>
  );
}
