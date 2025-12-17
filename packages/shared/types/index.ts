// =====================================================================
// SEO TOOL SUITE - SHARED TYPE DEFINITIONS
// =====================================================================

// ---------------------------------------------------------------------
// Common Types
// ---------------------------------------------------------------------

export type ProjectStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ToneOfVoice = 'formal' | 'casual' | 'professional' | 'friendly' | 'technical';

export type AIModel = 'gpt-4' | 'gpt-4-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'gemini-pro';

// ---------------------------------------------------------------------
// Client Types
// ---------------------------------------------------------------------

export interface Client {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  domain: string | null;
  industry: string | null;
  defaultLanguage: string;
  defaultCountry: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientConfiguration {
  id: number;
  clientId: number;
  toneOfVoice: ToneOfVoice;
  brandKeywords: string[];
  forbiddenWords: string[];
  competitorDomains: string[];
  keywordDensityMin: number;
  keywordDensityMax: number;
  internalLinksPerThousandWords: number;
  externalLinksPerThousandWords: number;
  aiModelPreference: AIModel;
  aiTemperature: number;
}

export interface ClientUrlInventory {
  id: number;
  clientId: number;
  url: string;
  pageTitle: string | null;
  pageType: 'homepage' | 'category' | 'product' | 'blog' | 'landing' | 'other';
  nodeRole: 'pillar' | 'hub' | 'cluster' | 'money_page' | 'booster' | 'bridge' | null;
  primaryKeyword: string | null;
  isActive: boolean;
  lastCrawledAt: string | null;
}

// ---------------------------------------------------------------------
// Tool 1: Keyword Research Types
// ---------------------------------------------------------------------

export type KeywordScenarioType = 'seed_keyword' | 'topic_based';

export type KeywordType = 'seed' | 'variation' | 'long_tail' | 'question' | 'related' | 'competitor';

export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';

export interface KeywordProject {
  id: number;
  uuid: string;
  clientId: number;
  projectName: string;
  mainKeyword: string;
  scenarioType: KeywordScenarioType;
  targetCountry: string;
  targetLanguage: string;
  status: ProjectStatus;
  totalKeywordsFound: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KeywordResult {
  id: number;
  projectId: number;
  keyword: string;
  keywordType: KeywordType;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  searchIntent: SearchIntent | null;
  parentKeywordId: number | null;
  clusterName: string | null;
  isPillar: boolean;
  opportunityScore: number | null;
  briefGenerated: boolean;
}

export interface CompetitorData {
  id: number;
  projectId: number;
  keywordId: number | null;
  competitorDomain: string;
  competitorUrl: string;
  serpPosition: number;
  pageTitle: string | null;
  domainAuthority: number | null;
  backlinksCount: number | null;
  contentWordCount: number | null;
  contentGapAnalysis: Record<string, unknown> | null;
}

export interface SerpFeature {
  id: number;
  projectId: number;
  keywordId: number;
  featureType: 'featured_snippet' | 'paa' | 'local_pack' | 'images' | 'videos' | 'knowledge_panel' | 'shopping' | 'news' | 'other';
  isOwnedByCompetitor: boolean;
  competitorDomain: string | null;
  opportunityLevel: 'high' | 'medium' | 'low';
}

export interface PaaData {
  id: number;
  projectId: number;
  keywordId: number;
  question: string;
  answerSnippet: string | null;
  sourceUrl: string | null;
  isPotentialH2: boolean;
}

// ---------------------------------------------------------------------
// Tool 2: Content Studio Types
// ---------------------------------------------------------------------

export type ContentScenarioType = 'content_exists' | 'content_generate';

export type ContentType = 'blog_post' | 'landing_page' | 'product_page' | 'category_page' | 'guide' | 'comparison' | 'listicle' | 'how_to';

export type SchemaType = 'Article' | 'BlogPosting' | 'HowTo' | 'FAQPage' | 'Product' | 'LocalBusiness' | 'Organization' | 'WebPage' | 'BreadcrumbList';

export interface ContentProject {
  id: number;
  uuid: string;
  clientId: number;
  sourceKeywordProjectId: number | null;
  projectName: string;
  targetKeyword: string;
  scenarioType: ContentScenarioType;
  contentType: ContentType;
  targetWordCount: number | null;
  status: ProjectStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentOutput {
  id: number;
  projectId: number;
  versionNumber: number;
  htmlContent: string;
  cleanHtmlContent: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  schemaType: SchemaType | null;
  schemaJson: Record<string, unknown> | null;
  wordCount: number | null;
  readabilityScore: number | null;
  seoScore: number | null;
  qcPassed: boolean;
  qcDetails: Record<string, unknown> | null;
  isPublishReady: boolean;
}

// ---------------------------------------------------------------------
// Tool 3: Internal Linking Types
// ---------------------------------------------------------------------

export type LinkingScenarioType = 'keyword_cluster' | 'topic_based' | 'url_sitemap';

export type EquityFlowModel = 'top_down' | 'bottom_up' | 'lateral' | 'mixed';

export type NodeRole = 'pillar' | 'hub' | 'cluster' | 'money_page' | 'booster' | 'bridge';

export type AnchorType = 'exact_match' | 'partial_match' | 'branded' | 'semantic' | 'generic' | 'naked_url';

export type LinkDirection = 'top_down' | 'bottom_up' | 'lateral';

export interface LinkingProject {
  id: number;
  uuid: string;
  clientId: number;
  sourceContentProjectId: number | null;
  sourceKeywordProjectId: number | null;
  projectName: string;
  scenarioType: LinkingScenarioType;
  equityFlowModel: EquityFlowModel;
  maxLinksPerPage: number;
  status: ProjectStatus;
  totalSuggestionsGenerated: number | null;
  totalLinksApplied: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkingSuggestion {
  id: number;
  projectId: number;
  sourceUrlId: number;
  targetUrlId: number;
  anchorText: string;
  anchorType: AnchorType;
  linkDirection: LinkDirection;
  relevanceScore: number | null;
  equityFlowScore: number | null;
  contextSnippet: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  rejectionReason: string | null;
}

export interface LinkingApplied {
  id: number;
  projectId: number;
  suggestionId: number;
  sourceUrl: string;
  targetUrl: string;
  anchorTextUsed: string;
  positionInContent: number | null;
  appliedAt: string;
}

export interface LinkingAnalysis {
  id: number;
  projectId: number;
  urlId: number;
  nodeRole: NodeRole | null;
  inboundLinksCount: number;
  outboundLinksCount: number;
  internalPageRank: number | null;
  isOrphan: boolean;
  isDeadEnd: boolean;
  siloBelong: string | null;
  analysisDetails: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------
// Dashboard Types
// ---------------------------------------------------------------------

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalKeywords: number;
  totalContent: number;
  totalLinks: number;
}

export interface RecentProject {
  id: number;
  uuid: string;
  tool: 'tool1' | 'tool2' | 'tool3';
  projectName: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  clientId: number;
  toolName: 'keyword_research' | 'content_studio' | 'internal_linking';
  projectId: number | null;
  action: string;
  logLevel: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  detailsJson: Record<string, unknown> | null;
  createdAt: string;
}
