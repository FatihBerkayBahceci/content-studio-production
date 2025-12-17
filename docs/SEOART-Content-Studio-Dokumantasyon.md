# SEOART Content Studio
## Keyword Research & Content Strategy Tool
### Kullanıcı Dokümantasyonu

**Versiyon:** 1.9
**Tarih:** Aralık 2025
**Toplam Workflow:** 14
**Toplam Node:** 261

---

## İçindekiler

1. Genel Bakış
2. Sistem Mimarisi
3. Analiz Süreci
4. WF-101: Proje Oluşturucu
5. WF-101a: Keyword Keşfedici
6. WF-101b: AI Keyword Filtresi
7. WF-104: Rakip Analizcisi
8. WF-104b: Rakip İçerik Scraper
9. WF-105: SERP Özellik Dedektörü
10. WF-106: İçerik Boşluğu Bulucu
11. WF-107: Fırsat Skorlayıcı
12. WF-109: Strateji Üreticisi
13. WF-110: Rapor İhracatçısı
14. Teknik Özellikler

---

## 1. Genel Bakış

SEOART Content Studio, SEO odaklı içerik stratejisi oluşturmak için geliştirilmiş kapsamlı bir otomasyon platformudur.

### Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| AI Destekli Analiz | Gemini 2.0 Flash ve OpenAI GPT-4o-mini entegrasyonu |
| Çoklu Veri Kaynağı | Google Suggest, Google Trends, Ahrefs, Serper API |
| Otomatik Skorlama | 0-100 arası fırsat skoru hesaplama |
| Pillar-Cluster Yapısı | Stratejik içerik hiyerarşisi oluşturma |
| Çoklu Format Çıktı | JSON, CSV ve HTML/PDF rapor üretimi |
| Token Takibi | API kullanım ve maliyet izleme |

---

## 2. Sistem Mimarisi

### Veritabanı Tabloları

| Tablo | Açıklama |
|-------|----------|
| keyword_projects | Proje bilgileri |
| keyword_results | Keyword verileri ve stratejileri |
| competitor_data | Rakip analiz sonuçları |
| serp_features | SERP özellik verileri |
| paa_data | People Also Ask soruları |
| api_usage_tracking | Token ve API kullanım kayıtları |

---

## 3. Analiz Süreci

Tam bir keyword araştırması ve strateji oluşturma süreci:

1. **Proje Oluşturma** — WF-101
2. **Keyword Keşfetme** — WF-101a (Google Suggest, Trends, Ahrefs)
3. **AI Keyword Filtreleme** — WF-101b (Alaka, Intent belirleme)
4. **Rakip Analizi** — WF-104 + WF-104b (SERP, Scraping)
5. **SERP Özellik Tespiti** — WF-105 (Featured Snippet, PAA)
6. **İçerik Boşluğu Analizi** — WF-106 (AI destekli)
7. **Fırsat Skorlaması** — WF-107 (0-100 skor)
8. **Strateji Oluşturma** — WF-109 (Pillar-Cluster)
9. **Rapor Üretimi** — WF-110 (JSON/CSV/HTML)

---

## 4. WF-101: Proje Oluşturucu

**Node Sayısı:** 13

**Amaç:** Yeni bir keyword araştırma projesi başlatmak

**Endpoint:** `POST /tool1/project/create`

### İşlem Adımları

1. Kullanıcıdan proje bilgilerini alır
2. Müşteri (client) kontrolü yapar
3. Veritabanında yeni proje kaydı oluşturur
4. Proje durumunu "processing" olarak ayarlar

### Parametreler

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| client_id | integer | Evet | Müşteri ID |
| project_name | string | Evet | Proje adı |
| main_keyword | string | Evet | Ana anahtar kelime |
| scenario_type | string | Hayır | seed_keyword veya topic_based |
| target_country | string | Hayır | Hedef ülke (varsayılan: TR) |

---

## 5. WF-101a: Keyword Keşfedici

**Node Sayısı:** 25

**Amaç:** Çoklu kaynaklardan alakalı keywordleri keşfetmek

**Endpoint:** `POST /webhook/keyword-discovery`

### Veri Kaynakları

