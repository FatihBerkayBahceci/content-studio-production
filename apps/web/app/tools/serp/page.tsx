'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Search, Loader2, ArrowRight, FolderOpen,
  Calendar, Hash, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PageTransition } from '@/components/motion';
import { useKeywordProjects } from '@/lib/hooks/use-tool1';

export default function SerpToolPage() {
  const router = useRouter();
  const { data, isLoading } = useKeywordProjects();
  const [searchQuery, setSearchQuery] = useState('');

  const projects = data?.success && data?.data ? data.data : [];

  const filteredProjects = projects.filter((p: any) =>
    p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.main_keyword?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectSelect = (projectId: string) => {
    router.push(`/tool1/${projectId}/serp`);
  };

  return (
    <PageTransition className="min-h-screen">
      {/* Header */}
      <div className="px-6 py-8 border-b border-[hsl(var(--glass-border-subtle))]">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <Sparkles className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">SERP Analizi</h1>
            <p className="text-muted-foreground">
              Arama sonuçlarındaki özel özellikleri ve fırsatları keşfedin
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Proje ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--glass-bg-2))] border border-[hsl(var(--glass-border-subtle))] text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Projeler yükleniyor...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-2xl bg-[hsl(var(--glass-bg-2))] mb-4">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Proje Bulunamadı</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {searchQuery ? 'Arama kriterlerine uygun proje yok.' : 'Henüz bir proje oluşturmadınız.'}
            </p>
            <Link
              href="/tool1"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors"
            >
              Yeni Proje Oluştur
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((project: any, index: number) => (
              <motion.button
                key={project.uuid || project.id}
                onClick={() => handleProjectSelect(project.uuid || project.id)}
                className="w-full text-left rounded-xl glass-1 p-4 hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.project_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{project.main_keyword}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        {project.total_keywords_found || 0} keyword
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(project.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
