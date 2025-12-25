# SEO Tool Suite - Keyword Research Workflow Documentation

## Version 3.0 | Aralık 2025

---

# 1. GENEL BAKIS

## 1.1 Sistem Mimarisi

SEO Tool Suite, anahtar kelime arastirmasi ve analizi icin gelistirilmis kapsamli bir platformdur. Sistem uc ana katmandan olusmaktadir:

```
+------------------+     +------------------+     +------------------+
|    FRONTEND      | --> |    NEXT.JS       | --> |     N8N          |
|    (React UI)    |     |    (API Layer)   |     |   (Workflows)    |
+------------------+     +------------------+     +------------------+
         |                       |                        |
         v                       v                        v
    Kullanici               API Routes              Veri Kaynaklari
    Arayuzu                (Proxy/Auth)            (DataForSEO, AI)
                                                         |
                                                         v
                                                  +------------------+
                                                  |     MySQL DB     |
                                                  +------------------+
```

## 1.2 Teknoloji Yigini

| Katman | Teknoloji | Aciklama |
|--------|-----------|----------|
| Frontend | Next.js 15 + React 19 | Modern web arayuzu |
| Styling | Tailwind CSS | Utility-first CSS |
| Animasyon | Framer Motion | Akici animasyonlar |
| Workflow | N8N | Otomasyon motoru |
| Veritabani | MySQL 8 | Veri depolama |
| AI | Google Gemini | Keyword filtreleme |
| SEO Data | DataForSEO | Keyword metrikleri |

---

# 2. FRONTEND KATMANI

## 2.1 Ana Sayfa: `/keywords/agent`

Keyword arastirmasi icin ana giris noktasi. Kullanici buradan tekli veya toplu sorgu yapabilir.

### 2.1.1 Kullanici Arayuzu Bilesenleri

```
+-------------------------------------------------------+
|                   KEYWORD ARASTIRMA                    |
|                                                        |
|  +--------------------------------------------------+ |
|  |  [ Tekli Sorgu ]  [ Toplu Sorgu ]  [ Excel ]     | |
|  +--------------------------------------------------+ |
|                                                        |
|  +--------------------------------------------------+ |
|  | Musteri:  [ Dropdown - Musteri Secimi ]          | |
|  +--------------------------------------------------+ |
|                                                        |
|  +--------------------------------------------------+ |
|  | Anahtar Kelime(ler):                             | |
|  | +----------------------------------------------+ | |
|  | |                                              | | |
|  | | [Input / Textarea]                          | | |
|  | |                                              | | |
|  | +----------------------------------------------+ | |
|  +--------------------------------------------------+ |
|                                                        |
|  +------------------------+  +----------------------+ |
|  | Dil: [TR v]            |  | Bolge: [TR v]       | |
|  +------------------------+  +----------------------+ |
|                                                        |
|  +--------------------------------------------------+ |
|  | > AI Yonlendirme (Opsiyonel)                     | |
|  |   [Ek kurallar textarea]                         | |
|  +--------------------------------------------------+ |
|                                                        |
|  +--------------------------------------------------+ |
|  |          [  ARASTIRMAYI BASLAT  ]                | |
|  +--------------------------------------------------+ |
+-------------------------------------------------------+
```

### 2.1.2 Form Alanlari

| Alan | Tip | Zorunlu | Aciklama |
|------|-----|---------|----------|
| mode | Toggle | Evet | `single` veya `bulk` |
| keywords | Input/Textarea | Evet | Arastirma yapilacak kelime(ler) |
| language | Select | Evet | Hedef dil (tr, en, de, fr) |
| region | Select | Evet | Hedef ulke (TR, US, GB, DE, FR) |
| selectedClientId | Number | Evet | Musteri ID |
| aiContext | Textarea | Hayir | AI icin ek kurallar |

### 2.1.3 Desteklenen Diller ve Bolgeler

**Diller:**
- Turkce (tr)
- English (en)
- Deutsch (de)
- Francais (fr)

**Bolgeler:**
- Turkiye (TR)
- ABD (US)
- Ingiltere (GB)
- Almanya (DE)
- Fransa (FR)

### 2.1.4 Excel Import Ozelligi