| Kaynak | Tip | Maliyet |
|--------|-----|---------|
| Google Suggest | Ücretsiz | $0 |
| Google Trends | Ücretsiz | $0 |
| Ahrefs API | Ücretli | Ahrefs planı |
| AI (Gemini) | Ücretli | ~$0.001/istek |

### İşlem Adımları

1. Proje bilgilerini yükler
2. Google Suggest API'den öneriler alır
3. Google Trends tabanlı patternler üretir
4. Ahrefs API'den veri çeker (aktifse)
5. Tüm keywordleri birleştirir, tekrarları temizler
6. Veritabanına kaydeder

---

## 6. WF-101b: AI Keyword Filtresi

**Node Sayısı:** 30

**Amaç:** Keşfedilen keywordleri AI ile filtrelemek ve kategorize etmek

**Endpoint:** `POST /webhook/:projectId/filter-keywords`

### AI Analiz Kriterleri

| Search Intent | Açıklama |
|---------------|----------|
| Informational | Bilgi arama niyeti |
| Commercial | Satın alma araştırması |
| Transactional | İşlem yapma niyeti |
| Navigational | Belirli site/sayfa arama |

### İşlem Adımları

1. Projeden tüm keywordleri yükler
2. AI için kompakt CSV formatı oluşturur
3. Gemini API'ye gönderir (başarısızsa OpenAI fallback)
4. AI yanıtı parse eder
5. Keyword bilgilerini günceller
6. Token kullanımını kaydeder

---

## 7. WF-104: Rakip Analizcisi

**Node Sayısı:** 25

**Amaç:** SERP'te sıralanan rakipleri analiz etmek

**Endpoint:** `POST /webhook/:projectId/analyze-competitors`

### Toplanan Veriler

- URL ve domain bilgisi
- Sayfa başlığı ve açıklaması
- Domain Rating (DR)
- Backlink sayısı
- SERP pozisyonu

### Desteklenen API'ler

| API | Öncelik | Veri Zenginliği |
|-----|---------|-----------------|
| Ahrefs | 1 | Yüksek (DR, backlinks) |
| Serper | 2 | Orta (temel SERP) |
| Mock | 3 | Düşük (test verisi) |

---

## 8. WF-104b: Rakip İçerik Scraper

**Node Sayısı:** 16

**Amaç:** Rakip sayfaların içerik yapısını analiz etmek

**Endpoint:** `POST /webhook/tool1-competitor-scrape/:projectId/scrape`

### Çıkarılan Veriler

| Metrik | Açıklama |
|--------|----------|
| word_count | Toplam kelime sayısı |
| h1_count | H1 başlık sayısı |
| h2_count | H2 başlık sayısı |
| h3_count | H3 başlık sayısı |
| h4-h6_count | Diğer başlık sayıları |

**Önem:** Rakip içeriklerin derinliğini anlamanızı sağlar. Kendi içerik uzunluğunuzu planlamanıza yardımcı olur.

---

## 9. WF-105: SERP Özellik Dedektörü

**Node Sayısı:** 19

**Amaç:** Google SERP'teki özel özellikleri tespit etmek

**Endpoint:** `POST /webhook/tool1-serp-features/:projectId/detect`

### Tespit Edilen Özellikler

| Özellik | Açıklama |
|---------|----------|
| Featured Snippet | Öne Çıkan Sonuç |
| People Also Ask | İlgili Sorular |
| Video Results | Video Sonuçları |
| Image Pack | Resim Paketi |
| Local Pack | Yerel Sonuçlar |
| Knowledge Panel | Bilgi Paneli |

### Zero-Click Risk Seviyeleri

| Seviye | Puan | Anlamı |
|--------|------|--------|
| Low | 0-1 | Düşük risk, iyi fırsat |
| Medium | 2-3 | Orta risk |
| High | 4+ | Yüksek risk |

---

## 10. WF-106: İçerik Boşluğu Bulucu

**Node Sayısı:** 23

**Amaç:** AI ile içerik boşluklarını ve fırsatları tespit etmek

**Endpoint:** `POST /webhook/:projectId/analyze`

### AI Analiz Çıktıları

- Rakiplerin kapsamadığı konular
- Düşük rekabetli fırsatlar
- Trend potansiyeli yüksek alanlar
- Yeni keyword önerileri

### İçerik Format Önerileri

