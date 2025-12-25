# Keyword Research Test Senaryoları

Bu doküman, Keyword Research modülünün tüm özelliklerini A-Z test etmek için kapsamlı test senaryolarını içerir.

---

## BÖLÜM A: SORGU SAYFASI (/keywords/agent)

### A1. Sayfa Yükleme Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A1.1 | Sayfa ilk açıldığında | Loading state gösterilmeli, sonra form görünmeli | ⬜ |
| A1.2 | Müşteri listesi yüklenme | Müşteriler dropdown'da görünmeli | ⬜ |
| A1.3 | Son projeler yüklenme | Son 6 proje kartları görünmeli | ⬜ |
| A1.4 | Müşteri yoksa | "Müşteri ekle" linki görünmeli | ⬜ |
| A1.5 | Proje yoksa | Son projeler bölümü gizli olmalı | ⬜ |

### A2. Mod Değiştirme Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A2.1 | Tekli Sorgu modu seçimi | Input alanı tek satırlık text input olmalı | ⬜ |
| A2.2 | Toplu Sorgu modu seçimi | Input alanı textarea olmalı (çok satırlı) | ⬜ |
| A2.3 | Excel butonu tıklama | Dosya seçme dialogu açılmalı | ⬜ |
| A2.4 | Mod değişince input temizleme | İçerik korunmalı | ⬜ |

### A3. Müşteri Dropdown Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A3.1 | Dropdown açma | Müşteri listesi animasyonla görünmeli | ⬜ |
| A3.2 | Müşteri seçimi | Seçilen müşteri dropdown'da görünmeli | ⬜ |
| A3.3 | Müşteri logosu görünme | Logo varsa görünmeli, yoksa baş harf | ⬜ |
| A3.4 | Müşteri domain görünme | Domain/website bilgisi görünmeli | ⬜ |
| A3.5 | Dışarı tıklama | Dropdown kapanmalı | ⬜ |
| A3.6 | Seçili müşteri işareti | Seçili müşteride ✓ işareti olmalı | ⬜ |

### A4. Keyword Input Testleri (Tekli)

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A4.1 | Boş input ile submit | Buton disabled olmalı | ⬜ |
| A4.2 | Keyword yazma | Karakter sayısı sınırı yok | ⬜ |
| A4.3 | Enter tuşu ile submit | Araştırma başlamalı | ⬜ |
| A4.4 | Placeholder görünümü | "örn: elektrikli araba" görünmeli | ⬜ |
| A4.5 | Loading sırasında input | Disabled olmalı | ⬜ |

### A5. Keyword Input Testleri (Toplu)

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A5.1 | Çoklu keyword girişi | Her satır ayrı keyword olarak sayılmalı | ⬜ |
| A5.2 | Keyword sayısı gösterimi | "X anahtar kelime" yazısı görünmeli | ⬜ |
| A5.3 | Boş satırlar | Sayıma dahil edilmemeli | ⬜ |
| A5.4 | Whitespace temizleme | Baş ve sondaki boşluklar temizlenmeli | ⬜ |
| A5.5 | 100+ keyword girişi | Performans sorunsuz olmalı | ⬜ |

### A6. Excel Import Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A6.1 | .xlsx dosya import | Keywordler textarea'ya eklenmeli | ⬜ |
| A6.2 | .xls dosya import | Keywordler textarea'ya eklenmeli | ⬜ |
| A6.3 | .csv dosya import | Keywordler textarea'ya eklenmeli | ⬜ |
| A6.4 | Başlık satırı filtreleme | "keyword", "anahtar" vb. atlanmalı | ⬜ |
| A6.5 | Duplicate temizleme | Tekrar eden keywordler kaldırılmalı | ⬜ |
| A6.6 | Import sonrası bildirim | "X keyword Excel'den içe aktarıldı" mesajı | ⬜ |
| A6.7 | Dosya adı gösterimi | Import edilen dosya adı görünmeli | ⬜ |
| A6.8 | Import iptal (X butonu) | Dosya adı ve keywordler temizlenmeli | ⬜ |
| A6.9 | Bozuk Excel dosyası | Hata mesajı gösterilmeli | ⬜ |
| A6.10 | Boş Excel dosyası | "Excel dosyasında keyword bulunamadı" | ⬜ |
| A6.11 | Çok kolonlu Excel | Tüm kolonlardan keyword çekmeli | ⬜ |
| A6.12 | Mod otomatik değişim | Bulk moduna geçmeli | ⬜ |

