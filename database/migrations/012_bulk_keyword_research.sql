-- =====================================================================
-- BULK KEYWORD RESEARCH MIGRATION
-- Version: 1.0
-- Date: December 2024
--
-- Bu migration bulk keyword araştırması için gereken tablo değişikliklerini
-- ve yeni kolonları ekler.
-- =====================================================================

USE seo_tool_suite;

-- =====================================================================
-- BÖLÜM 1: keyword_projects TABLOSU GÜNCELLEMELERİ
-- =====================================================================

-- 1.1 project_type kolonu ekle (single veya bulk)
ALTER TABLE keyword_projects
ADD COLUMN project_type ENUM('single', 'bulk') NOT NULL DEFAULT 'single'
    COMMENT 'Proje tipi: single=tekil keyword, bulk=toplu keyword'
    AFTER main_keyword;

-- 1.2 seed_keywords JSON kolonu ekle (bulk modda tüm seed keyword'ler)
ALTER TABLE keyword_projects
ADD COLUMN seed_keywords JSON NULL
    COMMENT 'Bulk modda seed keyword listesi: ["kw1", "kw2", ...]'
    AFTER project_type;

-- 1.3 bulk_stats JSON kolonu ekle (bulk işlem istatistikleri)
ALTER TABLE keyword_projects
ADD COLUMN bulk_stats JSON NULL
    COMMENT 'Bulk işlem istatistikleri: {processing_time_ms, api_calls, etc}'
    AFTER seed_keywords;

-- 1.4 İndeks ekle
ALTER TABLE keyword_projects
ADD INDEX idx_kwproject_type (project_type);

-- =====================================================================
-- BÖLÜM 2: keyword_results TABLOSU GÜNCELLEMELERİ
-- =====================================================================

-- 2.1 seed_keyword kolonu ekle (hangi seed'den geldiği)
ALTER TABLE keyword_results
ADD COLUMN seed_keyword VARCHAR(255) NULL
    COMMENT 'Bulk modda bu keyword hangi seed keyword''den türetildi'
    AFTER keyword;

-- 2.2 status kolonu ekle (approved/rejected/pending)
ALTER TABLE keyword_results
ADD COLUMN status ENUM('approved', 'rejected', 'pending') NOT NULL DEFAULT 'pending'
    COMMENT 'AI filtreleme durumu'
    AFTER source;

-- 2.3 reject_reason kolonu ekle
ALTER TABLE keyword_results
ADD COLUMN reject_reason VARCHAR(500) NULL
    COMMENT 'Reddedilme sebebi'
    AFTER status;

-- 2.4 content_priority kolonu ekle
ALTER TABLE keyword_results
ADD COLUMN content_priority ENUM('high', 'medium', 'low') NULL
    COMMENT 'İçerik önceliği'
    AFTER reject_reason;

-- 2.5 page_type kolonu ekle
ALTER TABLE keyword_results
ADD COLUMN page_type ENUM('pillar', 'cluster', 'blog', 'product', 'category', 'landing', 'faq') NULL
    COMMENT 'Önerilen sayfa tipi'
    AFTER content_priority;

-- 2.6 İndeksler ekle
ALTER TABLE keyword_results
ADD INDEX idx_kwresult_seed (project_id, seed_keyword),
ADD INDEX idx_kwresult_status (project_id, status),
ADD INDEX idx_kwresult_priority (project_id, content_priority);

-- =====================================================================
-- BÖLÜM 3: UNIQUE CONSTRAINT GÜNCELLEMESİ
-- =====================================================================

-- Aynı projede aynı keyword tekrar eklenmemeli
-- Önce mevcut duplicate'ları temizle (varsa)
-- DELETE k1 FROM keyword_results k1
-- INNER JOIN keyword_results k2
-- WHERE k1.id > k2.id
--   AND k1.project_id = k2.project_id
--   AND k1.keyword = k2.keyword;

-- Unique constraint ekle
ALTER TABLE keyword_results
ADD UNIQUE INDEX uk_kwresult_project_keyword (project_id, keyword(191));

-- =====================================================================
-- BÖLÜM 4: BULK İŞLEM PROGRESS TABLOSU (Opsiyonel)
-- =====================================================================

-- Bulk işlemlerin progress takibi için
CREATE TABLE IF NOT EXISTS bulk_processing_jobs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,

    -- İş Durumu
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    current_phase ENUM('init', 'dataforseo', 'google_suggest', 'merge', 'gemini', 'db_save', 'completed') NULL,

    -- Progress
    total_seeds INT UNSIGNED NULL,
    processed_seeds INT UNSIGNED NULL DEFAULT 0,
    total_keywords_found INT UNSIGNED NULL DEFAULT 0,

    -- Gemini Progress
    gemini_total_chunks INT UNSIGNED NULL,
    gemini_processed_chunks INT UNSIGNED NULL DEFAULT 0,

    -- Zamanlama
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Hata
    error_message TEXT NULL,

    -- Foreign Key
    CONSTRAINT fk_bulkjob_project FOREIGN KEY (project_id) REFERENCES keyword_projects(id) ON DELETE CASCADE,

    -- İndeks
    UNIQUE KEY uk_bulkjob_project (project_id),
    INDEX idx_bulkjob_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- BÖLÜM 5: VIEW GÜNCELLEME
-- =====================================================================

-- Keyword sonuçları özeti (bulk aware)
CREATE OR REPLACE VIEW v_keyword_results_summary AS
SELECT
    kp.id AS project_id,
    kp.uuid AS project_uuid,
    kp.project_name,
    kp.main_keyword,
    kp.project_type,
    c.name AS client_name,
    COUNT(kr.id) AS total_keywords,
    SUM(CASE WHEN kr.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
    SUM(CASE WHEN kr.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
    SUM(CASE WHEN kr.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
    COUNT(DISTINCT kr.seed_keyword) AS unique_seeds,
    AVG(kr.search_volume) AS avg_search_volume,
    MAX(kr.search_volume) AS max_search_volume
FROM keyword_projects kp
JOIN clients c ON kp.client_id = c.id
LEFT JOIN keyword_results kr ON kp.id = kr.project_id
GROUP BY kp.id, kp.uuid, kp.project_name, kp.main_keyword, kp.project_type, c.name;

-- Seed bazlı özet (bulk projeler için)
CREATE OR REPLACE VIEW v_seed_keyword_summary AS
SELECT
    kr.project_id,
    kr.seed_keyword,
    COUNT(*) AS total_keywords,
    SUM(CASE WHEN kr.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
    SUM(CASE WHEN kr.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
    SUM(CASE WHEN kr.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
    AVG(kr.search_volume) AS avg_volume,
    SUM(kr.search_volume) AS total_volume
FROM keyword_results kr
WHERE kr.seed_keyword IS NOT NULL
GROUP BY kr.project_id, kr.seed_keyword
ORDER BY total_volume DESC;

-- =====================================================================
-- MIGRATION TAMAMLANDI
-- =====================================================================

SELECT 'Bulk Keyword Research Migration - Successfully Applied!' AS Status;
SELECT
    'keyword_projects' AS TableName,
    'Added: project_type, seed_keywords, bulk_stats columns' AS Changes
UNION ALL
SELECT
    'keyword_results',
    'Added: seed_keyword, status, reject_reason, content_priority, page_type columns'
UNION ALL
SELECT
    'bulk_processing_jobs',
    'Created new table for tracking bulk processing progress';