Kullanici, Excel dosyasindan toplu keyword yukleyebilir:

```javascript
// Desteklenen formatlar: .xlsx, .xls, .csv
// Otomatik temizleme:
// - Baslik satirlari filtrelenir
// - Tekrar eden keywordler kaldirilir
// - 1-100 karakter arasi keywordler kabul edilir
```

### 2.1.5 Yukleme Animasyonu

**Tekli Sorgu Adimlari:**
1. Proje olusturuluyor... (3sn)
2. Google Suggestions sorgulanıyor... (4sn)
3. DataForSEO ile keyword verisi cekiliyor... (8sn)
4. Keywordler birlestiriliyor... (3sn)
5. AI en iyi keywordleri seciyor... (6sn)
6. Sonuclar kaydediliyor... (2sn)

**Toplu Sorgu Adimlari:**
1. Bulk proje olusturuluyor... (2sn)
2. DataForSEO bulk sorgusu yapiliyor... (15sn)
3. Google Suggestions paralel cekiliyor... (20sn)
4. Tum keywordler birlestiriliyor... (5sn)
5. AI chunk analizi yapiliyor... (60sn)
6. Sonuclar kaydediliyor... (10sn)

---

## 2.2 API Endpoints

### 2.2.1 N8N Proxy Endpoint

**Konum:** `/api/n8n/[...path]/route.ts`

Bu endpoint, frontend ile N8N arasinda kopru gorevi gorur:

```
Frontend Request --> /api/n8n/{path} --> N8N Webhook
                                              |
                         <-- Response <-------+
```

**Ozellikler:**
- CORS sorunlarini cozme
- JWT authentication
- Request/Response logging
- Array response unwrapping

### 2.2.2 Proje API Endpoints

| Endpoint | Method | Aciklama |
|----------|--------|----------|
| `/api/projects` | GET | Projeleri listele |
| `/api/projects/[projectId]` | GET | Proje detay |
| `/api/projects/[projectId]` | PATCH | Proje guncelle |
| `/api/projects/[projectId]` | DELETE | Proje sil |

---

# 3. N8N WORKFLOW KATMANI

## 3.1 Workflow Listesi

Keyword arastirmasi icin kullanilan tum workflowlar:

| ID | Workflow Adi | Aciklama |
|----|--------------|----------|
| j3jZIjdsJSchQqCe | WF-KEYWORD-RESEARCH | Tekli keyword arastirmasi |
| RT4KZuZUgBZALnoc | WF-BULK-KEYWORD: Main v3 | Toplu keyword koordinator |
| ui3URrp8AS5yEa0p | WF-BULK-KEYWORD: Single Seed v2 | Tekil seed isleyici |
| DyGEyObKWBEHrb0B | WF-101-project-initializer | Proje olusturma |
| yyD1QW0PcJgp3ik2 | WF-101a: Keyword Discovery | Keyword kesif |
| 6nclsXOjxGhT8qJs | WF-101b: AI Keyword Filter | AI filtreleme |
| r8uQ8T48G7SDp9or | WF-101c: Get Keywords | Keyword cekme |
| yd6UhBrs7iqGeEg6 | WF-102: Get Keyword Project | Proje detay |
| 9wxzOy1QgENPVVSD | WF-103: List Keyword Projects | Proje listesi |

---

## 3.2 WF-KEYWORD-RESEARCH: Tekli Keyword Arastirmasi

**Workflow ID:** `j3jZIjdsJSchQqCe`

### 3.2.1 Akis Diyagrami

```
+-------------+     +-------------+     +---------------+
|   Webhook   | --> |  Validate   | --> |  DataForSEO   |
|   (Input)   |     |   Input     |     |   Keywords    |
+-------------+     +-------------+     +---------------+
                                               |
                                               v
+-------------+     +-------------+     +---------------+
|   Return    | <-- |  AI Filter  | <-- |   Merge &     |
|   Results   |     |  (Gemini)   |     |   Process     |
+-------------+     +-------------+     +---------------+
```

### 3.2.2 Node Detaylari

