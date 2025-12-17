// =====================================================================
// SEO TOOL SUITE - TOOL 1 HOOKS (Keyword Research)
// =====================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tool1Api from '@/lib/api/tool1';
import { POLLING_INTERVAL } from '@/lib/utils/constants';

// ---------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------

export const tool1Keys = {
  all: ['tool1'] as const,
  projects: () => [...tool1Keys.all, 'projects'] as const,
  projectList: (params?: object) => [...tool1Keys.projects(), 'list', params] as const,
  project: (id: string | number) => [...tool1Keys.projects(), 'detail', id] as const,
  validation: (projectId: string | number) => [...tool1Keys.all, 'validation', projectId] as const,
  keywords: (projectId: string | number) => [...tool1Keys.all, 'keywords', projectId] as const,
  results: (projectId: number) => [...tool1Keys.all, 'results', projectId] as const,
  competitors: (projectId: number) => [...tool1Keys.all, 'competitors', projectId] as const,
  serpFeatures: (projectId: number) => [...tool1Keys.all, 'serp-features', projectId] as const,
  paa: (projectId: number) => [...tool1Keys.all, 'paa', projectId] as const,
};

// ---------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------

/**
 * List keyword projects
 */
export function useKeywordProjects(params?: {
  client_id?: number;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: tool1Keys.projectList(params),
    queryFn: () => tool1Api.listKeywordProjects(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get a single keyword project with polling for processing status
 */
export function useKeywordProject(projectId: string | number | null) {
  return useQuery({
    queryKey: tool1Keys.project(projectId || ''),
    queryFn: () => tool1Api.getKeywordProject(projectId!),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 3 seconds if status is 'processing'
      if (data?.success && data?.data?.status === 'processing') {
        return POLLING_INTERVAL;
      }
      return false;
    },
  });
}

/**
 * Validate project and get tool readiness status (WF-100)
 * Returns comprehensive validation info for all tools
 */
export function useProjectValidation(projectId: string | number | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: tool1Keys.validation(projectId || ''),
    queryFn: () => tool1Api.validateProject(projectId!),
    enabled: !!projectId,
    staleTime: 10 * 1000, // 10 seconds - validation data changes after tool runs
    // Helper to refresh validation after tool runs
    meta: {
      invalidateOnToolRun: () => {
        queryClient.invalidateQueries({ queryKey: tool1Keys.validation(projectId!) });
      },
    },
  });
}

/**
 * Helper hook to check if a specific tool can run
 */
export function useToolCanRun(
  projectId: string | number | null,
  toolName: keyof tool1Api.ProjectValidation['tools']
) {
  const { data, isLoading, error } = useProjectValidation(projectId);

  if (isLoading || error || !data?.success) {
    return {
      canRun: false,
      hasRun: false,
      isLoading,
      error: error?.message || (!data?.success ? 'Validation failed' : null),
      missingPrerequisites: [] as string[],
      dataCount: 0,
      tool: null as tool1Api.ToolValidationStatus | null,
    };
  }

  const tool = data.tools[toolName];
  return {
    canRun: tool.canRun,
    hasRun: tool.hasRun,
    isLoading: false,
    error: null,
    missingPrerequisites: tool.missingPrerequisites,
    dataCount: tool.dataCount,
    tool,
  };
}

/**
 * Create a new keyword project
 */
export function useCreateKeywordProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tool1Api.createKeywordProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tool1Keys.projects() });
    },
  });
}

/**
 * Discover keywords from API or mock (WF-101a)
 */
export function useDiscoverKeywords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tool1Api.discoverKeywords,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: tool1Keys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.keywords(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.validation(projectId) });
    },
  });
}

/**
 * Filter keywords using AI (WF-101b)
 */
export function useFilterKeywords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tool1Api.filterKeywords,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: tool1Keys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.keywords(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.validation(projectId) });
    },
  });
}

/**
 * Get keywords for a project (WF-101c)
 * Accepts both numeric ID and UUID string
 */