### A7. Dil ve Bölge Seçimi

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A7.1 | Varsayılan dil | Türkçe (tr) seçili olmalı | ⬜ |
| A7.2 | Varsayılan bölge | Türkiye (TR) seçili olmalı | ⬜ |
| A7.3 | Dil değiştirme | EN, DE, FR seçilebilmeli | ⬜ |
| A7.4 | Bölge değiştirme | US, GB, DE, FR seçilebilmeli | ⬜ |
| A7.5 | Bayrak emojileri | Her seçenekte bayrak görünmeli | ⬜ |
| A7.6 | Loading sırasında dropdown | Disabled olmalı | ⬜ |

### A8. AI Yönlendirme (Context) Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A8.1 | Varsayılan durum | Kapalı olmalı (gizli) | ⬜ |
| A8.2 | Toggle açma | Textarea animasyonla görünmeli | ⬜ |
| A8.3 | Toggle kapama | Textarea animasyonla gizlenmeli | ⬜ |
| A8.4 | Placeholder metni | Örnek yönlendirmeler görünmeli | ⬜ |
| A8.5 | Açıklama metni | Altında bilgi metni olmalı | ⬜ |
| A8.6 | Boş bırakılabilme | Opsiyonel alan, boş kalabilmeli | ⬜ |
| A8.7 | Loading sırasında | Disabled olmalı | ⬜ |

### A9. Form Validation Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A9.1 | Müşteri seçilmemiş | Buton disabled olmalı | ⬜ |
| A9.2 | Keyword boş | Buton disabled olmalı | ⬜ |
| A9.3 | Her ikisi de dolu | Buton aktif olmalı | ⬜ |
| A9.4 | Sadece boşluk keyword | Buton disabled olmalı | ⬜ |

### A10. Loading State Testleri (Tekli)

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A10.1 | Loading overlay | Karartılmış overlay görünmeli | ⬜ |
| A10.2 | Dönen animasyon | Sparkles ikonu dönmeli | ⬜ |
| A10.3 | Adım göstergesi | 6 adım olmalı | ⬜ |
| A10.4 | Adım geçişleri | Her adım metni değişmeli | ⬜ |
| A10.5 | Progress noktaları | Tamamlanan adımlar farklı renkte | ⬜ |
| A10.6 | Adım 1 | "Proje oluşturuluyor..." | ⬜ |
| A10.7 | Adım 2 | "Google Suggestions sorgulanıyor..." | ⬜ |
| A10.8 | Adım 3 | "DataForSEO ile keyword verisi çekiliyor..." | ⬜ |
| A10.9 | Adım 4 | "Keywordler birleştiriliyor..." | ⬜ |
| A10.10 | Adım 5 | "AI en iyi keywordleri seçiyor..." | ⬜ |
| A10.11 | Adım 6 | "Sonuçlar kaydediliyor..." | ⬜ |

### A11. Loading State Testleri (Toplu)

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A11.1 | Farklı adım sayısı | 6 adım (farklı metinler) | ⬜ |
| A11.2 | Adım 1 | "Bulk proje oluşturuluyor..." | ⬜ |
| A11.3 | Adım 2 | "DataForSEO bulk sorgusu yapılıyor..." | ⬜ |
| A11.4 | Adım 3 | "Google Suggestions paralel çekiliyor..." | ⬜ |
| A11.5 | Adım 4 | "Tüm keywordler birleştiriliyor..." | ⬜ |
| A11.6 | Adım 5 | "AI chunk analizi yapılıyor..." | ⬜ |
| A11.7 | Adım 6 | "Sonuçlar kaydediliyor..." | ⬜ |
| A11.8 | Daha uzun süreler | Bulk adımları daha uzun süreli | ⬜ |

### A12. API Çağrısı Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A12.1 | Tekli - endpoint | /api/n8n/keyword-research çağrılmalı | ⬜ |
| A12.2 | Toplu - endpoint | /api/n8n/keyword-research-bulk çağrılmalı | ⬜ |
| A12.3 | Request body - tekli | keyword, language, region, client_id | ⬜ |
| A12.4 | Request body - toplu | keywords[], language, region, client_id | ⬜ |
| A12.5 | AI context gönderimi | ai_context alanı gönderilmeli | ⬜ |
| A12.6 | Başarılı yanıt | Results sayfasına yönlendirme | ⬜ |
| A12.7 | Hata yanıtı | Hata mesajı gösterilmeli | ⬜ |
| A12.8 | Network hatası | Hata mesajı gösterilmeli | ⬜ |