| Node | Tip | Aciklama |
|------|-----|----------|
| Webhook | n8n-nodes-base.webhook | Istegi alir |
| Validate Input | Code | Parametreleri dogrular |
| DataForSEO Keywords | HTTP Request | Keyword metrikleri ceker |
| Google Suggestions | HTTP Request | Oneri keywordleri ceker |
| Merge Keywords | Code | Tum keywordleri birlestirir |
| AI Filter (Gemini) | HTTP Request | AI ile filtreleme yapar |
| Save Results | MySQL | Sonuclari kaydeder |
| Respond | Webhook Response | Sonuclari doner |

### 3.2.3 Giris Parametreleri

```json
{
  "keyword": "elektrikli araba",      // Ana kelime
  "language": "tr",                    // Dil kodu
  "country": "TR",                     // Ulke kodu
  "client_id": 1,                      // Musteri ID
  "project_id": 123,                   // Proje ID
  "ai_context": "Satin alma niyetli"  // Opsiyonel AI kurallari
}
```

### 3.2.4 Cikis Formati

```json
{
  "success": true,
  "project_id": 123,
  "project_uuid": "abc-123-def",
  "keywords": [
    {
      "keyword": "elektrikli araba fiyatlari",
      "volume": 12000,
      "difficulty": 45,
      "cpc": 0.85,
      "intent": "commercial",
      "ai_score": 95,
      "relevance": "high"
    }
  ],
  "stats": {
    "total_discovered": 450,
    "total_filtered": 85,
    "ai_approved": 50
  }
}
```

---

## 3.3 WF-BULK-KEYWORD: Main v3 (Koordinator)

**Workflow ID:** `RT4KZuZUgBZALnoc`

### 3.3.1 Akis Diyagrami

```
+-------------+     +-------------+     +---------------+
|   Webhook   | --> |  Validate   | --> |   Split       |
|   (Input)   |     |   Input     |     |   Seeds       |
+-------------+     +-------------+     +---------------+
                                               |
                          +--------------------+
                          |
                          v
      +-------+-------+-------+-------+
      |       |       |       |       |
      v       v       v       v       v
+----------+ +----------+ +----------+
| Single   | | Single   | | Single   |  (Paralel islem)
| Seed     | | Seed     | | Seed     |
+----------+ +----------+ +----------+
      |       |       |
      +-------+-------+
              |
              v
      +---------------+     +---------------+
      |   Merge All   | --> |   Aggregate   |
      |   Results     |     |   & Save      |
      +---------------+     +---------------+
                                   |
                                   v
                            +-------------+
                            |   Return    |
                            |   Results   |
                            +-------------+
```

### 3.3.2 Node Detaylari

| Node | Tip | Aciklama |
|------|-----|----------|
| Webhook | Webhook | Bulk istegi alir |
| Validate | Code | Parametreleri kontrol eder |
| Split Seeds | Code | Keywordleri ayirir |
| Process Seeds | HTTP Request | Her seed icin Single Seed cagir |
| Merge Results | Code | Sonuclari birlestirir |
| Save Bulk Stats | MySQL | Istatistikleri kaydeder |
| Respond | Webhook Response | Toplam sonuclari doner |

### 3.3.3 Giris Parametreleri

```json
{
  "keywords": [
    "elektrikli araba",
    "hibrit araba",
    "elektrikli suv"
  ],
  "language": "tr",
  "country": "TR",
  "client_id": 1,
  "project_id": 123,
  "ai_context": "B2B odakli keywordlere oncelik ver"
}
```

### 3.3.4 Paralel Islem

Main v3 workflow, her seed keyword icin Single Seed v2 workflow'unu paralel olarak calistirir:

```
                    Main v3
                       |
       +---------------+---------------+
       |               |               |
       v               v               v
   Single Seed    Single Seed    Single Seed
   "elektrikli    "hibrit        "elektrikli
    araba"        araba"          suv"
       |               |               |
       +---------------+---------------+
                       |
                       v
                 Merged Results
```

---

## 3.4 WF-BULK-KEYWORD: Single Seed v2

**Workflow ID:** `ui3URrp8AS5yEa0p`

### 3.4.1 Akis Diyagrami

