# Keyword Research Workflow Dokümantasyonu

Bu dokümantasyon, Content Studio'da kullanılan N8N workflowlarını ve her bir node'un işlevini açıklamaktadır.

---

## İçindekiler

1. [Tekli Keyword Araştırma (WF-KEYWORD-RESEARCH)](#1-tekli-keyword-araştırma)
2. [Toplu Keyword Araştırma - Ana Workflow (WF-BULK-KEYWORD v3)](#2-toplu-keyword-araştırma---ana-workflow)
3. [Toplu Keyword Araştırma - Tekil İşlem (WF-BULK-KEYWORD Single Seed v2)](#3-toplu-keyword-araştırma---tekil-işlem)
4. [Keyword Keşif (WF-101a)](#4-keyword-keşif-workflow)
5. [Keyword Filtreleme (WF-101b)](#5-keyword-filtreleme-workflow)
6. [Keyword Listeleme (WF-101c)](#6-keyword-listeleme-workflow)
7. [Kullanılan Harici Servisler](#7-kullanılan-harici-servisler)
8. [Veritabanı Tabloları](#8-veritabanı-tabloları)

---

## 1. Tekli Keyword Araştırma

**Workflow Adı:** WF-KEYWORD-RESEARCH
**Webhook:** POST /webhook/keyword-research
**Amaç:** Tek bir ana keyword için kapsamlı araştırma yaparak ilgili keywordleri bulur, AI ile filtreler ve zenginleştirir.

### Workflow Akışı

```
Kullanıcı Girişi → Doğrulama → Müşteri Ayarları → Paralel API Çağrıları
                                                    ├── Google Öneriler
                                                    └── DataForSEO
                                                          ↓
                                                   Birleştir & Temizle
                                                          ↓
                                                   AI Seçim (Opsiyonel)
                                                          ↓
                                                   AI Zenginleştirme
                                                          ↓
                                                   Veritabanına Kaydet
                                                          ↓
                                                   Sonuç Döndür
```

### Node Açıklamaları

| Node | Tip | Ne Yapar? |
|------|-----|-----------|
| **Webhook** | Giriş | Kullanıcıdan keyword, dil ve ülke bilgisini alır |
| **Validate Input** | JavaScript | Keyword'ün en az 2 karakter olduğunu kontrol eder, ülke/dil kodlarını hazırlar |
| **Get Client Config** | MySQL | Müşterinin AI model tercihi ve özellik ayarlarını veritabanından çeker |
| **Prepare Config** | JavaScript | Müşteri ayarlarını giriş verileriyle birleştirir |
| **Google Suggestions** | HTTP GET | Google otomatik tamamlama önerilerini çeker (ücretsiz) |
| **DataForSEO Keywords** | HTTP POST | DataForSEO API'den arama hacmi, CPC, zorluk gibi metrikleri çeker |
| **Merge Keywords** | JavaScript | İki kaynaktan gelen keywordleri birleştirir, Türkçe karakter normalizasyonu ile tekrarları temizler |
| **Prepare Final Selection** | JavaScript | 30'dan fazla keyword varsa AI seçimi için prompt hazırlar |
| **Gemini Final Selection** | HTTP POST | Google Gemini AI ile en önemli 25-30 keyword'ü seçtirir |
| **Parse Final Selection** | JavaScript | AI cevabını ayrıştırır, seçilen keyword indekslerini çıkarır |
| **Prepare Enrich Prompt** | JavaScript | Her keyword için intent, cluster, öncelik analizi promptu hazırlar |
| **Gemini Enrich** | HTTP POST | Gemini AI ile keywordleri zenginleştirir (intent, cluster, priority, content_type) |
| **Parse Enrich** | JavaScript | Zenginleştirme cevabını yapılandırılmış veriye dönüştürür |
| **Split for DB** | JavaScript | Keywordleri veritabanı formatına çevirir |
| **Save to DB** | MySQL | Keywordleri `keyword_results` tablosuna kaydeder |
| **Response** | JavaScript | İstatistikler ve keyword verileriyle final cevabı hazırlar |
| **Respond Success** | Webhook Response | JSON cevabını kullanıcıya döndürür |

### Örnek Giriş/Çıkış

**Giriş:**
```json
{
  "keyword": "elektrikli araba",
  "language": "tr",
  "country": "TR",
  "client_id": 1,
  "project_id": 123
}
```

**Çıkış:**
```json
{
  "success": true,
  "main_keyword": "elektrikli araba",
  "keywords": [
    {
      "keyword": "elektrikli araba fiyatları",
      "search_volume": 45000,
      "cpc": 0.85,
      "difficulty": 45,
      "intent": "commercial",
      "cluster": "fiyat",
      "priority": "high"
    }
  ],
  "stats": {
    "total_raw": 465,
    "after_dedup": 450,
    "after_final_selection": 25,
    "from_google_suggest": 15,
    "from_dataforseo": 450
  }
}
```

---

## 2. Toplu Keyword Araştırma - Ana Workflow

**Workflow Adı:** WF-BULK-KEYWORD-MAIN-v3
**Webhook:** POST /bulk-keyword-research
**Amaç:** Birden fazla seed keyword'ü paralel olarak işleyerek toplu araştırma yapar.

### Workflow Akışı

```
Kullanıcı Girişi (Çoklu Keyword)
          ↓
    Doğrula & Böl
          ↓
   Paralel İşleme (Her seed için ayrı thread)
    ├── Single Seed v2 (Seed 1)
    ├── Single Seed v2 (Seed 2)
    ├── Single Seed v2 (Seed 3)
    └── ... (Max 20 seed)
          ↓
    Sonuçları Birleştir
          ↓
    Toplu DB Kaydı
          ↓
    Final Cevap
```

### Node Açıklamaları

| Node | Tip | Ne Yapar? |
|------|-----|-----------|
| **Webhook** | Giriş | Keyword listesini alır (max 20 adet) |
| **Validate** | JavaScript | Keywordleri ayırır, her birinin geçerli olduğunu kontrol eder |
| **Process Seeds** | HTTP (Paralel) | Her seed için Single Seed v2 workflow'unu çağırır |
| **Combine Results** | JavaScript | Tüm seed sonuçlarını tek bir listede birleştirir |
| **Build SQL** | JavaScript | Toplu INSERT sorgusu hazırlar (2000 satıra kadar) |
| **MySQL** | MySQL | Tüm keywordleri tek sorguda veritabanına yazar |
| **Response** | JavaScript | İstatistiklerle birlikte final cevabı hazırlar |

### İşlem Limitleri

- **Maksimum Seed Sayısı:** 20
- **Seed Başına Timeout:** 120 saniye
- **Paralel İşlem:** Tüm seedler aynı anda işlenir

---

## 3. Toplu Keyword Araştırma - Tekil İşlem

**Workflow Adı:** WF-BULK-KEYWORD-SINGLE-v2
**Webhook:** POST /process-single-seed
**Amaç:** Ana bulk workflow tarafından çağrılır, tek bir seed keyword'ü işler.

### Workflow Akışı

```
Seed Keyword Girişi
        ↓
  System Prompt Al (DB)
        ↓
  DataForSEO API Çağrısı
        ↓
  Sonuçları Ayrıştır
        ↓
  Gemini AI Filtreleme
        ↓
  AI Cevabını Ayrıştır
        ↓
  Onaylı/Reddedilmiş Ayır
        ↓
  Sonuç Döndür
```

### Node Açıklamaları

| Node | Tip | Ne Yapar? |
|------|-----|-----------|
| **Webhook** | Giriş | Tek bir seed keyword alır |
| **Get Prompt** | MySQL | `system_prompts` tablosundan filtreleme promptunu çeker |
| **DataForSEO** | HTTP POST | Seed keyword için ilgili tüm keywordleri ve metriklerini çeker |
| **Parse DFS** | JavaScript | API cevabını ayrıştırır, UTF-8 encoding düzeltir, tekrarları temizler |
| **Gemini** | HTTP POST | AI ile keywordleri filtreler (Temperature: 0.1 - deterministik) |
| **Parse Gemini** | JavaScript | AI cevabından onaylanan keyword numaralarını çıkarır |
| **Response** | JSON | Onaylı ve reddedilmiş keywordleri döndürür |

### Türkçe Karakter Normalizasyonu

Tekrar tespiti için şu dönüşümler uygulanır:
- ı → i
- ş → s
- ö → o
- ü → u
- ç → c
- ğ → g

Orijinal Türkçe karakterler veritabanında korunur.

### AI Çıktı Formatı

AI'dan beklenen format:
```
CONTENT:1,5,8,12,15,23,45,67
```

Sadece onaylanan keyword numaraları, virgülle ayrılmış.

### Fallback Mantığı

AI cevabı ayrıştırılamazsa:
1. Keywordler arama hacmine göre sıralanır
2. En yüksek 35 tanesi onaylanır
3. Geri kalanı reddedilir

---

## 4. Keyword Keşif Workflow

**Workflow Adı:** WF-101a-keyword-discovery
**Webhook:** POST /webhook/keyword-discovery
**Amaç:** Bir proje için çoklu kaynaklardan keyword keşfi yapar.

### Workflow Akışı

```
Proje ID Girişi
       ↓
  Proje Bilgisini Al
       ↓
  Senaryo Kontrolü
    ├── seed_keyword: Direkt kullan
    └── topic_based: AI ile keyword üret
           ↓
      Kaynak Çağrıları (Paralel)
       ├── Google Suggest
       ├── Google Trends (pattern-based)
       └── Ahrefs (opsiyonel)
           ↓
      Birleştir & Temizle
           ↓
      Veritabanına Kaydet
           ↓
      Proje Durumunu Güncelle
```

### Node Açıklamaları

| Node | Tip | Ne Yapar? |
|------|-----|-----------|
| **Webhook** | Giriş | Proje ID'sini alır |
| **Get Project** | MySQL | Proje detaylarını veritabanından çeker |
| **Resolve Config** | JavaScript | Müşteri ayarlarını proje bilgisiyle birleştirir |
| **Switch Scenario** | Switch | `seed_keyword` veya `topic_based` senaryosuna göre dallanır |
| **AI Extract Keywords** | HTTP POST | Topic-based modda AI ile ilgili keywordler üretir |
| **HTTP Google Suggest** | HTTP GET | Google otomatik tamamlama önerilerini çeker |
| **Google Trends** | JavaScript | Pattern-based trend analizi yapar |
| **Ahrefs Keywords** | HTTP (Opsiyonel) | Ahrefs API'den keyword çeker (enable_ahrefs_api=1 ise) |
| **Merge & Dedupe** | JavaScript | Tüm kaynakları birleştirir, tekrarları temizler |
| **Save Keywords** | MySQL | Keywordleri veritabanına kaydeder |
| **Update Project** | MySQL | Proje durumunu `keywords_discovered` olarak günceller |

### Desteklenen Senaryolar

1. **seed_keyword:** Ana keyword'ü direkt kullanır
2. **topic_based:** AI ile ana keyword'den ilgili keywordler türetir

---

## 5. Keyword Filtreleme Workflow

**Workflow Adı:** WF-101b-keyword-filter
**Webhook:** POST /:projectId/filter-keywords
**Amaç:** Keşfedilen keywordleri AI ile filtreler ve zenginleştirir.

### Workflow Akışı

```
Proje ID Girişi
       ↓
  Keywordleri Al
       ↓
  AI Prompt Hazırla (CSV formatı)
       ↓
  AI Filtreleme (Cascade)
    ├── 1. Gemini (Birincil)
    ├── 2. OpenAI (Fallback)
    └── 3. Mock Rules (Son çare)
           ↓
      Token Kullanımını Logla
           ↓
      Onaylı Keywordleri Güncelle
           ↓
      Proje Durumunu Güncelle
```

### Node Açıklamaları

| Node | Tip | Ne Yapar? |
|------|-----|-----------|
| **Webhook** | Giriş | Proje ID'sini alır |
| **Get Keywords** | MySQL | Projenin pending durumundaki keywordlerini çeker |
| **Prepare AI Prompt** | JavaScript | Keywordleri CSV formatında AI promptuna dönüştürür |
| **Gemini - Try First** | HTTP POST | İlk olarak Gemini AI ile filtreleme dener |
| **OpenAI - Fallback** | HTTP POST | Gemini başarısız olursa OpenAI'a geçer |
| **Mock Fallback** | JavaScript | Her iki AI de başarısız olursa kural tabanlı filtreleme uygular |
| **Calculate Token Usage** | JavaScript | Kullanılan token sayısını hesaplar |
| **Log Token Usage** | MySQL | Token kullanımını `api_usage_tracking` tablosuna kaydeder |
| **Update Keyword** | MySQL | Her onaylı keyword'ün durumunu günceller |
| **Update Project Status** | MySQL | Proje durumunu `filtered` olarak günceller |

### AI Model Cascade

1. **Gemini 2.0 Flash** (Birincil) - En hızlı
2. **OpenAI GPT-4** (Fallback) - Gemini başarısız olursa
3. **Mock Rules** (Son çare) - Her iki AI de başarısız olursa

### Token Takibi

Her AI çağrısı için şu bilgiler kaydedilir:
- API sağlayıcı (gemini/openai/mock)
- Model adı
- Input token sayısı
- Output token sayısı
- Başarı durumu

---

## 6. Keyword Listeleme Workflow

**Workflow Adı:** WF-101c-get-keywords
**Webhook:** GET /:projectId/keywords
**Amaç:** Bir projenin keywordlerini sayfalama ile listeler.

### Workflow Akışı

```
Proje ID + Sayfalama Parametreleri
              ↓
        Proje Kontrolü
              ↓
        Keywordleri Çek (LIMIT/OFFSET)
              ↓
        İstatistikleri Hesapla
              ↓
        Sonuç Döndür
```

### Node Açıklamaları

| Node | Tip | Ne Yapar? |
|------|-----|-----------|
| **Webhook** | Giriş | Proje ID, limit ve offset parametrelerini alır |
| **Check Project** | MySQL | Projenin var olduğunu doğrular |
| **Get Keywords** | MySQL | Keywordleri sayfalama ile çeker |
| **Get Stats** | MySQL | Toplam, ortalama hacim, zorluk gibi istatistikleri hesaplar |
| **Aggregate** | JavaScript | Verileri tip, cluster ve intent'e göre gruplar |
| **Success Response** | Webhook Response | Keywordleri ve istatistikleri döndürür |

### Sıralama

Keywordler şu sıraya göre döndürülür:
1. Opportunity Score (Azalan)
2. Search Volume (Azalan)

---

## 7. Kullanılan Harici Servisler

### 7.1 DataForSEO API

**Amaç:** Keyword metrikleri (arama hacmi, CPC, zorluk)

| Özellik | Değer |
|---------|-------|
| **Endpoint** | `https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live` |
| **Auth** | Basic Authentication |
| **Maliyet** | Ücretli (sorgu başına) |

**Döndürdüğü Veriler:**
- Aylık arama hacmi
- CPC (tıklama başı maliyet)
- Rekabet seviyesi
- Keyword zorluk skoru

### 7.2 Google Gemini API

**Amaç:** AI tabanlı keyword filtreleme ve zenginleştirme

| Özellik | Değer |
|---------|-------|
| **Endpoint** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` |
| **Auth** | API Key (query parameter) |
| **Model** | gemini-2.0-flash |
| **Temperature** | 0.1 (filtreleme) / 0.3 (zenginleştirme) |

**Kullanım Alanları:**
- Keyword önceliklendirme (top 25-30 seçimi)
- Intent belirleme (informational, commercial, transactional, navigational)
- Cluster gruplama
- Öncelik atama (high, medium, low)
- İçerik tipi belirleme (pillar, cluster, landing, guide)

### 7.3 Google Suggestions API

**Amaç:** Otomatik tamamlama önerileri

| Özellik | Değer |
|---------|-------|
| **Endpoint** | `http://suggestqueries.google.com/complete/search` |
| **Auth** | Yok (ücretsiz) |
| **Maliyet** | Ücretsiz |

**Parametreler:**
- `q`: Aranacak keyword
- `hl`: Dil kodu (tr, en, vb.)
- `gl`: Ülke kodu (tr, us, vb.)

### 7.4 OpenAI API (Fallback)

**Amaç:** Gemini başarısız olduğunda yedek AI

| Özellik | Değer |
|---------|-------|
| **Endpoint** | `https://api.openai.com/v1/chat/completions` |
| **Auth** | Bearer Token |
| **Model** | gpt-4 |

### 7.5 Ahrefs API (Opsiyonel)

**Amaç:** Ek keyword kaynağı

| Özellik | Değer |
|---------|-------|
| **Durum** | Opsiyonel (enable_ahrefs_api=1 gerekli) |
| **Auth** | API Key |
| **Maliyet** | Ücretli |

---

## 8. Veritabanı Tabloları

### 8.1 keyword_projects

Keyword araştırma projelerini saklar.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | INT | Birincil anahtar |
| uuid | VARCHAR(36) | Benzersiz tanımlayıcı |
| client_id | INT | Müşteri ID (FK) |
| project_name | VARCHAR(255) | Proje adı |
| main_keyword | VARCHAR(255) | Ana keyword |
| project_type | ENUM | 'single' veya 'bulk' |
| scenario_type | ENUM | 'seed_keyword', 'topic_based', 'competitor' |
| seed_keywords | JSON | Bulk modda seed keyword listesi |
| target_language | VARCHAR(10) | Hedef dil (tr, en, vb.) |
| target_country | VARCHAR(10) | Hedef ülke (TR, US, vb.) |
| status | ENUM | pending, discovering, filtering, completed, failed |
| total_keywords_found | INT | Bulunan toplam keyword sayısı |

### 8.2 keyword_results

Bulunan keywordleri ve metriklerini saklar.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | INT | Birincil anahtar |
| project_id | INT | Proje ID (FK) |
| keyword | VARCHAR(500) | Keyword metni |
| seed_keyword | VARCHAR(255) | Kaynak seed keyword |
| keyword_type | ENUM | primary, secondary, long_tail, semantic, vb. |
| search_volume | INT | Aylık arama hacmi |
| keyword_difficulty | DECIMAL | Zorluk skoru (0-100) |
| cpc | DECIMAL | Tıklama başı maliyet |
| competition | VARCHAR(20) | Rekabet seviyesi |
| search_intent | ENUM | informational, commercial, transactional, navigational |
| keyword_cluster | VARCHAR(255) | Cluster/kategori |
| opportunity_score | INT | Fırsat skoru |
| content_priority | ENUM | high, medium, low |
| page_type | ENUM | pillar, cluster, blog, product, landing, faq |
| source | ENUM | dataforseo, google_suggest, ahrefs, vb. |
| status | ENUM | approved, rejected, pending |

### 8.3 api_usage_tracking

API kullanımını ve token tüketimini takip eder.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | INT | Birincil anahtar |
| client_id | INT | Müşteri ID |
| tool_name | VARCHAR(50) | Araç adı |
| project_id | INT | Proje ID |
| workflow_name | VARCHAR(255) | Workflow adı |
| api_provider | VARCHAR(50) | gemini, openai, dataforseo, vb. |
| model_name | VARCHAR(100) | Kullanılan model |
| tokens_input | INT | Input token sayısı |
| tokens_output | INT | Output token sayısı |
| was_successful | BOOLEAN | Başarılı mı? |
| created_at | DATETIME | Oluşturulma tarihi |

### 8.4 client_configurations

Müşteri bazlı özellik ayarları.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| enable_google_suggest | TINYINT | Google önerileri aktif mi? |
| enable_google_trends | TINYINT | Google Trends aktif mi? |
| enable_ahrefs_api | TINYINT | Ahrefs API aktif mi? |
| enable_ai_analysis | TINYINT | AI analizi aktif mi? |
| ai_model_preference | VARCHAR(50) | Tercih edilen AI modeli |
| ai_temperature | DECIMAL | AI temperature ayarı (0-1) |
| target_audience | TEXT | Hedef kitle açıklaması |

### 8.5 system_prompts

Özelleştirilebilir AI promptları.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | INT | Birincil anahtar |
| slug | VARCHAR(100) | Benzersiz tanımlayıcı (keyword-filter, vb.) |
| name | VARCHAR(255) | Prompt adı |
| content | TEXT | Prompt içeriği |
| is_active | TINYINT | Aktif mi? |

---

## Hata Yönetimi ve Fallback Stratejileri

### AI Filtreleme Cascade

```
Gemini Başarısız?
    ↓ Evet
OpenAI Başarısız?
    ↓ Evet
Mock Rules (Hacme göre sıralama)
```

### DataForSEO Timeout

- Workflow kısmi veriyle devam eder
- Google Suggest sonuçları kullanılır

### Veritabanı Hata Durumu

- Keywordler yine de kullanıcıya döndürülür
- Status "pending" olarak kalır

---

## Performans Optimizasyonları

1. **Paralel İşleme:** Bulk workflow'da tüm seedler aynı anda işlenir
2. **Batch INSERT:** 2000 satıra kadar tek sorguda yazılır
3. **UNIQUE Constraint:** Tekrar eden keywordler otomatik güncellenir
4. **Token Caching:** System promptlar veritabanından önbelleğe alınır

---

*Bu dokümantasyon Content Studio v1.0 için hazırlanmıştır.*
*Son güncelleme: Aralık 2024*