export function useKeywords(projectId: string | number | null, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: [...tool1Keys.keywords(projectId || 0), params],
    queryFn: () => tool1Api.getKeywords(projectId!, params),
    enabled: !!projectId,
  });
}

/**
 * @deprecated Use useDiscoverKeywords instead
 */
export function useStartKeywordDiscovery() {
  return useDiscoverKeywords();
}

/**
 * Start competitor analysis (WF-104)
 */
export function useAnalyzeCompetitors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tool1Api.analyzeCompetitors,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: tool1Keys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.competitors(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.validation(projectId) });
    },
  });
}

/**
 * Scrape competitor pages (WF-104b)
 */
export function useScrapeCompetitors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tool1Api.scrapeCompetitors,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: tool1Keys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.competitors(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.validation(projectId) });
    },
  });
}

/**
 * Detect SERP features (WF-105)
 */
export function useDetectSerpFeatures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tool1Api.detectSerpFeatures,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: tool1Keys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.serpFeatures(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.paa(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.validation(projectId) });
    },
  });
}

/**
 * Analyze content gaps using AI (WF-106)
 */
export function useAnalyzeContentGap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tool1Api.analyzeContentGap,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: tool1Keys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.results(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.validation(projectId) });
    },
  });
}

/**
 * Calculate opportunity scores using AI (WF-107)
 */
export function useCalculateOpportunityScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tool1Api.calculateOpportunityScore,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: tool1Keys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.results(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.keywords(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.validation(projectId) });
    },
  });
}

/**
 * Generate content strategy using AI (WF-109)
 */
export function useGenerateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tool1Api.generateStrategy,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: tool1Keys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.results(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.keywords(projectId) });
      queryClient.invalidateQueries({ queryKey: tool1Keys.validation(projectId) });
    },
  });
}

/**
 * Get keyword results for a project
 */
export function useKeywordResults(
  projectId: number | null,
  params?: Parameters<typeof tool1Api.getKeywordResults>[1]
) {
  return useQuery({
    queryKey: [...tool1Keys.results(projectId || 0), params],
    queryFn: () => tool1Api.getKeywordResults(projectId!, params),
    enabled: !!projectId,
  });
}

/**
 * Get competitor data for a project
 */
export function useCompetitorData(projectId: number | null) {
  return useQuery({
    queryKey: tool1Keys.competitors(projectId || 0),
    queryFn: () => tool1Api.getCompetitorData(projectId!),
    enabled: !!projectId,
  });
}

/**
 * Get SERP features for a project
 */
export function useSerpFeatures(projectId: number | null) {
  return useQuery({
    queryKey: tool1Keys.serpFeatures(projectId || 0),
    queryFn: () => tool1Api.getSerpFeatures(projectId!),
    enabled: !!projectId,
  });
}

/**
 * Get PAA data for a project
 */
export function usePaaData(projectId: number | null) {
  return useQuery({
    queryKey: tool1Keys.paa(projectId || 0),
    queryFn: () => tool1Api.getPaaData(projectId!),
    enabled: !!projectId,
  });
}

/**
 * Get report data for a project (WF-110)
 */
export function useReportData(projectId: number | null) {
  return useQuery({
    queryKey: [...tool1Keys.all, 'report', projectId],
    queryFn: () => tool1Api.getReportData(projectId!),
    enabled: !!projectId,
  });
}

/**
 * Export keyword report
 */
export function useExportKeywordReport() {
  return useMutation({
    mutationFn: ({
      projectId,
      format,
    }: {
      projectId: number;
      format?: 'csv' | 'json' | 'html';
    }) => tool1Api.exportKeywordReport(projectId, format),
    onSuccess: (blob, { projectId, format = 'csv' }) => {
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyword-report-${projectId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}

/**
 * Export report as HTML and open in new tab
 */
export function useExportReportHtml() {
  return useMutation({
    mutationFn: (projectId: number) => tool1Api.exportReportHtml(projectId),
    onSuccess: (html) => {
      // Open HTML report in new tab
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    },
  });
}