```
+-------------+     +---------------+     +---------------+
|   Webhook   | --> |   Parse DFS   | --> |  DataForSEO   |
|   (Seed)    |     |   Request     |     |   API Call    |
+-------------+     +---------------+     +---------------+
                                                 |
                          +----------------------+
                          |
                          v
+-------------+     +---------------+     +---------------+
|   Return    | <-- |   AI Filter   | <-- |   Process     |
|   Results   |     |   Keywords    |     |   Response    |
+-------------+     +---------------+     +---------------+
```

### 3.4.2 Node Detaylari

| Node | Tip | Aciklama |
|------|-----|----------|
| Webhook | Webhook | Tek seed alir |
| Parse DFS | Code | DataForSEO istegi hazirlar |
| DataForSEO | HTTP Request | API'yi cagir, UTF-8 encoding |
| Process Response | Code | Sonuclari parse et |
| AI Filter | HTTP Request | Gemini ile filtrele |
| Format Output | Code | Cikisi hazirla |
| Respond | Webhook Response | Sonucu don |

### 3.4.3 AI Filtreleme Prompt Yapisi

```javascript
const prompt = `Sen bir SEO uzmanisın...

KEYWORD LISTESI:
${keywordListesi}

KURALLLAR:
- En alakali keywordleri sec
- Arama hacmi onemli
- Rekabet zorluğunu degerlendir
${aiContext ? `\n\nEK KURALLAR:\n${aiContext}` : ''}
`;
```

### 3.4.4 UTF-8 Encoding Detaylari

Turkce karakterlerin dogru islenmesi icin ozel yapilandirma:

```javascript
// HTTP Request Node ayarlari:
{
  "specifyBody": "json",
  "jsonBody": "={{ JSON.stringify({...}) }}",
  "headers": {
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json; charset=utf-8"
  },
  "responseFormat": "json"
}
```

---

## 3.5 WF-101-project-initializer

**Workflow ID:** `DyGEyObKWBEHrb0B`

### 3.5.1 Akis Diyagrami

```
+-------------+     +---------------+     +---------------+
|   Webhook   | --> |   Validate    | --> |   Create      |
|   (Input)   |     |   Input       |     |   Project     |
+-------------+     +---------------+     +---------------+
                                                 |
                                                 v
                                          +---------------+
                                          |   Return      |
                                          |   UUID        |
                                          +---------------+
```

### 3.5.2 Node Detaylari

| Node | Aciklama |
|------|----------|
| Webhook | POST istegi alir |
| Validate Input | client_id, project_name dogrular |
| Generate UUID | Benzersiz proje ID olusturur |
| Create Project | MySQL INSERT |
| Return UUID | Proje ID ve UUID doner |

### 3.5.3 Proje Olusturma SQL

```sql
INSERT INTO keyword_projects (
  uuid,
  client_id,
  project_name,
  main_keyword,
  scenario_type,
  target_language,
  target_country,
  seed_keywords,
  project_type,
  status,
  created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
```

---

# 4. VERITABANI YAPISI

## 4.1 keyword_projects Tablosu

```sql
CREATE TABLE keyword_projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE,
  client_id INT,
  project_name VARCHAR(255),
  main_keyword VARCHAR(255),
  scenario_type ENUM('seed_keyword', 'competitor', 'topic'),
  target_language VARCHAR(10),
  target_country VARCHAR(10),
  seed_keywords JSON,           -- Bulk icin kaynak keywordler
  project_type ENUM('single', 'bulk'),
  status ENUM('pending', 'discovering', 'filtering', 'completed', 'failed'),
  total_keywords_found INT DEFAULT 0,
  total_competitors_analyzed INT DEFAULT 0,
  total_paa_found INT DEFAULT 0,
  bulk_stats JSON,              -- Bulk istatistikleri
  ai_categories JSON,           -- AI kategorizasyon sonuclari
  ai_categorization_done BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

## 4.2 keyword_results Tablosu

```sql
CREATE TABLE keyword_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT,
  keyword VARCHAR(500),
  search_volume INT,
  keyword_difficulty DECIMAL(5,2),
  cpc DECIMAL(10,4),
  competition VARCHAR(20),
  intent VARCHAR(50),
  source VARCHAR(50),
  ai_score INT,
  ai_relevance VARCHAR(20),
  ai_category VARCHAR(100),
  is_selected BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES keyword_projects(id) ON DELETE CASCADE
);
```

---

# 5. VERI AKISI DETAYI

## 5.1 Tekli Sorgu Akisi

```
1. Kullanici Form Doldurur
        |
        v
