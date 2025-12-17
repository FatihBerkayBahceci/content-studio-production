-- =====================================================================
-- Migration: 003_enable_dataforseo
-- Description: Add enable_dataforseo flag to client_configurations
-- Date: 2025-01-15
-- =====================================================================

-- Add enable_dataforseo column
ALTER TABLE client_configurations
ADD COLUMN enable_dataforseo TINYINT(1) NOT NULL DEFAULT 0
COMMENT 'DataForSEO API aktif mi (opsiyonel ek veri kaynağı)'
AFTER enable_ai_analysis;

-- Update demo client to enable dataforseo
UPDATE client_configurations
SET enable_dataforseo = 1
WHERE client_id = (SELECT id FROM clients WHERE slug = 'demo-musteri' LIMIT 1);

SELECT 'Migration 003: enable_dataforseo added successfully!' AS Status;