### A13. Yönlendirme ve Bildirim Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A13.1 | Başarılı sonuç | /keywords/agent/[uuid] sayfasına git | ⬜ |
| A13.2 | Başarı bildirimi | "Araştırma tamamlandı!" toast | ⬜ |
| A13.3 | Hata bildirimi | Kırmızı toast mesajı | ⬜ |
| A13.4 | Hata kapatma | X ile hata mesajı kapanmalı | ⬜ |
| A13.5 | Toast süresi | 4 saniye sonra otomatik kapanmalı | ⬜ |

### A14. Son Projeler Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| A14.1 | Proje kartı görünümü | Keyword, müşteri, tarih, sayı görünmeli | ⬜ |
| A14.2 | Tekli proje ikonu | Mavi Search ikonu | ⬜ |
| A14.3 | Toplu proje ikonu | Mor Database ikonu | ⬜ |
| A14.4 | Proje tıklama | Results sayfasına yönlendirme | ⬜ |
| A14.5 | Hover efekti | Border rengi değişmeli | ⬜ |
| A14.6 | "Tümünü gör" linki | /projects sayfasına gitmeli | ⬜ |
| A14.7 | Maksimum 6 proje | 6'dan fazla gösterilmemeli | ⬜ |

---

## BÖLÜM B: SONUÇLAR SAYFASI (/keywords/agent/[projectId])

### B1. Sayfa Yükleme Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B1.1 | Loading spinner | Sayfa yüklenirken spinner görünmeli | ⬜ |
| B1.2 | Proje bilgisi yükleme | Header'da proje adı görünmeli | ⬜ |
| B1.3 | 4 sütun yükleme | Ana Liste, Havuz, Çöp, Negatif | ⬜ |
| B1.4 | Keyword sayıları | Her sütun sayısı doğru olmalı | ⬜ |
| B1.5 | İstatistik bar | Üst barda istatistikler görünmeli | ⬜ |
| B1.6 | Geçersiz projectId | "Proje bulunamadı" mesajı | ⬜ |
| B1.7 | Projelere dön butonu | Hata durumunda görünmeli | ⬜ |

### B2. Header Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B2.1 | Geri butonu | /projects sayfasına gitmeli | ⬜ |
| B2.2 | Proje adı | Doğru proje adı görünmeli | ⬜ |
| B2.3 | Main keyword | Hash ikonu ile görünmeli | ⬜ |
| B2.4 | Ülke bayrağı | Doğru bayrak emoji görünmeli | ⬜ |
| B2.5 | Proje tipi ikonu | Tekli: Target, Toplu: Layers | ⬜ |
| B2.6 | İstatistikler | Onaylı, Havuz, Çöp, Negatif sayıları | ⬜ |
| B2.7 | Refresh butonu | Tüm verileri yeniden yüklemeli | ⬜ |
| B2.8 | Yeni araştırma butonu | /keywords/agent sayfasına gitmeli | ⬜ |

### B3. Arama ve Filtreleme Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B3.1 | Global arama | Tüm sütunları filtrelemeli | ⬜ |
| B3.2 | Arama temizleme | X butonu ile temizlenmeli | ⬜ |
| B3.3 | Büyük/küçük harf | Case-insensitive olmalı | ⬜ |
| B3.4 | Türkçe karakterler | ş, ğ, ü, ö, ç, ı ile arama çalışmalı | ⬜ |
| B3.5 | Seed filter (bulk) | Seed dropdown görünmeli ve çalışmalı | ⬜ |
| B3.6 | Seed filter (tekli) | Seed dropdown gizli olmalı | ⬜ |
| B3.7 | Kategori filtresi | AI kategorileme sonrası çalışmalı | ⬜ |