| Format | Açıklama | Uygun Intent |
|--------|----------|--------------|
| blog | Standart blog yazısı | Informational |
| guide | Detaylı rehber | Informational |
| comparison | Karşılaştırma yazısı | Commercial |
| checklist | Kontrol listesi | Informational |
| how-to | Nasıl yapılır | Informational |

---

## 11. WF-107: Fırsat Skorlayıcı

**Node Sayısı:** 26

**Amaç:** Her keyword için fırsat skoru hesaplamak

**Endpoint:** `POST /webhook/:projectId/calculate`

### Skorlama Kriterleri

| Faktör | Etkisi | Açıklama |
|--------|--------|----------|
| Search Volume | +20 puan | Yüksek hacim daha iyi |
| Keyword Difficulty | +20 puan | Düşük zorluk daha iyi |
| CPC | +10 puan | Yüksek CPC = ticari değer |
| Trend | +10 puan | Yükseliş trendi bonus |
| Competition | +15 puan | Düşük rekabet tercih |

### Öncelik Seviyeleri

| Skor | Öncelik | Aksiyon |
|------|---------|---------|
| 70-100 | High | Hemen içerik üret |
| 40-69 | Medium | Planla |
| 0-39 | Low | Ertelenebilir |

**Low Hanging Fruit (LHF):** Düşük zorluk + makul hacim = hızlı kazanım fırsatı

---

## 12. WF-109: Strateji Üreticisi

**Node Sayısı:** 25

**Amaç:** Kapsamlı içerik stratejisi ve Pillar-Cluster yapısı oluşturmak

**Endpoint:** `POST /webhook/:projectId/generate`

### Pillar-Cluster Yapısı

```
        PILLAR PAGE (Ana Rehber - 3000+ kelime)
                      |
        +-------------+-------------+
        |             |             |
    Cluster 1     Cluster 2     Cluster 3
   (1500 kelime) (1500 kelime) (1500 kelime)
```

### AI Strateji Çıktısı

| Alan | Açıklama |
|------|----------|
| page_type | pillar / cluster / standalone |
| content_format | guide / blog / comparison / how-to |
| content_priority | high / medium / low |
| recommended_word_count | Önerilen kelime sayısı |
| parent_pillar | Bağlı olduğu pillar sayfa |

---

## 13. WF-110: Rapor İhracatçısı

**Node Sayısı:** 17

**Amaç:** Proje sonuçlarını çeşitli formatlarda dışa aktarmak

**Endpoint:** `GET /webhook/:projectId/export?format=html`

### Desteklenen Formatlar

| Format | Kullanım Alanı | Çıktı |
|--------|----------------|-------|
| json | API entegrasyonu | Tam veri seti |
| csv | Excel analizi | 4 ayrı CSV dosyası |
| html | Sunum/PDF | Görsel dashboard |

### HTML Rapor İçeriği

- Genel Bakış: Keyword sayısı, Pillar/Cluster dağılımı
- Öncelik Dağılımı: High/Medium/Low grafikler
- Intent Dağılımı: Informational, Commercial vb.
- Pillar-Cluster Haritası: Hiyerarşik yapı
- Rakip Analizi: Kelime sayısı benchmarkları
- Keyword Listesi: Detaylı tablo

---

## 14. Teknik Özellikler

### AI Model Entegrasyonu

| Model | Hız | Maliyet |
|-------|-----|---------|
| Gemini 2.0 Flash (Birincil) | 2-5 saniye | ~$0.00025 / 1K token |
| OpenAI GPT-4o-mini (Yedek) | 3-8 saniye | ~$0.00015 / 1K token |

### Fallback Sistemi

1. Gemini 2.0 Flash dene
2. Başarısızsa OpenAI GPT-4o-mini dene
3. O da başarısızsa Mock/Fallback veri kullan

### Performans Metrikleri

| Metrik | Değer |
|--------|-------|
| Tam analiz süresi | 1-1.5 dakika |
| Ortalama token/analiz | 5-15K |
| Maliyet/analiz | ~$0.003-0.01 |
| Desteklenen keyword | 100+ / proje |
| Analiz edilen rakip | 10-20 / analiz |

---

**SEOART Content Studio**
AI Destekli SEO İçerik Stratejisi Platformu

*Bu doküman Aralık 2025 tarihinde oluşturulmuştur.*