2. Frontend: handleSubmit()
   - Validasyon
   - Proje olusturma API cagir
        |
        v
3. API: /api/n8n/tool1/project/create
   - N8N'e proxy
        |
        v
4. N8N: WF-101-project-initializer
   - UUID olustur
   - MySQL INSERT
   - project_id don
        |
        v
5. Frontend: keyword-research API cagir
        |
        v
6. API: /api/n8n/keyword-research
   - N8N'e proxy
        |
        v
7. N8N: WF-KEYWORD-RESEARCH
   a. DataForSEO'dan keyword cek
   b. Google Suggestions cek
   c. Keywordleri birlestir
   d. Gemini ile filtrele
   e. MySQL'e kaydet
   f. Sonuclari don
        |
        v
8. Frontend: Sonuc sayfasina yonlendir
   /keywords/agent/{uuid}
```

## 5.2 Toplu Sorgu Akisi

```
1. Kullanici Form Doldurur (coklu keyword)
        |
        v
2. Frontend: handleSubmit()
   - Validasyon
   - Proje olusturma (seed_keywords ile)
        |
        v
3. API: /api/n8n/tool1/project/create
   - seed_keywords JSON olarak kaydedilir
        |
        v
4. Frontend: bulk-keyword-research API cagir
        |
        v
5. API: /api/n8n/bulk-keyword-research
        |
        v
6. N8N: WF-BULK-KEYWORD: Main v3
   a. Keywords'u parse et
   b. Her biri icin Single Seed cagir (paralel)
        |
        +---> Single Seed v2: "keyword1"
        +---> Single Seed v2: "keyword2"
        +---> Single Seed v2: "keyword3"
        |
   c. Sonuclari birlestir
   d. bulk_stats guncelle
   e. Toplam sonuc don
        |
        v
7. Frontend: Sonuc sayfasina yonlendir
```

---

# 6. AI FILTRELEME DETAYLARI

## 6.1 Gemini Entegrasyonu

AI filtreleme, Google Gemini API kullanilarak yapilir:

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

### 6.1.1 Prompt Yapisi

```
Sen bir SEO uzmanisin. Asagidaki keyword listesini analiz et.

KEYWORD LISTESI:
[keyword1]: volume=1000, kd=45
[keyword2]: volume=500, kd=30
...

DEGERLENDIRME KRITERLERI:
1. Arama hacmi (volume) yuksek olan keywordler tercih edilir
2. Keyword zorlugu (kd) orta seviyede olmali
3. Ticari niyet tasiyan keywordler oncelikli
4. Ana keyword ile alakali olmali

${aiContext ? `EK KURALLAR: ${aiContext}` : ''}

