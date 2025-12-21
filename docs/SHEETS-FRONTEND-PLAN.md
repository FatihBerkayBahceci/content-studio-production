# Google Sheets Frontend Entegrasyon Planı

## 1. Mod Kategorileri

### A. Toplu İşlemler (Bulk Operations)
Birden fazla keyword için kullanılır. **Mevcut SheetsExportModal** ile çalışır.

| Mod | Açıklama | Kullanım Senaryosu |
|-----|----------|-------------------|
| `replace` | Tüm sheet'i sil, baştan yaz | İlk export veya tam yenileme |
| `append` | Sona satırlar ekle | Yeni keywordleri mevcut listeye ekle |

### B. Hassas İşlemler (Precision Operations)
Belirli hücre/satır için kullanılır. **Yeni AdvancedSheetsModal** gerektirir.

| Mod | Açıklama | Kullanım Senaryosu |
|-----|----------|-------------------|
| `update_cell` | Hücreye ekleme yap | Mevcut değere ek bilgi ekle |
| `insert_row` | Araya satır ekle | Belirli pozisyona yeni satır |
| `update_row` | Satırı güncelle | Mevcut satırı düzelt |

---

## 2. Kullanıcı Akışları

### Akış 1: Toplu Export (Mevcut)
```
Keywords Tablosu → Satırları Seç → "Sheets'e Aktar" → SheetsExportModal
    ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Config Seç (otomatik default seçilir)                   │
│  2. Mevcut veri kontrolü (otomatik)                         │
│  3. Mod seç: "Mevcut verilere ekle" / "Üzerine yaz"        │
│  4. Export et                                               │
│  5. Sonuç göster + Sheet'e git linki                       │
└─────────────────────────────────────────────────────────────┘
```

### Akış 2: Hassas İşlemler (Yeni)
```
Keywords Tablosu → Sağ tık / Dropdown → "Sheets İşlemleri" → AdvancedSheetsModal
    ↓
┌─────────────────────────────────────────────────────────────┐
│  [Tab: Hücreye Ekle] [Tab: Araya Satır] [Tab: Satır Güncelle]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📍 Hedef Konum                                             │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │ Satır: [3]   │ │ Sütun: [A ▼] │ ← update_cell için      │
│  └──────────────┘ └──────────────┘                         │
│                                                             │
│  📝 Mevcut Değer                                            │
│  "keyword 2"                    ← Otomatik fetch edilir    │
│                                                             │
│  ➕ Eklenecek Değer                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ keyword 3                                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔗 Ayırıcı: [, ] (virgül + boşluk)                        │
│                                                             │
│  👁 Önizleme                                                │
│  "keyword 2, keyword 3"                                     │
│                                                             │
│             [İptal]  [Uygula]                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Bileşen Yapısı

```
components/sheets/
├── SheetsExportModal.tsx          # Mevcut - Toplu export (append/replace)
├── SheetsAdvancedModal.tsx        # YENİ - Hassas işlemler (3 tab)
├── SheetsConfigForm.tsx           # Mevcut - Config oluşturma
├── SheetsConfigList.tsx           # Mevcut - Config listesi
├── SheetsCellEditor.tsx           # YENİ - Hücre düzenleme tab içeriği
├── SheetsRowInserter.tsx          # YENİ - Satır ekleme tab içeriği
├── SheetsRowUpdater.tsx           # YENİ - Satır güncelleme tab içeriği
└── SheetsPreview.tsx              # YENİ - Sheet önizleme (opsiyonel)
```

---

## 4. API Client Güncellemeleri

### Yeni Fonksiyonlar (sheets-config.ts)

```typescript
// Mevcut sheet'ten hücre değeri al
export async function getSheetsCellValue(
  spreadsheetId: string,
  sheetName: string,
  row: number,
  column: string
): Promise<{ value: string }> {
  return n8nFetch('/sheets-get-cell', {
    method: 'POST',
    body: JSON.stringify({ spreadsheet_id: spreadsheetId, sheet_name: sheetName, row, column })
  });
}