### B4. Sütun Başlık Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B4.1 | Ana Liste ikonu | Yeşil CheckCircle2 | ⬜ |
| B4.2 | Havuz ikonu | Mavi Database | ⬜ |
| B4.3 | Çöp Kutusu ikonu | Gri Trash2 | ⬜ |
| B4.4 | Negatif ikonu | Kırmızı Ban | ⬜ |
| B4.5 | Keyword sayısı | "X keyword" formatında | ⬜ |
| B4.6 | Tümü Seç butonu | Her sütunda mevcut olmalı | ⬜ |
| B4.7 | Seçim sayısı | "X seçili" gösterilmeli | ⬜ |
| B4.8 | Seçim temizle | X butonu ile temizlenmeli | ⬜ |

### B5. Keyword Satır Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B5.1 | Keyword metni | Truncate ile gösterilmeli | ⬜ |
| B5.2 | Search volume | Sağda, 1K+ format | ⬜ |
| B5.3 | KD badge | Renk kodlu (yeşil/sarı/kırmızı) | ⬜ |
| B5.4 | Checkbox görünümü | Sol tarafta checkbox | ⬜ |
| B5.5 | Seçili durum stili | Vurgulu arka plan | ⬜ |
| B5.6 | Hover efekti | Arka plan değişmeli | ⬜ |
| B5.7 | Cursor stili | grab cursor | ⬜ |

### B6. Seçim (Selection) Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B6.1 | Tekli seçim | Tıklama ile seçim toggle | ⬜ |
| B6.2 | Çoklu seçim | Birden fazla keyword seçilebilmeli | ⬜ |
| B6.3 | Tümünü seç | Sütundaki tüm keywordler seçilmeli | ⬜ |
| B6.4 | Tümünü kaldır | Tüm seçimler kaldırılmalı | ⬜ |
| B6.5 | Seçim sayısı güncellemesi | Anlık güncellenmeli | ⬜ |
| B6.6 | Farklı sütunlardan seçim | Aynı anda seçilebilmeli | ⬜ |
| B6.7 | Total seçim sayısı | Floating bar'da toplam görünmeli | ⬜ |

### B7. Drag & Drop Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B7.1 | Tek keyword sürükleme | Overlay ile gösterilmeli | ⬜ |
| B7.2 | Çoklu sürükleme | "+X" badge gösterilmeli | ⬜ |
| B7.3 | Sütun üzerine gelme | Sütun vurgulanmalı | ⬜ |
| B7.4 | Aynı sütuna bırakma | Değişiklik olmamalı | ⬜ |
| B7.5 | Farklı sütuna bırakma | Keyword taşınmalı | ⬜ |
| B7.6 | Havuz → Ana Liste | Çalışmalı | ⬜ |
| B7.7 | Ana Liste → Havuz | Çalışmalı | ⬜ |
| B7.8 | Havuz → Çöp | Çalışmalı | ⬜ |
| B7.9 | Havuz → Negatif | Çalışmalı | ⬜ |
| B7.10 | Çöp → Ana Liste | Çalışmalı (restore) | ⬜ |
| B7.11 | Negatif → Ana Liste | Çalışmalı (restore) | ⬜ |
| B7.12 | Seçili grup sürükleme | Tüm seçililer taşınmalı | ⬜ |
| B7.13 | Drag overlay animasyonu | Smooth takip etmeli | ⬜ |
| B7.14 | API başarısız | Revert yapılmalı, hata gösterilmeli | ⬜ |
| B7.15 | Başarı bildirimi | "X keyword taşındı" mesajı | ⬜ |

### B8. Floating Action Bar Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B8.1 | Görünme koşulu | En az 1 seçim olduğunda görünmeli | ⬜ |
| B8.2 | Animasyon | Aşağıdan yukarı slide | ⬜ |
| B8.3 | Seçim sayısı | "X seçili" doğru gösterilmeli | ⬜ |
| B8.4 | Ana Liste butonu | Sadece Ana Liste'den seçim YOKSA görünmeli | ⬜ |
| B8.5 | Havuz butonu | Sadece Havuz'dan seçim YOKSA görünmeli | ⬜ |
| B8.6 | Çöp butonu | Sadece Çöp'ten seçim YOKSA görünmeli | ⬜ |
| B8.7 | Negatif butonu | Sadece Negatif'ten seçim YOKSA görünmeli | ⬜ |
| B8.8 | Kopyala butonu | Her zaman görünmeli | ⬜ |
| B8.9 | CSV İndir butonu | Her zaman görünmeli | ⬜ |
| B8.10 | Sheets butonu | Her zaman görünmeli | ⬜ |
| B8.11 | Seçimi temizle butonu | Her zaman görünmeli | ⬜ |

