// =====================================================================
// SEO TOOL SUITE - TOOL 1 API CLIENT (Keyword Research)
// =====================================================================

import { api } from './client';
import type {
  KeywordProject,
  KeywordResult,
  CompetitorData,
  SerpFeature,
  PaaData,
  ApiResponse,
  PaginatedResponse,
} from '@seo-tool-suite/shared/types';

/**
 * Extended CompetitorData with n8n snake_case aliases.
 * n8n returns snake_case, shared types use camelCase.
 */
export interface CompetitorDataWithSnakeCase extends CompetitorData {
  // n8n response fields (snake_case)
  word_count?: number;
  headings_json?: string | Record<string, string[]>;
  serp_position?: number;
  domain_rating?: number;
  title?: string;
  competitor_domain?: string;
  competitor_url?: string;
}

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface CreateKeywordProjectInput {
  client_id: number;
  project_name: string;
  main_keyword: string;
  scenario_type: 'seed_keyword' | 'topic_based';
  target_country?: string;
  target_language?: string;
}

/**
 * Extended KeywordProject with additional fields from n8n responses.
 * Includes both camelCase (from shared types) and snake_case (from n8n API).
 * This dual-support ensures compatibility during the transition period.
 */
export interface KeywordProjectWithResults extends KeywordProject {
  // n8n response fields (snake_case)
  client_name?: string;
  keyword_count?: number;
  project_name?: string;
  main_keyword?: string;
  total_keywords_found?: number;
  total_competitors_analyzed?: number;
  total_paa_found?: number;
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------

/**
 * Create a new keyword research project
 */
export async function createKeywordProject(
  data: CreateKeywordProjectInput
): Promise<ApiResponse<{ project_id: number; uuid: string }>> {
  return api.post('/tool1/project/create', data);
}

/**
 * Get a keyword project by ID or UUID
 * n8n webhook: tool1-project-get/tool1/project/:id
 */
export async function getKeywordProject(
  projectId: string | number
): Promise<ApiResponse<KeywordProjectWithResults>> {
  return api.get(`/tool1-project-get/tool1/project/${projectId}`);
}

/**
 * List keyword projects
 */
export async function listKeywordProjects(params?: {
  client_id?: number;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<KeywordProjectWithResults[]> & { total: number }> {
  return api.get('/tool1/projects', { params });
}

/**
 * Get keyword results for a project
 */
export async function getKeywordResults(
  projectId: number,
  params?: {
    keyword_type?: string;
    search_intent?: string;
    cluster_name?: string;
    limit?: number;
    offset?: number;
  }
): Promise<PaginatedResponse<KeywordResult>> {
  return api.get(`/tool1/project/${projectId}/results`, { params });
}

/**
 * Get competitor data for a project
 * n8n webhook: tool1-competitors-get/tool1-competitors/:projectId/get
 */
export async function getCompetitorData(
  projectId: number
): Promise<ApiResponse<CompetitorDataWithSnakeCase[]>> {
  return api.get(`/tool1-competitors-get/tool1-competitors/${projectId}/get`);
}

/**
 * Get SERP features for a project
 */
export async function getSerpFeatures(
  projectId: number
): Promise<ApiResponse<SerpFeature[]>> {
  return api.get(`/tool1/project/${projectId}/serp-features`);
}

/**
 * Get PAA (People Also Ask) data for a project
 */
export async function getPaaData(
  projectId: number
): Promise<ApiResponse<PaaData[]>> {
  return api.get(`/tool1/project/${projectId}/paa`);
}

/**
 * Start keyword discovery process (WF-101a)
 * Discovers keywords from multiple sources: Google Suggest, Google Trends, Ahrefs (optional)
 */
export async function discoverKeywords(
  projectId: number
): Promise<ApiResponse<{
  success: boolean;
  data: {
    project_id: number;
    client_name: string;
    main_keyword: string;
    scenario_type: string;
    keywords_found: number;
    sources_used: {
      google_suggest: boolean;
      google_trends: boolean;
      ahrefs: boolean;
    };
    keywords_by_source: Record<string, number>;
    ai_config: {
      model: string;
      provider: string;
    };
  };
  next_step: string;
}>> {
  return api.post('/keyword-discovery', { project_id: projectId });
}

/**
 * Filter keywords using AI (WF-101b)
 * AI analyzes and prioritizes keywords, assigns clusters
 */
export async function filterKeywords(
  projectId: number
): Promise<ApiResponse<{
  message: string;
  project_id: number;
  total_input: number;
  total_approved: number;
  total_rejected: number;
  cluster_map: Record<string, string[]>;
}>> {
  return api.post(`/tool1-keyword-filter/${projectId}/filter-keywords`);
}

/**
 * Get keywords for a project (WF-101c)
 * Returns keyword list with stats
 * Accepts both numeric ID and UUID string
 * Now uses direct database API instead of n8n webhook
 */
export async function getKeywords(
  projectId: string | number,
  params?: { limit?: number; offset?: number }
): Promise<{
  success: boolean;
  data: KeywordResult[];
  stats: {
    total: number;
    filtered_count: number;
    with_intent: number;
    avg_volume: number;
    avg_difficulty: number;
    avg_opportunity: number;
  };
  by_type: Record<string, number>;
  by_cluster: Record<string, number>;
}> {
  // Use direct Next.js API instead of n8n webhook for reliability
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', String(params.limit));
  if (params?.offset) queryParams.set('offset', String(params.offset));

  const url = `/api/projects/${projectId}/keywords${queryParams.toString() ? `?${queryParams}` : ''}`;
  const response = await fetch(url, {
    credentials: 'same-origin', // Include session cookies
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch keywords: ${response.status}`);
  }

  return response.json();
}

/**
 * @deprecated Use discoverKeywords instead
 */
export async function startKeywordDiscovery(
  projectId: number
): Promise<ApiResponse<{ status: string; message: string }>> {
  return discoverKeywords(projectId) as any;
}

/**
 * Start competitor analysis (WF-104)
 */
export async function analyzeCompetitors(
  projectId: number
): Promise<ApiResponse<{ message: string; status: string }>> {
  return api.post(`/tool1-competitor-analyze/${projectId}/analyze-competitors`);
}

/**
 * Scrape competitor pages for word count and headings (WF-104b)
 */
export async function scrapeCompetitors(
  projectId: number
): Promise<ApiResponse<{ message: string }>> {
  return api.post(`/tool1-competitor-scrape/tool1-competitor-scrape/${projectId}/scrape`);
}

/**
 * Detect SERP features and PAA questions (WF-105)
 */
export async function detectSerpFeatures(
  projectId: number
): Promise<ApiResponse<{
  message: string;
  serp_features: {
    has_featured_snippet: boolean;
    has_paa: boolean;
    paa_count: number;
    has_video_results: boolean;
    has_image_pack: boolean;
    zero_click_risk: string;
  };
  paa_questions_saved: number;
}>> {
  return api.post(`/tool1-serp-features/tool1-serp-features/${projectId}/detect`);
}

/**
 * Analyze content gaps using AI (WF-106)
 * Uses client's preferred AI model (OpenAI GPT-4 or Google Gemini)
 */
export async function analyzeContentGap(
  projectId: number
): Promise<ApiResponse<{
  message: string;
  project_id: number;
  analysis_summary: string;
  pillar_suggestion: string;
  cluster_suggestions: string[];
  keywords_found: number;
}>> {
  return api.post(`/tool1-content-gap/${projectId}/analyze`);
}

/**
 * Calculate opportunity scores using AI (WF-107)
 * AI evaluates keywords based on volume, difficulty, commercial value, competition, SERP features
 */
export async function calculateOpportunityScore(
  projectId: number
): Promise<ApiResponse<{
  success: boolean;
  message: string;
  project_id: number;
  ai_source: 'gemini' | 'openai' | 'mock';
  stats: {
    total_keywords: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
    low_hanging_fruits: number;
    average_score: number;
  };
  top_opportunities: string[];
  warnings: string[];
  next_step: string;
}>> {
  return api.post(`/tool1-opportunity-scorer/${projectId}/calculate`);
}

/**
 * Generate content strategy using AI (WF-109)
 * Creates Pillar-Cluster content strategy with page types and content recommendations
 */
export async function generateStrategy(
  projectId: number
): Promise<ApiResponse<{
  success: boolean;
  message: string;
  project_id: number;
  ai_source: 'gemini' | 'openai' | 'mock';
  strategy: {
    pillar_count: number;
    cluster_count: number;
    standalone_count: number;
    total_keywords: number;
    pillar_topics: string[];
  };
  content_recommendations: {
    high_priority: number;
    medium_priority: number;
    low_priority: number;
    total_word_count: number;
  };
  next_step: string;
}>> {
  return api.post(`/tool1-strategy-generator/${projectId}/generate`);
}

/**
 * Report data interface for WF-110
 */
export interface ReportData {
  success: boolean;
  project: {
    id: number;
    name: string;
    main_keyword: string;
    scenario_type: string;
    client_name: string;
    status: string;
    created_at: string;
  };
  statistics: {
    total_keywords: number;
    filtered_keywords: number;
    avg_volume: number;
    avg_difficulty: number;
    avg_opportunity: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
    low_hanging_fruits: number;
    pillar_pages: number;
    cluster_pages: number;
    total_competitors: number;
    unique_competitors: number;
    avg_word_count: number;
    total_paa_questions: number;
  };
  clusters: Record<string, string[]>;
  intent_distribution: Record<string, number>;
  top_opportunities: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    opportunity_score: number;
    intent: string;
    priority: string;
    page_type: string;
    content_format: string;
  }>;
  export_data: {
    keywords_csv: string;
    competitors_csv: string;
    paa_csv: string;
  };
  generated_at: string;
}

/**
 * Get full report data for a project (WF-110)
 * Returns comprehensive report with all analysis data
 */
export async function getReportData(
  projectId: number
): Promise<ApiResponse<ReportData>> {
  return api.get(`/tool1-report-exporter/${projectId}/export`, { params: { format: 'json' } });
}

/**
 * Export report as HTML (WF-110)
 * Returns beautifully formatted HTML report
 */
export async function exportReportHtml(
  projectId: number
): Promise<string> {
  // Proxy wraps non-JSON responses as { success: true, message: "..." }
  const response = await api.get<{ success: boolean; message: string } | string>(
    `/tool1-report-exporter/${projectId}/export`,
    { params: { format: 'html' } }
  );

  // Handle wrapped response from proxy
  if (typeof response === 'object' && response !== null && 'message' in response) {
    return response.message;
  }

  return response as string;
}

/**
 * Export report as CSV bundle (WF-110)
 * Returns CSV files for keywords, competitors, PAA
 */
export async function exportReportCsv(
  projectId: number
): Promise<{
  summary_csv: string;
  keywords_csv: string;
  competitors_csv: string;
  paa_csv: string;
}> {
  const response = await api.get<{
    success: boolean;
    files: {
      'summary.csv': string;
      'keywords.csv': string;
      'competitors.csv': string;
      'paa.csv': string;
    };
  }>(`/tool1-report-exporter/${projectId}/export`, {
    params: { format: 'csv' }
  });

  // Map from n8n format (files object with .csv suffix) to expected format
  return {
    summary_csv: response.files?.['summary.csv'] || '',
    keywords_csv: response.files?.['keywords.csv'] || '',
    competitors_csv: response.files?.['competitors.csv'] || '',
    paa_csv: response.files?.['paa.csv'] || '',
  };
}

// ---------------------------------------------------------------------
// Project Validation Types
// ---------------------------------------------------------------------

export interface ToolValidationStatus {
  id: string;
  name: string;
  canRun: boolean;
  hasRun: boolean;
  dataCount: number;
  prerequisites: string[];
  missingPrerequisites: string[];
  recommended?: string[];
  note?: string;
}

export interface ProjectValidation {
  success: boolean;
  project: {
    id: number;
    uuid: string;
    name: string;
    mainKeyword: string;
    status: string;
    createdAt: string;
  };
  stats: {
    keywords: number;
    filteredKeywords: number;
    scoredKeywords: number;
    strategyKeywords: number;
    competitors: number;
    scrapedCompetitors: number;
    serpFeatures: number;
    paaQuestions: number;
  };
  tools: {
    discovery: ToolValidationStatus;
    filter: ToolValidationStatus;
    competitors: ToolValidationStatus;
    scraper: ToolValidationStatus;
    serp: ToolValidationStatus;
    contentGap: ToolValidationStatus;
    opportunity: ToolValidationStatus;
    strategy: ToolValidationStatus;
  };
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  nextStep: string | null;
  nextStepInfo: ToolValidationStatus | null;
}

/**
 * Validate project and get tool readiness status (WF-100)
 * Returns comprehensive validation info for all tools
 */
export async function validateProject(
  projectId: string | number
): Promise<ProjectValidation> {
  return api.get(`/tool1-project-validate/${projectId}/validate`);
}

/**
 * Export keyword project report as file
 */
export async function exportKeywordReport(
  projectId: number,
  format: 'csv' | 'json' | 'html' = 'csv'
): Promise<Blob> {
  if (format === 'html') {
    const html = await exportReportHtml(projectId);
    return new Blob([html], { type: 'text/html' });
  }

  if (format === 'json') {
    const reportData = await getReportData(projectId);
    if (!reportData.success) {
      throw new Error('Failed to get report data');
    }
    // API returns data directly, not wrapped in 'data' field
    return new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
  }

  // CSV format - return all CSVs bundled
  const csvData = await exportReportCsv(projectId);
  const combinedCsv = [
    '=== SUMMARY ===',
    csvData.summary_csv || '',
    '',
    '=== KEYWORDS ===',
    csvData.keywords_csv || '',
    '',
    '=== COMPETITORS ===',
    csvData.competitors_csv || '',
    '',
    '=== PAA QUESTIONS ===',
    csvData.paa_csv || ''
  ].join('\n');

  return new Blob([combinedCsv], { type: 'text/csv' });
}
