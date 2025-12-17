-- =====================================================================
-- SEO TOOL SUITE - Migration 002: Keyword Data Sources
-- Date: December 2025
-- Description: Add multi-source keyword discovery configuration
-- =====================================================================

USE seo_tool_suite;

-- Add new data source configuration columns to client_configurations
ALTER TABLE client_configurations
ADD COLUMN enable_google_suggest TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Google Autocomplete API aktif mi (Ucretsiz)' AFTER enable_ahrefs_api,
ADD COLUMN enable_google_trends TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Google Trends verisi aktif mi (Ucretsiz)' AFTER enable_google_suggest;

-- Update keyword_results source enum to include new sources
ALTER TABLE keyword_results
MODIFY COLUMN source ENUM(
    'ahrefs',
    'semrush',
    'google_suggest',
    'google_trends',
    'paa',
    'manual',
    'ai',
    'multi_source'
) NOT NULL DEFAULT 'manual';

-- Update keyword_type enum to include new types
ALTER TABLE keyword_results
MODIFY COLUMN keyword_type ENUM(
    'primary',
    'secondary',
    'long_tail',
    'semantic',
    'lsi',
    'related',
    'question',
    'google_suggest',
    'trend_based',
    'topic_derived',
    'ahrefs'
) NOT NULL DEFAULT 'related';

-- Update keyword_projects api_source enum
ALTER TABLE keyword_projects
MODIFY COLUMN api_source ENUM(
    'ahrefs',
    'semrush',
    'manual',
    'multi_source',
    'google_only'
) NULL;

-- Add index for faster source-based queries (ignore if exists)
-- Using CREATE INDEX without IF NOT EXISTS - will fail silently if exists
ALTER TABLE keyword_results ADD INDEX idx_kwresult_source (project_id, source);

-- =====================================================================
-- Migration completed
-- =====================================================================
SELECT 'Migration 002_keyword_sources completed successfully!' AS Status;
