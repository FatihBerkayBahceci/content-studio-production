-- =====================================================================
-- SEO TOOL SUITE - INITIAL MIGRATION
-- Migration: 001_initial
-- Date: December 2025
-- Description: Initial database schema setup
-- =====================================================================

-- Import the full schema from schema/seo_tool_suite_schema_v3.sql
-- This migration file serves as a placeholder and reference point

-- To apply this migration:
-- mysql -u root -p < database/schema/seo_tool_suite_schema_v3.sql

-- Or use the main schema file directly which includes:
-- - Database creation (seo_tool_suite)
-- - 16 tables across 5 sections
-- - 5 database views
-- - 7 triggers for automation
-- - All indexes and foreign keys

-- Note: The schema is designed for MySQL 8.0+ with:
-- - UTF8MB4 character set
-- - InnoDB engine
-- - JSON column support
-- - FULLTEXT indexes

SOURCE database/schema/seo_tool_suite_schema_v3.sql;