### B9. Quick Actions - Taşıma Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B9.1 | Ana Liste'ye taşı | Seçili keywordler taşınmalı | ⬜ |
| B9.2 | Havuz'a taşı | Seçili keywordler taşınmalı | ⬜ |
| B9.3 | Çöp'e taşı | Seçili keywordler taşınmalı | ⬜ |
| B9.4 | Negatif'e taşı | Seçili keywordler taşınmalı | ⬜ |
| B9.5 | Çoklu sütundan seçim taşıma | Hepsi hedef sütuna gitmeli | ⬜ |
| B9.6 | Optimistic update | UI anında güncellenmeli | ⬜ |
| B9.7 | API başarısız | Geri alınmalı, hata gösterilmeli | ⬜ |
| B9.8 | Seçimler temizlenme | Taşıma sonrası seçimler temizlenmeli | ⬜ |

### B10. Quick Actions - Export Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B10.1 | Kopyalama | Clipboard'a "keyword\tvolume" formatında | ⬜ |
| B10.2 | Kopyalama bildirimi | "X keyword kopyalandı" | ⬜ |
| B10.3 | CSV indirme | Dosya indirilmeli | ⬜ |
| B10.4 | CSV formatı | Keyword, Volume, KD, CPC, Intent kolonları | ⬜ |
| B10.5 | CSV dosya adı | "keywords-[proje]-[tarih].csv" | ⬜ |
| B10.6 | CSV UTF-8 BOM | Türkçe karakterler doğru görünmeli | ⬜ |
| B10.7 | Sheets modal açma | Advanced modal açılmalı | ⬜ |
| B10.8 | Seçili keywordler aktarımı | Modal'a keywordler gönderilmeli | ⬜ |

### B11. AI Kategorileme Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B11.1 | AI butonu görünümü | Havuz sütununda, kategorileme yapılmamışsa | ⬜ |
| B11.2 | AI butonu tıklama | Loading state başlamalı | ⬜ |
| B11.3 | Loading animasyonu | "Kategorileniyor..." mesajı | ⬜ |
| B11.4 | Başarılı kategorileme | Kategori dropdown görünmeli | ⬜ |
| B11.5 | Kategori listesi | Kategoriler sayılarla görünmeli | ⬜ |
| B11.6 | Kategori seçimi | Havuz filtrelenmeli | ⬜ |
| B11.7 | "Tüm Kategoriler" seçeneği | Filtreyi kaldırmalı | ⬜ |
| B11.8 | Kategori sayıları | Doğru sayılar gösterilmeli | ⬜ |
| B11.9 | API hatası | Hata bildirimi gösterilmeli | ⬜ |
| B11.10 | Mevcut kategorileme | Sayfa yüklendiğinde otomatik yüklenmeli | ⬜ |

### B12. Çöp Kutusu Özel Testler

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B12.1 | Temizle butonu | "Temizle" butonu görünmeli | ⬜ |
| B12.2 | Tümünü temizle | Tüm çöp kalıcı silinmeli | ⬜ |
| B12.3 | Seçili silme | Sadece seçili keywordler silinmeli | ⬜ |
| B12.4 | Silme bildirimi | "X keyword kalıcı olarak silindi" | ⬜ |
| B12.5 | Silme sonrası güncelleme | Liste anlık güncellenmeli | ⬜ |
| B12.6 | Boş çöp kutusu | "Çöp kutusu boş" mesajı | ⬜ |
| B12.7 | Keyword hover X butonu | Her satırda silme butonu | ⬜ |

### B13. Boş Durum Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B13.1 | Boş Ana Liste | "Onaylı keyword yok" mesajı | ⬜ |
| B13.2 | Boş Havuz | "Havuz boş" mesajı | ⬜ |
| B13.3 | Boş Çöp Kutusu | "Çöp kutusu boş" mesajı | ⬜ |
| B13.4 | Boş Negatif | "Negatif keyword yok" mesajı | ⬜ |
| B13.5 | Boş ikon görünümü | Sütun ikonu büyük görünmeli | ⬜ |

### B14. Sıralama Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B14.1 | Ana Liste sıralaması | Volume'a göre azalan | ⬜ |
| B14.2 | Havuz sıralaması | Volume'a göre azalan | ⬜ |
| B14.3 | Çöp sıralaması | Varsayılan sıra (ekleme sırası) | ⬜ |
| B14.4 | Negatif sıralaması | Alfabetik (A-Z) | ⬜ |