// Gelişmiş yazma işlemi
export async function sheetsAdvancedWrite(params: {
  spreadsheetId: string;
  sheetName: string;
  sheetGid?: number;
  writeMode: 'update_cell' | 'insert_row' | 'update_row';
  targetRow: number;
  targetColumn?: string;
  appendSeparator?: string;
  columnMappings: Record<string, string>;
  data: any[];
}): Promise<{ success: boolean; message: string }> {
  return n8nFetch('/sheets-write', {
    method: 'POST',
    body: JSON.stringify({
      spreadsheet_id: params.spreadsheetId,
      sheet_name: params.sheetName,
      sheet_gid: params.sheetGid || 0,
      write_mode: params.writeMode,
      target_row: params.targetRow,
      target_column: params.targetColumn,
      append_separator: params.appendSeparator,
      column_mappings: params.columnMappings,
      data: params.data
    })
  });
}
```

---

## 5. React Query Hooks Güncellemeleri

### Yeni Hooks (use-sheets-config.ts)

```typescript
// Hücre değeri getir
export function useGetCellValue() {
  return useMutation({
    mutationFn: ({ spreadsheetId, sheetName, row, column }: {
      spreadsheetId: string;
      sheetName: string;
      row: number;
      column: string;
    }) => getSheetsCellValue(spreadsheetId, sheetName, row, column),
  });
}

// Hassas işlemler için genel hook
export function useAdvancedSheetsWrite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sheetsAdvancedWrite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sheetsConfigKeys.all });
    },
  });
}
```

---

## 6. UI/UX Detayları

### 6.1 SheetsAdvancedModal Tabs

#### Tab 1: Hücreye Ekle (update_cell)
```
┌─────────────────────────────────────────────────────────────┐
│ Config: [Varsayılan Config ▼]                               │
├─────────────────────────────────────────────────────────────┤
│ Hedef Hücre                                                 │
│ Satır: [___]  Sütun: [A ▼]                                 │
│                                                             │
│ Mevcut Değer: [Yükle] → "keyword 2"                        │
│                                                             │
│ Eklenecek:                                                  │
│ ○ Seçili keyword(ler): keyword 3, keyword 4                │
│ ○ Manuel giriş: [_______________]                          │
│                                                             │
│ Ayırıcı: [, ] ← Varsayılan virgül+boşluk                   │
│                                                             │
│ Önizleme: "keyword 2, keyword 3, keyword 4"                │
└─────────────────────────────────────────────────────────────┘
```

#### Tab 2: Araya Satır Ekle (insert_row)
```
┌─────────────────────────────────────────────────────────────┐
│ Config: [Varsayılan Config ▼]                               │
├─────────────────────────────────────────────────────────────┤
│ Hedef Pozisyon                                              │
│ Satır: [3] ← Bu satıra eklenecek, altındakiler kayacak     │
│                                                             │
│ Eklenecek Veri:                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Keyword        │ Volume │ Difficulty │                │  │
│ │ new keyword    │ 999    │ 50         │                │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ⚠️ Satır 3 ve altındaki tüm satırlar 1 aşağı kayacak      │
└─────────────────────────────────────────────────────────────┘
```

#### Tab 3: Satır Güncelle (update_row)
```
┌─────────────────────────────────────────────────────────────┐
│ Config: [Varsayılan Config ▼]                               │
├─────────────────────────────────────────────────────────────┤
│ Güncellenecek Satır                                         │
│ Satır: [3]                                                  │
│                                                             │
│ Mevcut Veri: [Yükle]                                       │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ A: keyword 2   │ B: 500   │ C: 40                     │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Yeni Veri:                                                  │
│ ○ Seçili keyword: [dropdown]                               │
│ ○ Manuel giriş                                             │
│                                                             │
│ ⚠️ Bu satır tamamen üzerine yazılacak                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Erişim Noktaları

### 7.1 Keywords Tablosu Entegrasyonu

```tsx
// Tablo satır aksiyonları
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreHorizontal />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => setShowExportModal(true)}>
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Sheets'e Aktar
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Settings className="mr-2 h-4 w-4" />
        Sheets İşlemleri
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => openAdvanced('update_cell')}>
          Hücreye Ekle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openAdvanced('insert_row')}>
          Araya Satır Ekle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openAdvanced('update_row')}>
          Satır Güncelle
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>
```

### 7.2 Bulk Actions Toolbar