CIKTI FORMATI:
Her keyword icin JSON formatinda:
{
  "keyword": "...",
  "score": 0-100,
  "relevance": "high|medium|low",
  "reason": "..."
}
```

### 6.1.2 AI Context Kullanimi

Kullanici tarafindan girilen `ai_context` parametresi, AI filtreleme kurallarini ozellestirmek icin kullanilir:

**Ornek Kullanim Senaryolari:**

| Senaryo | AI Context |
|---------|------------|
| B2B odak | "Sadece B2B ile ilgili keywordleri sec" |
| Fiyat odak | "Fiyat iceren keywordlere oncelik ver" |
| Bilgi odak | "Egitici icerik icin uygun keywordler" |
| Yerel SEO | "Yerel aramalar icin uygun olanlar" |

---

# 7. HATA YONETIMI

## 7.1 Frontend Hata Mesajlari

| Hata | Mesaj | Cozum |
|------|-------|-------|
| Musteri secilmedi | "Musteri secin" | Dropdown'dan sec |
| Keyword bos | "Keyword girin" | Input'u doldur |
| API hatasi | "Arastirma basarisiz" | Tekrar dene |
| Proje olusturulamadi | "Proje olusturulamadi" | Baglanti kontrol |

## 7.2 N8N Workflow Hatalari

| Workflow | Olasi Hata | Cozum |
|----------|------------|-------|
| project-initializer | client_id gecersiz | Parametre kontrolu |
| keyword-research | DataForSEO limit | API key kontrolu |
| bulk-keyword | Timeout | Chunk boyutunu azalt |
| AI Filter | Gemini rate limit | Bekleme suresi ekle |

---

# 8. PERFORMANS OPTIMIZASYONLARI

## 8.1 Bulk Islem Optimizasyonlari

1. **Paralel Islem:** Her seed keyword ayri thread'de islenir
2. **Chunking:** Buyuk listeler 10'lu gruplara ayrilir
3. **Caching:** Tekrar eden API sonuclari cache'lenir
4. **Rate Limiting:** API limitlerine uyum saglanir

## 8.2 Frontend Optimizasyonlari

1. **Debounce:** Input degisikliklerinde bekleme
2. **Lazy Loading:** Buyuk listeler sayfalanir
3. **Optimistic UI:** Anlik geri bildirim
4. **Error Boundary:** Hata yalitimi

---

# 9. GUVENLIK

## 9.1 Authentication

- JWT tabanlı kimlik doğrulama
- API key koruması (N8N erişimi için)
- Session yönetimi

## 9.2 Yetkilendirme

- Client bazlı erişim kontrolü
- Admin/User rol ayrımı
- Proje bazlı izinler

---

# 10. KULLANIM KILAVUZU

## 10.1 Tekli Sorgu Nasıl Yapılır

1. `/keywords/agent` sayfasına gidin
2. "Tekli Sorgu" modunu seçin
3. Müşteri seçin
4. Anahtar kelimeyi girin
5. Dil ve bölge seçin
6. (Opsiyonel) AI Yönlendirme ekleyin
7. "Araştırmayı Başlat" butonuna tıklayın
8. Sonuç sayfasında analiz yapın

## 10.2 Toplu Sorgu Nasıl Yapılır

1. `/keywords/agent` sayfasına gidin
2. "Toplu Sorgu" modunu seçin
3. Müşteri seçin
4. Her satıra bir keyword yazın (veya Excel yükleyin)
5. Dil ve bölge seçin
6. (Opsiyonel) AI Yönlendirme ekleyin
7. "Araştırmayı Başlat" butonuna tıklayın
8. İşlem tamamlanana kadar bekleyin

## 10.3 Excel Import

1. Excel dosyası hazırlayın (her hücrede bir keyword)
2. "Excel" butonuna tıklayın
3. Dosyayı seçin
4. Otomatik olarak "Toplu Sorgu" moduna geçer
5. Keywordler textarea'ya yüklenir

---

# 11. SORUN GIDERME

## 11.1 Yaygın Sorunlar

| Sorun | Olası Neden | Çözüm |
|-------|-------------|-------|
| Türkçe karakterler bozuk | UTF-8 encoding | API headers kontrol |
| Sonuç gelmiyor | N8N workflow hatalı | Workflow logları kontrol |
| Timeout hatası | Çok fazla keyword | Daha küçük gruplar dene |
| AI filtreleme çalışmıyor | ai_context parametresi | Workflow güncelle |

## 11.2 Debug Modu

Browser console'da detaylı loglar görülebilir:

```javascript
[Keyword Agent] Step 1: Creating project...
[Keyword Agent] Project created: {...}
[Keyword Agent] Step 2: Running keyword research...
[Keyword Agent] Keyword research result: {...}
```

---

# 12. VERSIYON GECMISI

| Versiyon | Tarih | Degisiklikler |
|----------|-------|---------------|
| 3.0 | Aralik 2025 | AI Context desteği, UTF-8 düzeltmeleri |
| 2.5 | Kasim 2025 | Bulk keyword workflow |
| 2.0 | Ekim 2025 | N8N entegrasyonu |
| 1.0 | Eylul 2025 | İlk sürüm |

---

**Hazirlayan:** SEO Tool Suite Development Team
**Son Guncelleme:** 25 Aralik 2025