### B15. Duplicate Yönetimi Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B15.1 | Ana Liste'de olan → Havuz'da gizle | Duplicate gizlenmeli | ⬜ |
| B15.2 | Türkçe normalize | ş→s, ğ→g, ü→u, ö→o, ç→c, ı→i | ⬜ |
| B15.3 | Case-insensitive karşılaştırma | Büyük/küçük harf farkı yok | ⬜ |
| B15.4 | Whitespace temizleme | Boşluk farkları ihmal edilmeli | ⬜ |

### B16. Responsive/Mobile Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B16.1 | Mobile görünüm | Sütunlar dikey dizilmeli | ⬜ |
| B16.2 | Tablet görünüm | 2 sütun yan yana | ⬜ |
| B16.3 | Desktop görünüm | 4 sütun yan yana | ⬜ |
| B16.4 | Arama inputu (mobile) | Gizli olmalı (sm:block) | ⬜ |
| B16.5 | İstatistikler (mobile) | Gizli olmalı (lg:flex) | ⬜ |
| B16.6 | Floating bar (mobile) | Görünür ve kullanılabilir olmalı | ⬜ |

### B17. Bildirim (Notification) Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B17.1 | Başarı bildirimi | Yeşil toast, CheckCircle2 ikonu | ⬜ |
| B17.2 | Hata bildirimi | Kırmızı toast, AlertCircle ikonu | ⬜ |
| B17.3 | Toast pozisyonu | Üst orta (fixed) | ⬜ |
| B17.4 | Otomatik kapanma | 3 saniye sonra | ⬜ |
| B17.5 | Animasyon | Fade in/out slide | ⬜ |

### B18. Sheets Export Modal Testleri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| B18.1 | Modal açılma | Sheets butonuna tıklayınca | ⬜ |
| B18.2 | Seçili keywordler | Modal'a doğru aktarılmalı | ⬜ |
| B18.3 | Client ID | Modal'a doğru aktarılmalı | ⬜ |
| B18.4 | Modal kapama | Dışarı tıklama / X butonu | ⬜ |
| B18.5 | Export başarılı | Bildirim gösterilmeli | ⬜ |

---

## BÖLÜM C: API ENTEGRASYonları

### C1. Müşteri API'leri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| C1.1 | GET /api/clients | Müşteri listesi dönmeli | ⬜ |
| C1.2 | data.data format | API yanıt formatı doğru olmalı | ⬜ |
| C1.3 | logo_url alanı | Logo URL'i dönmeli | ⬜ |

### C2. Proje API'leri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| C2.1 | GET /api/projects | Proje listesi dönmeli | ⬜ |
| C2.2 | GET /api/projects/[id] | Tekil proje dönmeli | ⬜ |
| C2.3 | GET /api/projects/[id]/keywords | Onaylı keywordler | ⬜ |
| C2.4 | GET /api/projects/[id]/keywords-raw | Havuz keywordleri | ⬜ |
| C2.5 | GET /api/projects/[id]/keywords-trash | Çöp keywordleri | ⬜ |
| C2.6 | GET /api/projects/[id]/keywords-negative | Negatif keywordler | ⬜ |

### C3. Keyword Status API'leri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| C3.1 | PATCH bulk-status | Tekil status güncelleme | ⬜ |
| C3.2 | POST bulk-status | Çoklu status güncelleme | ⬜ |
| C3.3 | Status değerleri | approved, pending, trash, negative | ⬜ |

### C4. AI Kategorileme API'leri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| C4.1 | GET keywords-categorize | Mevcut kategorileri getir | ⬜ |
| C4.2 | POST keywords-categorize | Yeni kategorileme başlat | ⬜ |
| C4.3 | categorization_done flag | Boolean olarak dönmeli | ⬜ |
| C4.4 | categories array | Kategori listesi dönmeli | ⬜ |

### C5. N8N Workflow API'leri

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| C5.1 | POST /api/n8n/keyword-research | Tekli araştırma | ⬜ |
| C5.2 | POST /api/n8n/keyword-research-bulk | Toplu araştırma | ⬜ |
| C5.3 | project_uuid dönüşü | UUID formatında olmalı | ⬜ |
| C5.4 | Hata durumları | error mesajı dönmeli | ⬜ |