```tsx
// Seçili satırlar için toolbar
{selectedKeywords.size > 0 && (
  <div className="flex gap-2 p-2 bg-muted rounded-lg">
    <span>{selectedKeywords.size} satır seçili</span>
    <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Sheets'e Aktar
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => openAdvanced('insert_row')}>
          Belirli Satıra Ekle
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)}
```

---

## 8. Hata Yönetimi

```typescript
// Error states
const errorMessages = {
  INVALID_ROW: 'Geçersiz satır numarası',
  INVALID_COLUMN: 'Geçersiz sütun harfi',
  CELL_NOT_FOUND: 'Hücre bulunamadı',
  PERMISSION_DENIED: 'Bu spreadsheet\'e erişim izniniz yok',
  SHEET_NOT_FOUND: 'Sayfa bulunamadı',
  API_ERROR: 'Google Sheets API hatası',
};

// Validation
function validateTargetRow(row: number, maxRows: number = 10000): boolean {
  return row >= 1 && row <= maxRows;
}

function validateColumnLetter(col: string): boolean {
  return /^[A-Z]{1,2}$/.test(col.toUpperCase());
}
```

---

## 9. Uygulama Öncelikleri

### Faz 1: Temel Entegrasyon
1. ✅ WF-005 v8 workflow (5 mod) - TAMAMLANDI
2. API client güncellemeleri
3. React Query hooks güncellemeleri
4. SheetsExportModal'a mod seçici ekleme (basit)

### Faz 2: Gelişmiş UI
1. SheetsAdvancedModal bileşeni
2. Tab bazlı 3 işlem modu
3. Önizleme ve hücre değeri fetch

### Faz 3: UX İyileştirmeleri
1. Sheet önizleme (mini tablo görünümü)
2. Satır/sütun autocomplete
3. Undo/redo desteği (opsiyonel)

---

## 10. Örnek Kullanım Senaryoları

### Senaryo 1: Yeni Keyword Araştırması Sonuçları
1. Kullanıcı DataForSEO'dan keyword çeker
2. Keywords tablosunda sonuçları görür
3. Tümünü seçer → "Sheets'e Aktar"
4. Config seçer → "Üzerine yaz" (replace)
5. Sheet temizlenir, yeni veriler yazılır

### Senaryo 2: Mevcut Listeye Ekleme
1. Kullanıcı yeni keyword'ler ekler
2. Sadece yeni olanları seçer
3. "Sheets'e Aktar" → "Mevcut verilere ekle" (append)
4. Yeni satırlar sona eklenir

### Senaryo 3: Belirli Keyword'e Not Ekleme
1. Kullanıcı "keyword 5" hücresine ek bilgi eklemek ister
2. İlgili satırı seçer → "Sheets İşlemleri" → "Hücreye Ekle"
3. Satır: 6, Sütun: A, Eklenecek: "long tail"
4. Sonuç: "keyword 5, long tail"

### Senaryo 4: Öncelikli Keyword Ekleme
1. Kullanıcı yeni önemli keyword'ü 2. satıra eklemek ister
2. Keyword'ü seçer → "Sheets İşlemleri" → "Araya Satır Ekle"
3. Hedef satır: 2
4. Satır 2'ye eklenir, diğerleri aşağı kayar

---

## 11. Test Senaryoları

```typescript
// Test cases
describe('SheetsAdvancedOperations', () => {
  test('update_cell: mevcut değere ekleme yapabilmeli', async () => {
    // Arrange: Hücrede "keyword 1" var
    // Act: "keyword 2" ekle, separator ", "
    // Assert: Hücre "keyword 1, keyword 2" olmalı
  });

  test('insert_row: belirtilen satıra ekleme yapmalı', async () => {
    // Arrange: 3 satır veri var
    // Act: Satır 2'ye yeni veri ekle
    // Assert: Yeni veri satır 2'de, eskisi satır 3'e kaymış
  });

  test('update_row: mevcut satırı güncellemeli', async () => {
    // Arrange: Satır 3'te "keyword old" var
    // Act: Satır 3'ü "keyword new" ile güncelle
    // Assert: Satır 3 "keyword new" olmalı, diğerleri değişmemeli
  });
});
```
