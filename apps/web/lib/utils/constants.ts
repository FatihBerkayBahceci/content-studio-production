// =====================================================================
// SEO TOOL SUITE - CONSTANTS
// =====================================================================

export const APP_NAME = 'SEO Tool Suite';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

// Tool Names
export const TOOLS = {
  TOOL1: {
    name: 'Keyword Research',
    slug: 'tool1',
    description: 'NE yazacağız? Keyword araştırması ve strateji belirleme.',
    color: 'tool1',
    icon: 'Search',
  },
  TOOL2: {
    name: 'Content Studio',
    slug: 'tool2',
    description: 'NASIL yazacağız? İçerik üretimi ve HTML çıktı.',
    color: 'tool2',
    icon: 'FileText',
  },
  TOOL3: {
    name: 'Internal Linking',
    slug: 'tool3',
    description: 'NEREYE bağlayacağız? Link stratejisi ve uygulama.',
    color: 'tool3',
    icon: 'Link2',
  },
} as const;

// Project Status
export const PROJECT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  // Temel durumlar
  pending: 'Beklemede',
  processing: 'İşleniyor',
  completed: 'Tamamlandı',
  failed: 'Başarısız',

  // Pipeline aşamaları
  keywords_discovered: 'Keywordler Bulundu',
  keywords_filtered: 'Keywordler Filtrelendi',
  competitors_analyzed: 'Rakipler Analiz Edildi',
  competitors_scraped: 'Rakip İçerikleri Çekildi',
  serp_analyzed: 'SERP Analiz Edildi',
  content_gap_analyzed: 'İçerik Boşluğu Analizi',
  scores_calculated: 'Skorlar Hesaplandı',
  strategy_generated: 'Strateji Oluşturuldu',
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  pending: 'status-pending',
  processing: 'status-processing',
  completed: 'status-completed',
  failed: 'status-failed',
  keywords_discovered: 'status-keywords',
  keywords_filtered: 'status-filtered',
  competitors_analyzed: 'status-competitors',
  competitors_scraped: 'status-scraped',
  serp_analyzed: 'status-serp',
  content_gap_analyzed: 'status-gap',
  scores_calculated: 'status-scores',
  strategy_generated: 'status-strategy',
};

// Polling Configuration
export const POLLING_INTERVAL = 3000; // 3 seconds
export const MAX_POLLING_RETRIES = 100; // Maximum polling attempts

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Search Intent Labels
export const SEARCH_INTENT_LABELS: Record<string, string> = {
  informational: 'Bilgisel',
  commercial: 'Ticari',
  transactional: 'İşlemsel',
  navigational: 'Navigasyonel',
};

// Content Types
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog_post: 'Blog Yazısı',
  landing_page: 'Landing Page',
  product_page: 'Ürün Sayfası',
  category_page: 'Kategori Sayfası',
  guide: 'Rehber',
  comparison: 'Karşılaştırma',
  listicle: 'Liste Yazısı',
  how_to: 'Nasıl Yapılır',
};

// Node Roles
export const NODE_ROLE_LABELS: Record<string, string> = {
  pillar: 'Pillar',
  hub: 'Hub',
  cluster: 'Cluster',
  money_page: 'Money Page',
  booster: 'Booster',
  bridge: 'Bridge',
};

// Anchor Types
export const ANCHOR_TYPE_LABELS: Record<string, string> = {
  exact_match: 'Tam Eşleşme',
  partial_match: 'Kısmi Eşleşme',
  branded: 'Markalı',
  semantic: 'Semantik',
  generic: 'Genel',
  naked_url: 'URL',
};

// AI Models
export const AI_MODEL_LABELS: Record<string, string> = {
  'gpt-4': 'GPT-4',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'claude-3-opus': 'Claude 3 Opus',
  'claude-3-sonnet': 'Claude 3 Sonnet',
  'gemini-pro': 'Gemini Pro',
};

// Tone of Voice
export const TONE_OF_VOICE_LABELS: Record<string, string> = {
  formal: 'Resmi',
  casual: 'Gündelik',
  professional: 'Profesyonel',
  friendly: 'Samimi',
  technical: 'Teknik',
};
