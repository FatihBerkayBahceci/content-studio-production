-- =====================================================================
-- SEO TOOL SUITe - MODÜLER VERİTABANI ŞEMASI
-- Version: 2.0
-- Database: MySQL 8.0+
-- Created: December 2025
-- 
-- 3 Bağımsız Tool + Ortak Core
-- Multi-Tenant Mimari
-- =====================================================================

CREATE DATABASE IF NOT EXISTS seo_tool_suite
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE seo_tool_suite;


-- =====================================================================
-- BÖLÜM 1: ORTAK TABLOLAR (Multi-Tenant Core)
-- Tüm tool'lar tarafından paylaşılır
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1.1 clients - Müşteri/Marka Ana Tablosu
-- ---------------------------------------------------------------------
CREATE TABLE clients (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL,
    
    -- Temel Bilgiler
    name VARCHAR(100) NOT NULL COMMENT 'Müşteri/Marka adı',
    slug VARCHAR(100) NOT NULL COMMENT 'URL-friendly isim',
    domain VARCHAR(255) NULL COMMENT 'Ana website domain',
    industry VARCHAR(100) NULL COMMENT 'Sektör',
    
    -- Varsayılan Ayarlar
    default_language CHAR(2) NOT NULL DEFAULT 'tr',
    default_country CHAR(2) NOT NULL DEFAULT 'TR',
    
    -- Durum
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    
    -- Zaman Damgaları
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- İndeksler
    UNIQUE KEY uk_clients_uuid (uuid),
    UNIQUE KEY uk_clients_slug (slug),
    INDEX idx_clients_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 1.2 client_configurations - Müşteri Ayarları
-- ---------------------------------------------------------------------
CREATE TABLE client_configurations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id INT UNSIGNED NOT NULL,
    
    -- Yazım Ayarları
    tone_of_voice ENUM('formal', 'casual', 'professional', 'friendly', 'technical') NOT NULL DEFAULT 'professional',
    writing_style TEXT NULL,
    target_audience TEXT NULL,
    
    -- Marka Kelimeleri
    brand_keywords JSON NULL COMMENT '["marka", "ürün", "slogan"]',
    forbidden_words JSON NULL COMMENT '["yasak1", "yasak2"]',
    
    -- Rakip Bilgileri
    competitor_domains JSON NULL COMMENT '["rakip1.com", "rakip2.com"]',
    
    -- SEO Ayarları
    keyword_density_min DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    keyword_density_max DECIMAL(3,2) NOT NULL DEFAULT 2.50,
    internal_links_per_1000_words INT UNSIGNED NOT NULL DEFAULT 3,
    
    -- AI Ayarları
    ai_model_preference ENUM('gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gemini-pro', 'claude-3') NOT NULL DEFAULT 'gpt-4',
    ai_temperature DECIMAL(2,1) NOT NULL DEFAULT 0.7,
    
    -- Zaman Damgaları
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_config_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY uk_config_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 1.3 client_url_inventory - URL Havuzu (Internal Linking için)
-- ---------------------------------------------------------------------
CREATE TABLE client_url_inventory (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id INT UNSIGNED NOT NULL,
    
    -- URL Bilgileri
    url VARCHAR(500) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    
    -- SEO Verileri
    primary_keyword VARCHAR(150) NULL,
    secondary_keywords JSON NULL,
    
    -- Sınıflandırma
    category VARCHAR(100) NULL,
    page_type ENUM('pillar', 'cluster', 'product', 'category', 'blog', 'landing', 'other') NOT NULL DEFAULT 'other',
    topic_cluster VARCHAR(100) NULL,
    
    -- Metrikler
    authority_score INT UNSIGNED NULL COMMENT '0-100',
    
    -- Durum
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    
    -- Zaman Damgaları
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_url_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    
    -- İndeksler
    UNIQUE KEY uk_url_client_url (client_id, url(191)),
    INDEX idx_url_client_type (client_id, page_type),
    INDEX idx_url_client_keyword (client_id, primary_keyword),
    INDEX idx_url_active (client_id, is_active),
    FULLTEXT INDEX ft_url_search (title, meta_description, primary_keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- BÖLÜM 2: TOOL 1 - KEYWORD ANALİZİ TABLOLARI
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1 keyword_projects - Keyword Analiz Projeleri
-- ---------------------------------------------------------------------
CREATE TABLE keyword_projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL,
    client_id INT UNSIGNED NOT NULL,
    
    -- Proje Bilgileri
    project_name VARCHAR(255) NOT NULL COMMENT 'Proje adı',
    main_keyword VARCHAR(200) NOT NULL COMMENT 'Ana anahtar kelime',
    
    -- Hedef Ayarları
    target_language CHAR(2) NOT NULL DEFAULT 'tr',
    target_country CHAR(2) NOT NULL DEFAULT 'TR',
    search_engine ENUM('google', 'bing', 'yandex') NOT NULL DEFAULT 'google',
    
    -- Analiz Ayarları
    include_serp_analysis TINYINT(1) NOT NULL DEFAULT 1,
    include_competitor_analysis TINYINT(1) NOT NULL DEFAULT 1,
    include_paa TINYINT(1) NOT NULL DEFAULT 1,
    competitor_count INT UNSIGNED NOT NULL DEFAULT 10 COMMENT 'Kaç rakip analiz edilsin',
    
    -- Durum
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    
    -- İstatistikler
    total_keywords_found INT UNSIGNED NULL,
    total_competitors_analyzed INT UNSIGNED NULL,
    total_paa_found INT UNSIGNED NULL,
    
    -- API Kullanımı
    api_source ENUM('ahrefs', 'semrush', 'manual') NULL,
    api_credits_used INT UNSIGNED NULL,
    
    -- Zaman Damgaları
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_kwproject_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    
    -- İndeksler
    UNIQUE KEY uk_kwproject_uuid (uuid),
    INDEX idx_kwproject_client (client_id),
    INDEX idx_kwproject_status (status),
    INDEX idx_kwproject_keyword (main_keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 2.2 keyword_results - Bulunan Anahtar Kelimeler
-- ---------------------------------------------------------------------
CREATE TABLE keyword_results (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    
    -- Keyword Bilgileri
    keyword VARCHAR(200) NOT NULL,
    keyword_type ENUM('primary', 'secondary', 'long_tail', 'semantic', 'lsi', 'related', 'question') NOT NULL,
    
    -- Metrikler
    search_volume INT UNSIGNED NULL COMMENT 'Aylık arama hacmi',
    keyword_difficulty INT UNSIGNED NULL COMMENT '0-100',
    cpc DECIMAL(10,2) NULL COMMENT 'Tıklama başı maliyet ($)',
    competition DECIMAL(3,2) NULL COMMENT '0-1 arası',
    
    -- Arama Niyeti
    search_intent ENUM('informational', 'commercial', 'transactional', 'navigational') NULL,
    
    -- Trend
    trend_data JSON NULL COMMENT 'Son 12 ay trend',
    trend_direction ENUM('up', 'down', 'stable') NULL,
    
    -- Gruplama
    parent_topic VARCHAR(200) NULL,
    keyword_cluster VARCHAR(100) NULL,
    
    -- Kaynak
    source ENUM('ahrefs', 'semrush', 'google_suggest', 'paa', 'manual', 'ai') NOT NULL,
    
    -- Zaman Damgası
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_kwresult_project FOREIGN KEY (project_id) REFERENCES keyword_projects(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_kwresult_project (project_id),
    INDEX idx_kwresult_type (project_id, keyword_type),
    INDEX idx_kwresult_volume (search_volume DESC),
    INDEX idx_kwresult_difficulty (keyword_difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 2.3 competitor_data - Rakip Analiz Verileri
-- ---------------------------------------------------------------------
CREATE TABLE competitor_data (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    
    -- Rakip Bilgileri
    competitor_url VARCHAR(500) NOT NULL,
    competitor_domain VARCHAR(255) NOT NULL,
    serp_position INT UNSIGNED NOT NULL COMMENT '1-10',
    
    -- İçerik Analizi
    title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    word_count INT UNSIGNED NULL,
    
    -- Yapı Analizi
    h1_text VARCHAR(255) NULL,
    h2_count INT UNSIGNED NULL,
    h3_count INT UNSIGNED NULL,
    headings_json JSON NULL COMMENT '{h1: [], h2: [], h3: []}',
    
    -- Link Analizi
    internal_links_count INT UNSIGNED NULL,
    external_links_count INT UNSIGNED NULL,
    
    -- Otorite Metrikleri
    domain_rating INT UNSIGNED NULL COMMENT '0-100 DR',
    page_authority INT UNSIGNED NULL,
    backlinks_count INT UNSIGNED NULL,
    referring_domains INT UNSIGNED NULL,
    
    -- Zaman Damgası
    analyzed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_competitor_project FOREIGN KEY (project_id) REFERENCES keyword_projects(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_competitor_project (project_id),
    INDEX idx_competitor_position (project_id, serp_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 2.4 serp_features - SERP Özellikleri
-- ---------------------------------------------------------------------
CREATE TABLE serp_features (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    
    -- Featured Snippet
    has_featured_snippet TINYINT(1) NOT NULL DEFAULT 0,
    featured_snippet_type ENUM('paragraph', 'list', 'table', 'video', 'none') NULL,
    featured_snippet_content TEXT NULL,
    featured_snippet_url VARCHAR(500) NULL,
    
    -- People Also Ask
    has_paa TINYINT(1) NOT NULL DEFAULT 0,
    paa_count INT UNSIGNED NULL,
    
    -- Diğer SERP Özellikleri
    has_video_results TINYINT(1) NOT NULL DEFAULT 0,
    has_image_pack TINYINT(1) NOT NULL DEFAULT 0,
    has_local_pack TINYINT(1) NOT NULL DEFAULT 0,
    has_knowledge_panel TINYINT(1) NOT NULL DEFAULT 0,
    has_shopping_results TINYINT(1) NOT NULL DEFAULT 0,
    has_news_results TINYINT(1) NOT NULL DEFAULT 0,
    
    -- SERP Kompozisyonu
    organic_results_count INT UNSIGNED NULL,
    ads_count INT UNSIGNED NULL,
    
    -- Zero-Click Riski
    zero_click_risk ENUM('low', 'medium', 'high') NULL,
    
    -- Ham Veri
    raw_serp_json JSON NULL,
    
    -- Zaman Damgası
    analyzed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_serp_project FOREIGN KEY (project_id) REFERENCES keyword_projects(id) ON DELETE CASCADE,
    UNIQUE KEY uk_serp_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 2.5 paa_data - People Also Ask Verileri
-- ---------------------------------------------------------------------
CREATE TABLE paa_data (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    
    -- Soru Bilgileri
    question VARCHAR(500) NOT NULL,
    answer_snippet TEXT NULL,
    source_url VARCHAR(500) NULL,
    source_domain VARCHAR(255) NULL,
    
    -- Pozisyon
    position INT UNSIGNED NULL,
    
    -- Kullanım Durumu
    is_recommended_as_h2 TINYINT(1) NOT NULL DEFAULT 0,
    is_recommended_as_h3 TINYINT(1) NOT NULL DEFAULT 0,
    
    -- Alaka Skoru
    relevance_score DECIMAL(5,2) NULL COMMENT 'AI tarafından 0-100',
    
    -- Zaman Damgası
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_paa_project FOREIGN KEY (project_id) REFERENCES keyword_projects(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_paa_project (project_id),
    INDEX idx_paa_recommended (project_id, is_recommended_as_h2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- BÖLÜM 3: TOOL 2 - INTERNAL LINKING TABLOLARI
-- =====================================================================

-- ---------------------------------------------------------------------
-- 3.1 linking_projects - Internal Linking Projeleri
-- ---------------------------------------------------------------------
CREATE TABLE linking_projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL,
    client_id INT UNSIGNED NOT NULL,
    
    -- Proje Bilgileri
    project_name VARCHAR(255) NOT NULL,
    
    -- Kaynak Seçimi
    input_source ENUM('manual', 'keyword_project') NOT NULL DEFAULT 'manual',
    source_keyword_project_id INT UNSIGNED NULL COMMENT 'Tool 1\'den veri çekildiyse',
    
    -- Manuel Input
    content_text LONGTEXT NULL COMMENT 'Manuel girilen içerik',
    content_title VARCHAR(255) NULL,
    content_main_keyword VARCHAR(200) NULL,
    
    -- URL Listesi Kaynağı
    url_source ENUM('client_inventory', 'manual_list') NOT NULL DEFAULT 'client_inventory',
    manual_url_list JSON NULL COMMENT 'Manuel girilen URL listesi',
    
    -- Linking Ayarları
    max_links_to_add INT UNSIGNED NOT NULL DEFAULT 5,
    min_relevance_score DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    avoid_existing_links TINYINT(1) NOT NULL DEFAULT 1,
    
    -- Durum
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    
    -- İstatistikler
    total_suggestions INT UNSIGNED NULL,
    total_applied INT UNSIGNED NULL,
    
    -- Çıktı
    output_content LONGTEXT NULL COMMENT 'Linklenmiş içerik',
    
    -- Zaman Damgaları
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_linkproject_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_linkproject_kwproject FOREIGN KEY (source_keyword_project_id) REFERENCES keyword_projects(id) ON DELETE SET NULL,
    
    -- İndeksler
    UNIQUE KEY uk_linkproject_uuid (uuid),
    INDEX idx_linkproject_client (client_id),
    INDEX idx_linkproject_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 3.2 linking_suggestions - Link Önerileri
-- ---------------------------------------------------------------------
CREATE TABLE linking_suggestions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    
    -- Hedef URL
    target_url_id INT UNSIGNED NULL COMMENT 'client_url_inventory\'den',
    target_url VARCHAR(500) NOT NULL,
    target_title VARCHAR(255) NULL,
    target_keyword VARCHAR(200) NULL,
    
    -- Anchor Text Önerileri
    suggested_anchor_text VARCHAR(255) NOT NULL,
    anchor_type ENUM('exact_match', 'partial_match', 'branded', 'natural', 'contextual') NOT NULL DEFAULT 'natural',
    
    -- Konum
    context_sentence TEXT NULL COMMENT 'Linkin ekleneceği cümle',
    position_in_content ENUM('intro', 'body', 'conclusion') NULL,
    paragraph_index INT UNSIGNED NULL,
    
    -- Skorlar
    relevance_score DECIMAL(5,2) NOT NULL COMMENT '0-100 alaka puanı',
    semantic_similarity DECIMAL(5,4) NULL COMMENT '0-1 arası',
    
    -- Durum
    is_approved TINYINT(1) NULL COMMENT 'NULL=bekliyor, 1=onaylandı, 0=reddedildi',
    is_applied TINYINT(1) NOT NULL DEFAULT 0,
    rejection_reason VARCHAR(255) NULL,
    
    -- Zaman Damgası
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_suggestion_project FOREIGN KEY (project_id) REFERENCES linking_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_suggestion_url FOREIGN KEY (target_url_id) REFERENCES client_url_inventory(id) ON DELETE SET NULL,
    
    -- İndeksler
    INDEX idx_suggestion_project (project_id),
    INDEX idx_suggestion_score (relevance_score DESC),
    INDEX idx_suggestion_status (project_id, is_approved, is_applied)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 3.3 linking_applied - Uygulanan Linkler (Log)
-- ---------------------------------------------------------------------
CREATE TABLE linking_applied (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    suggestion_id INT UNSIGNED NULL,
    
    -- Link Detayları
    target_url VARCHAR(500) NOT NULL,
    anchor_text VARCHAR(255) NOT NULL,
    
    -- Ekleme Bilgisi
    original_text TEXT NULL COMMENT 'Orijinal metin parçası',
    linked_text TEXT NULL COMMENT 'Link eklenmiş metin',
    
    -- Zaman Damgası
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_applied_project FOREIGN KEY (project_id) REFERENCES linking_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_applied_suggestion FOREIGN KEY (suggestion_id) REFERENCES linking_suggestions(id) ON DELETE SET NULL,
    
    -- İndeksler
    INDEX idx_applied_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- BÖLÜM 4: TOOL 3 - HTML DÖNÜŞTÜRÜCÜ TABLOLARI
-- =====================================================================

-- ---------------------------------------------------------------------
-- 4.1 html_projects - HTML Dönüştürme Projeleri
-- ---------------------------------------------------------------------
CREATE TABLE html_projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL,
    client_id INT UNSIGNED NOT NULL,
    
    -- Proje Bilgileri
    project_name VARCHAR(255) NOT NULL,
    
    -- Kaynak Seçimi
    input_source ENUM('manual', 'google_doc', 'linking_project') NOT NULL DEFAULT 'manual',
    source_linking_project_id INT UNSIGNED NULL COMMENT 'Tool 2\'den veri çekildiyse',
    google_doc_url VARCHAR(500) NULL,
    
    -- Manuel Input
    input_html LONGTEXT NULL COMMENT 'Manuel girilen HTML/içerik',
    
    -- Dönüştürme Ayarları
    remove_inline_styles TINYINT(1) NOT NULL DEFAULT 1,
    remove_classes TINYINT(1) NOT NULL DEFAULT 1,
    remove_ids TINYINT(1) NOT NULL DEFAULT 0,
    remove_empty_tags TINYINT(1) NOT NULL DEFAULT 1,
    convert_to_semantic TINYINT(1) NOT NULL DEFAULT 1,
    preserve_links TINYINT(1) NOT NULL DEFAULT 1,
    preserve_images TINYINT(1) NOT NULL DEFAULT 1,
    
    -- Çıktı Formatı
    output_format ENUM('html', 'clean_html', 'markdown') NOT NULL DEFAULT 'clean_html',
    wrap_in_article TINYINT(1) NOT NULL DEFAULT 1,
    
    -- Durum
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    
    -- İstatistikler
    input_size_bytes INT UNSIGNED NULL,
    output_size_bytes INT UNSIGNED NULL,
    size_reduction_percent DECIMAL(5,2) NULL,
    tags_removed_count INT UNSIGNED NULL,
    
    -- Zaman Damgaları
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_htmlproject_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_htmlproject_linkproject FOREIGN KEY (source_linking_project_id) REFERENCES linking_projects(id) ON DELETE SET NULL,
    
    -- İndeksler
    UNIQUE KEY uk_htmlproject_uuid (uuid),
    INDEX idx_htmlproject_client (client_id),
    INDEX idx_htmlproject_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 4.2 html_outputs - HTML Çıktıları
-- ---------------------------------------------------------------------
CREATE TABLE html_outputs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    
    -- Versiyon
    version INT UNSIGNED NOT NULL DEFAULT 1,
    is_current TINYINT(1) NOT NULL DEFAULT 1,
    
    -- Çıktı
    output_html LONGTEXT NOT NULL,
    output_plain_text LONGTEXT NULL,
    
    -- Meta Bilgiler (Çıkarılan)
    extracted_title VARCHAR(255) NULL,
    extracted_h1 VARCHAR(255) NULL,
    extracted_meta_description TEXT NULL,
    
    -- İstatistikler
    word_count INT UNSIGNED NULL,
    character_count INT UNSIGNED NULL,
    paragraph_count INT UNSIGNED NULL,
    heading_count JSON NULL COMMENT '{h1: 1, h2: 5, h3: 8}',
    link_count INT UNSIGNED NULL,
    image_count INT UNSIGNED NULL,
    
    -- Validasyon
    is_valid_html TINYINT(1) NULL,
    validation_errors JSON NULL,
    
    -- Zaman Damgası
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_output_project FOREIGN KEY (project_id) REFERENCES html_projects(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_output_project (project_id),
    INDEX idx_output_current (project_id, is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- BÖLÜM 5: ORTAK LOG VE İSTATİSTİK TABLOLARI
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5.1 activity_logs - Aktivite Logları
-- ---------------------------------------------------------------------
CREATE TABLE activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id INT UNSIGNED NULL,
    
    -- Tool Bilgisi
    tool_name ENUM('keyword_analysis', 'internal_linking', 'html_converter') NOT NULL,
    project_id INT UNSIGNED NULL COMMENT 'İlgili proje ID',
    project_uuid CHAR(36) NULL,
    
    -- Log Bilgisi
    action VARCHAR(100) NOT NULL COMMENT 'create, update, process, complete, fail, export',
    log_level ENUM('debug', 'info', 'warning', 'error') NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    
    -- Detaylar
    details_json JSON NULL,
    
    -- Performans
    execution_time_ms INT UNSIGNED NULL,
    
    -- Kullanıcı
    user_identifier VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    
    -- Zaman Damgası
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- İndeksler
    INDEX idx_log_client (client_id),
    INDEX idx_log_tool (tool_name),
    INDEX idx_log_level (log_level),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 5.2 api_usage - API Kullanım Takibi
-- ---------------------------------------------------------------------
CREATE TABLE api_usage (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id INT UNSIGNED NOT NULL,
    
    -- Tool ve Proje
    tool_name ENUM('keyword_analysis', 'internal_linking', 'html_converter') NOT NULL,
    project_id INT UNSIGNED NULL,
    
    -- API Bilgisi
    api_provider ENUM('ahrefs', 'semrush', 'openai', 'google', 'anthropic', 'other') NOT NULL,
    api_endpoint VARCHAR(255) NULL,
    
    -- Kullanım
    requests_count INT UNSIGNED NOT NULL DEFAULT 1,
    tokens_input INT UNSIGNED NULL,
    tokens_output INT UNSIGNED NULL,
    
    -- Maliyet
    cost_usd DECIMAL(10,4) NULL,
    
    -- Durum
    was_successful TINYINT(1) NOT NULL DEFAULT 1,
    error_message TEXT NULL,
    
    -- Performans
    response_time_ms INT UNSIGNED NULL,
    
    -- Zaman Damgası
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_apiusage_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_api_client_date (client_id, created_at),
    INDEX idx_api_provider (api_provider),
    INDEX idx_api_tool (tool_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- BÖLÜM 6: VIEW'LAR
-- =====================================================================

-- ---------------------------------------------------------------------
-- 6.1 Keyword Project Özeti
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_keyword_projects_summary AS
SELECT 
    kp.id,
    kp.uuid,
    kp.project_name,
    kp.main_keyword,
    c.name AS client_name,
    kp.status,
    kp.total_keywords_found,
    kp.total_competitors_analyzed,
    kp.total_paa_found,
    kp.api_source,
    kp.created_at,
    kp.completed_at,
    TIMESTAMPDIFF(MINUTE, kp.started_at, kp.completed_at) AS processing_minutes
FROM keyword_projects kp
JOIN clients c ON kp.client_id = c.id
ORDER BY kp.created_at DESC;


-- ---------------------------------------------------------------------
-- 6.2 Linking Project Özeti
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_linking_projects_summary AS
SELECT 
    lp.id,
    lp.uuid,
    lp.project_name,
    c.name AS client_name,
    lp.input_source,
    lp.status,
    lp.total_suggestions,
    lp.total_applied,
    CASE WHEN lp.total_suggestions > 0 
         THEN ROUND((lp.total_applied / lp.total_suggestions) * 100, 1) 
         ELSE 0 
    END AS apply_rate_percent,
    lp.created_at,
    lp.completed_at
FROM linking_projects lp
JOIN clients c ON lp.client_id = c.id
ORDER BY lp.created_at DESC;


-- ---------------------------------------------------------------------
-- 6.3 HTML Project Özeti
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_html_projects_summary AS
SELECT 
    hp.id,
    hp.uuid,
    hp.project_name,
    c.name AS client_name,
    hp.input_source,
    hp.output_format,
    hp.status,
    hp.size_reduction_percent,
    hp.tags_removed_count,
    hp.created_at,
    hp.completed_at
FROM html_projects hp
JOIN clients c ON hp.client_id = c.id
ORDER BY hp.created_at DESC;


-- ---------------------------------------------------------------------
-- 6.4 Client Dashboard
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_client_dashboard AS
SELECT 
    c.id AS client_id,
    c.name AS client_name,
    c.domain,
    -- Keyword Projects
    (SELECT COUNT(*) FROM keyword_projects WHERE client_id = c.id) AS total_keyword_projects,
    (SELECT COUNT(*) FROM keyword_projects WHERE client_id = c.id AND status = 'completed') AS completed_keyword_projects,
    -- Linking Projects
    (SELECT COUNT(*) FROM linking_projects WHERE client_id = c.id) AS total_linking_projects,
    (SELECT COUNT(*) FROM linking_projects WHERE client_id = c.id AND status = 'completed') AS completed_linking_projects,
    -- HTML Projects
    (SELECT COUNT(*) FROM html_projects WHERE client_id = c.id) AS total_html_projects,
    (SELECT COUNT(*) FROM html_projects WHERE client_id = c.id AND status = 'completed') AS completed_html_projects,
    -- URL Inventory
    (SELECT COUNT(*) FROM client_url_inventory WHERE client_id = c.id AND is_active = 1) AS url_inventory_count
FROM clients c
WHERE c.is_active = 1 AND c.deleted_at IS NULL;


-- =====================================================================
-- BÖLÜM 7: TRIGGERS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 7.1 Auto UUID for clients
-- ---------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER tr_clients_before_insert
BEFORE INSERT ON clients
FOR EACH ROW
BEGIN
    IF NEW.uuid IS NULL OR NEW.uuid = '' THEN
        SET NEW.uuid = UUID();
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 7.2 Auto UUID for keyword_projects
-- ---------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER tr_keyword_projects_before_insert
BEFORE INSERT ON keyword_projects
FOR EACH ROW
BEGIN
    IF NEW.uuid IS NULL OR NEW.uuid = '' THEN
        SET NEW.uuid = UUID();
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 7.3 Auto UUID for linking_projects
-- ---------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER tr_linking_projects_before_insert
BEFORE INSERT ON linking_projects
FOR EACH ROW
BEGIN
    IF NEW.uuid IS NULL OR NEW.uuid = '' THEN
        SET NEW.uuid = UUID();
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 7.4 Auto UUID for html_projects
-- ---------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER tr_html_projects_before_insert
BEFORE INSERT ON html_projects
FOR EACH ROW
BEGIN
    IF NEW.uuid IS NULL OR NEW.uuid = '' THEN
        SET NEW.uuid = UUID();
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 7.5 Activity Log on Keyword Project Status Change
-- ---------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER tr_keyword_project_status_change
AFTER UPDATE ON keyword_projects
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO activity_logs (client_id, tool_name, project_id, project_uuid, action, log_level, message)
        VALUES (NEW.client_id, 'keyword_analysis', NEW.id, NEW.uuid, 
                CONCAT('status_', NEW.status), 
                IF(NEW.status = 'failed', 'error', 'info'),
                CONCAT('Keyword project status changed: ', OLD.status, ' → ', NEW.status));
    END IF;
END //
DELIMITER ;


-- =====================================================================
-- BÖLÜM 8: TEST VERİSİ
-- =====================================================================

-- Test müşteri ekle
INSERT INTO clients (uuid, name, slug, domain, industry, default_language, default_country, is_active)
VALUES (UUID(), 'Demo Müşteri', 'demo-musteri', 'demo.com', 'ecommerce', 'tr', 'TR', 1);

-- Müşteri ayarları
INSERT INTO client_configurations (client_id, tone_of_voice, writing_style, keyword_density_min, keyword_density_max, internal_links_per_1000_words, ai_model_preference)
SELECT id, 'professional', 'Profesyonel ve bilgilendirici bir ton kullan.', 0.50, 2.50, 3, 'gpt-4'
FROM clients WHERE slug = 'demo-musteri';

-- Örnek URL inventory
INSERT INTO client_url_inventory (client_id, url, slug, title, primary_keyword, page_type, is_active)
SELECT id, 'https://demo.com/seo-nedir', 'seo-nedir', 'SEO Nedir? Başlangıç Rehberi', 'seo nedir', 'pillar', 1
FROM clients WHERE slug = 'demo-musteri';

INSERT INTO client_url_inventory (client_id, url, slug, title, primary_keyword, page_type, is_active)
SELECT id, 'https://demo.com/on-page-seo', 'on-page-seo', 'On-Page SEO Teknikleri', 'on-page seo', 'cluster', 1
FROM clients WHERE slug = 'demo-musteri';

INSERT INTO client_url_inventory (client_id, url, slug, title, primary_keyword, page_type, is_active)
SELECT id, 'https://demo.com/backlink-nedir', 'backlink-nedir', 'Backlink Nedir ve Nasıl Alınır?', 'backlink', 'cluster', 1
FROM clients WHERE slug = 'demo-musteri';


-- =====================================================================
-- ŞEMA TAMAMLANDI
-- =====================================================================

SELECT 'SEO Tool Suite Schema v2.0 - Başarıyla oluşturuldu!' AS Status;
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'seo_tool_suite' AND table_type = 'BASE TABLE') AS TableCount,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'seo_tool_suite') AS ViewCount,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'seo_tool_suite') AS TriggerCount;
