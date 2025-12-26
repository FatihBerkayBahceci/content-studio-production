-- Migration: 015_test_scenarios.sql
-- Description: Test scenarios and results tables for QA tracking
-- Date: 2025-12-26

-- Test Scenarios Table
CREATE TABLE IF NOT EXISTS test_scenarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE DEFAULT (UUID()),
  category ENUM('ui_ux', 'backend') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  steps JSON,                    -- Test steps as JSON array
  expected_result TEXT,          -- Expected outcome
  priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
  status ENUM('pending', 'passed', 'failed', 'partial', 'skipped') DEFAULT 'pending',
  created_by INT,                -- Admin user_id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_priority (priority)
);

-- Test Results Table (feedback from testers)
CREATE TABLE IF NOT EXISTS test_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scenario_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending', 'passed', 'failed', 'partial', 'skipped') NOT NULL,
  notes TEXT,                    -- Tester notes/feedback
  screenshot_url VARCHAR(500),   -- Optional screenshot URL
  browser VARCHAR(100),          -- Chrome, Firefox, Safari, Edge, etc.
  device VARCHAR(100),           -- Desktop, Mobile, Tablet
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scenario_id) REFERENCES test_scenarios(id) ON DELETE CASCADE,
  INDEX idx_scenario (scenario_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at DESC)
);

-- Create view for scenario summary with latest result
CREATE OR REPLACE VIEW test_scenarios_summary AS
SELECT
  ts.id,
  ts.uuid,
  ts.category,
  ts.title,
  ts.description,
  ts.priority,
  ts.status,
  ts.created_at,
  ts.updated_at,
  (SELECT COUNT(*) FROM test_results WHERE scenario_id = ts.id) as result_count,
  (SELECT tr.status FROM test_results tr WHERE tr.scenario_id = ts.id ORDER BY tr.created_at DESC LIMIT 1) as latest_result_status,
  (SELECT tr.notes FROM test_results tr WHERE tr.scenario_id = ts.id ORDER BY tr.created_at DESC LIMIT 1) as latest_result_notes,
  (SELECT tr.created_at FROM test_results tr WHERE tr.scenario_id = ts.id ORDER BY tr.created_at DESC LIMIT 1) as latest_result_date,
  (SELECT u.name FROM test_results tr JOIN users u ON tr.user_id = u.id WHERE tr.scenario_id = ts.id ORDER BY tr.created_at DESC LIMIT 1) as latest_tester_name
FROM test_scenarios ts;

-- Insert sample test scenarios
INSERT INTO test_scenarios (category, title, description, steps, expected_result, priority, status) VALUES
-- UI/UX Tests
('ui_ux', 'Login Sayfasi Testi', 'Kullanici giris isleminin dogru calistigini test eder',
 '["1. /login sayfasina git", "2. Gecerli email ve sifre gir", "3. Giris butonuna tikla", "4. Dashboard sayfasina yonlendirildigini dogrula"]',
 'Kullanici basariyla giris yapar ve dashboard sayfasina yonlendirilir', 'critical', 'pending'),

('ui_ux', 'Dashboard Yukleme Suresi', 'Dashboard sayfasinin hizli yuklendigini test eder',
 '["1. Login yap", "2. Dashboard sayfasina git", "3. Sayfa yukleme suresini olc", "4. Tum widgetlarin yuklendigini dogrula"]',
 'Sayfa 3 saniye icinde tamamen yuklenmeli', 'high', 'pending'),

('ui_ux', 'Keyword Arastirma Formu', 'Keyword arastirma formunun dogru calistigini test eder',
 '["1. /keywords/agent sayfasina git", "2. Musteri sec", "3. Keyword gir", "4. Dil ve bolge sec", "5. Arastirmayi baslat"]',
 'Arastirma baslar ve sonuc sayfasina yonlendirilir', 'critical', 'pending'),

('ui_ux', 'Responsive Tasarim - Mobil', 'Mobil cihazlarda sayfalarin dogru goruntulendigini test eder',
 '["1. Mobil cihaz veya emulator kullan", "2. Ana sayfalari gez", "3. Buton ve formların tiklanabilirligini kontrol et", "4. Metin okunabilirligini kontrol et"]',
 'Tum sayfalar mobilde duzgun goruntulenme', 'medium', 'pending'),

('ui_ux', 'Turkce Karakter Destegi', 'Turkce karakterlerin dogru goruntulendigini test eder',
 '["1. Turkce icerikli sayfalari ac", "2. ı, ş, ğ, ü, ö, ç karakterlerini kontrol et", "3. Form inputlarında Turkce yaz", "4. Sonuclarda Turkce karakterleri dogrula"]',
 'Tum Turkce karakterler dogru goruntulenmeli', 'high', 'pending'),

-- Backend Tests
('backend', 'API /clients Endpoint', 'Client API endpointlerinin dogru calistigini test eder',
 '["1. GET /api/clients - Liste al", "2. POST /api/clients - Yeni client olustur", "3. GET /api/clients/:id - Tek client al", "4. PUT /api/clients/:id - Guncelle", "5. DELETE /api/clients/:id - Sil"]',
 'Tum CRUD islemleri basarili olmali', 'critical', 'pending'),

('backend', 'Keyword Research API', 'Keyword arastirma API entegrasyonunu test eder',
 '["1. POST /api/n8n/keyword-research - Tekli sorgu", "2. POST /api/n8n/bulk-keyword-research - Toplu sorgu", "3. Sonuclarin veritabanina kaydedildigini dogrula"]',
 'API dogru sonuc donmeli ve veritabani guncellenmeli', 'critical', 'pending'),

('backend', 'Authentication Flow', 'Kimlik dogrulama akisini test eder',
 '["1. Gecersiz credentials ile login dene", "2. Gecerli credentials ile login ol", "3. Protected endpointe eris", "4. Logout yap", "5. Protected endpointe tekrar erismeyi dene"]',
 'Auth akisi guvenli ve dogru calismali', 'critical', 'pending'),

('backend', 'Database Connection Pool', 'Veritabani baglanti havuzunu test eder',
 '["1. Ayni anda 10 istek gonder", "2. Baglanti hatasi olup olmadigini kontrol et", "3. Tum isteklerin basarili olmasini dogrula"]',
 'Tum istekler basarili olmali, connection timeout olmamali', 'high', 'pending'),

('backend', 'N8N Webhook Integration', 'N8N webhook entegrasyonunu test eder',
 '["1. Webhook URL erisilebilir mi kontrol et", "2. POST istegi gonder", "3. Response suresini olc", "4. Hata durumlarini test et"]',
 'Webhooklar 10 saniye icinde yanit vermeli', 'high', 'pending');

-- Show created tables
SELECT 'test_scenarios table created' as status, COUNT(*) as row_count FROM test_scenarios;
SELECT 'test_results table created' as status, COUNT(*) as row_count FROM test_results;
