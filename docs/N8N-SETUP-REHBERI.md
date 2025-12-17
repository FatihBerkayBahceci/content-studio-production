# n8n Setup Rehberi

Bu dokümanda n8n'in SEO Tool Suite için nasıl yapılandırılacağı anlatılmaktadır.

## 1. MySQL Credential Oluşturma

n8n arayüzünde (http://localhost:5679) şu adımları izleyin:

### Adım 1: Credentials Sayfasına Git
1. Sol menüden **Settings** > **Credentials** seçin
2. **Add Credential** butonuna tıklayın
3. Arama kutusuna "MySQL" yazın ve seçin

### Adım 2: MySQL Bağlantı Bilgileri
Aşağıdaki bilgileri girin:

| Alan | Değer |
|------|-------|
| Credential Name | `SEO Suite MySQL` |
| Host | `seo-suite-mysql` (Docker network içinden) |
| Port | `3306` |
| Database | `seo_tool_suite` |
| User | `root` |
| Password | `123456` |
| SSL | Kapalı (No) |

### Adım 3: Kaydet
**Save** butonuna tıklayarak credential'ı kaydedin.

---

## 2. Workflow'ları Import Etme

Workflow JSON dosyaları `n8n/workflows/` klasöründe bulunmaktadır.

### Import Yöntemi

1. n8n arayüzünde **Workflows** sayfasına gidin
2. Sağ üstten **...** menüsü > **Import from File** seçin
3. İlgili JSON dosyasını seçin
4. Import edilen workflow'u **Save** edin
5. Workflow'u **Active** yapın

### Import Sırası

**Shared (Önce):**
1. `shared/WF-001-clients-crud.json` - Client işlemleri

**Tool 1 - Keyword Research:**
1. `tool1/WF-101-project-initializer.json` - Proje oluşturma
2. `tool1/WF-102-get-project.json` - Proje detay
3. `tool1/WF-103-list-projects.json` - Proje listesi

---

## 3. Webhook URL'leri

Import ve aktivasyon sonrası aşağıdaki endpoint'ler kullanılabilir olacak:

### Client Endpoints
```
GET  http://localhost:5679/webhook/clients/list
POST http://localhost:5679/webhook/clients/create
GET  http://localhost:5679/webhook/clients/:id
```

### Tool 1 Endpoints
```
POST http://localhost:5679/webhook/tool1/project/create
GET  http://localhost:5679/webhook/tool1/project/:id
GET  http://localhost:5679/webhook/tool1/projects
```

---

## 4. Test Etme

### Client Oluşturma Test
```bash
curl -X POST http://localhost:5679/webhook/clients/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Müşteri",
    "slug": "test-musteri",
    "domain": "https://example.com",
    "industry": "E-commerce"
  }'
```

### Client Listesi Test
```bash
curl http://localhost:5679/webhook/clients/list
```

### Keyword Projesi Oluşturma Test
```bash
curl -X POST http://localhost:5679/webhook/tool1/project/create \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "project_name": "Test Keyword Projesi",
    "main_keyword": "su deposu",
    "scenario_type": "seed_keyword"
  }'
```

---

## 5. Önemli Notlar

1. **Credential ID**: Workflow JSON'larında credential ID "1" olarak tanımlanmış. Eğer farklı bir ID ile oluşturulursa, workflow'larda güncelleme gerekebilir.

2. **Docker Network**: MySQL host olarak `seo-suite-mysql` kullanılıyor çünkü n8n ve MySQL aynı Docker network'te çalışıyor.

3. **Production'da**:
   - SSL aktif edilmeli
   - Root yerine dedicated user kullanılmalı
   - Password güçlendirilmeli

---

**Son Güncelleme:** 10 Aralık 2025