---

## BÖLÜM D: EDGE CASES & HATA DURUMLARI

### D1. Ağ Hataları

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| D1.1 | API timeout | Hata mesajı gösterilmeli | ⬜ |
| D1.2 | Network offline | Hata mesajı gösterilmeli | ⬜ |
| D1.3 | 500 server error | Hata mesajı gösterilmeli | ⬜ |
| D1.4 | 404 not found | "Proje bulunamadı" | ⬜ |
| D1.5 | 401 unauthorized | Login sayfasına yönlendirme | ⬜ |

### D2. Veri Tutarsızlıkları

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| D2.1 | Null keyword id | Satır render edilmemeli | ⬜ |
| D2.2 | Null search_volume | "-" gösterilmeli | ⬜ |
| D2.3 | Null keyword_difficulty | "-" gösterilmeli | ⬜ |
| D2.4 | Boş seed_keywords | Seed filter gizli olmalı | ⬜ |
| D2.5 | Invalid JSON seed_keywords | Boş array olarak işlenmeli | ⬜ |

### D3. Performans

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| D3.1 | 1000+ keyword | Sayfa donmamalı | ⬜ |
| D3.2 | Hızlı sürükleme | Lag olmamalı | ⬜ |
| D3.3 | Hızlı seçim | Anlık güncelleme | ⬜ |
| D3.4 | Büyük Excel import | Başarılı olmalı | ⬜ |

### D4. Concurrent İşlemler

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| D4.1 | Çift tıklama koruması | Tek istek gönderilmeli | ⬜ |
| D4.2 | Hızlı taşıma işlemleri | Doğru sırada işlenmeli | ⬜ |
| D4.3 | Sayfa yenileme sırasında işlem | Veri kaybı olmamalı | ⬜ |

---

## BÖLÜM E: KULLANICI DENEYİMİ (UX)

### E1. Animasyonlar

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| E1.1 | Page transition | Smooth fade in | ⬜ |
| E1.2 | Dropdown animation | Smooth açılma/kapanma | ⬜ |
| E1.3 | Loading overlay | Blur efekti | ⬜ |
| E1.4 | Toast notification | Slide in/out | ⬜ |
| E1.5 | Floating bar | Spring animation | ⬜ |
| E1.6 | AI context toggle | Height animation | ⬜ |
| E1.7 | Drag overlay | Smooth takip | ⬜ |

### E2. Klavye Erişilebilirliği

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| E2.1 | Tab navigasyonu | Sıralı geçiş | ⬜ |
| E2.2 | Enter ile submit | Form gönderilmeli | ⬜ |
| E2.3 | Escape ile dropdown | Kapanmalı | ⬜ |
| E2.4 | Focus visible | Focus outline görünmeli | ⬜ |

### E3. Görsel Tasarım

| # | Test Senaryosu | Beklenen Sonuç | Durum |
|---|----------------|----------------|-------|
| E3.1 | Glassmorphism arka plan | Gradient + blur | ⬜ |
| E3.2 | Renk tutarlılığı | Primary renk tutarlı | ⬜ |
| E3.3 | Ikonlar | Lucide icons tutarlı | ⬜ |
| E3.4 | Spacing | Tailwind spacing tutarlı | ⬜ |
| E3.5 | Typography | Font boyutları tutarlı | ⬜ |

---

## TEST SONUÇ ÖZETİ

| Bölüm | Toplam Test | Başarılı | Başarısız | Atlandı |
|-------|-------------|----------|-----------|---------|
| A - Sorgu Sayfası | 67 | - | - | - |
| B - Sonuçlar Sayfası | 92 | - | - | - |
| C - API Entegrasyonları | 18 | - | - | - |
| D - Edge Cases | 14 | - | - | - |
| E - Kullanıcı Deneyimi | 17 | - | - | - |
| **TOPLAM** | **208** | - | - | - |

---

## NOTLAR

- Test sırasında karşılaşılan hatalar aşağıya eklenmelidir
- Her test için ekran görüntüsü alınması önerilir
- Kritik hatalar öncelikli olarak raporlanmalıdır

### Bulunan Hatalar:

| # | Test No | Açıklama | Öncelik | Durum |
|---|---------|----------|---------|-------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
