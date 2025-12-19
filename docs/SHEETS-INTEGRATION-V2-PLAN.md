# Sheets Integration V2 - Comprehensive Improvement Plan

## Executive Summary

Bu plan, mevcut Google Sheets entegrasyonunu kapsamlı şekilde geliştirerek kullanıcı deneyimini iyileştirmeyi, yeni özellikler eklemeyi ve sistem güvenilirliğini artırmayı hedeflemektedir.

---

## Current Architecture Analysis

### Existing Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐    ┌─────────────────────┐                     │
│  │  clients/[id]/page  │    │  keywords/[id]/page │                     │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │                     │
│  │  │ SheetsConfig  │  │    │  │ SheetsExport  │  │                     │
│  │  │    Form       │  │    │  │    Modal      │  │                     │
│  │  └───────────────┘  │    │  └───────────────┘  │                     │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │                     │
│  │  │ SheetsConfig  │  │    │  │ SheetsAdvanced│  │                     │
│  │  │    List       │  │    │  │    Modal      │  │                     │
│  │  └───────────────┘  │    │  └───────────────┘  │                     │
│  └─────────────────────┘    └─────────────────────┘                     │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                           API Layer                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │ /api/clients/  │  │ /api/projects/ │  │   /api/n8n/    │             │
│  │ sheets-config  │  │  export-sheets │  │  sheets-*      │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                         n8n Workflows                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ WF-002   │ │ WF-003   │ │ WF-004   │ │ WF-005   │ │ WF-006/7 │      │
│  │ Connect  │ │ Columns  │ │ Check    │ │ Write    │ │ Get Cell │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Current Data Flow

```
1. Config Creation:
   User → SheetsConfigForm → n8n/sheets-connect → Google Sheets API
                          → n8n/sheets-get-columns → Column headers
                          → Local API → Database (sheets_config table)

2. Export Flow:
   User → SheetsExportModal → /api/projects/export-sheets → n8n/sheets-write
                                                          → Google Sheets

3. Advanced Operations:
   User → SheetsAdvancedModal → /api/n8n/sheets-write → n8n workflow
                              → /api/n8n/sheets-get-cell (preview)
                              → /api/n8n/sheets-get-row (preview)
```

---

## Phase 1: Critical UX Improvements

### 1.1 Real-time URL Validation

**Current:** URL validation only happens on connect attempt
**Target:** Instant validation as user types

```typescript
// New utility: lib/utils/sheets-url.ts
export const SHEETS_URL_REGEX = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

export function validateSheetsUrl(url: string): {
  valid: boolean;
  spreadsheetId: string | null;
  error: string | null;
} {
  if (!url) return { valid: false, spreadsheetId: null, error: null };

  const match = url.match(SHEETS_URL_REGEX);
  if (!match) {
    return {
      valid: false,
      spreadsheetId: null,
      error: 'Geçersiz Google Sheets URL formatı'
    };
  }

  return { valid: true, spreadsheetId: match[1], error: null };
}
```

**UI Enhancement:**
- Green check icon when valid
- Red warning with message when invalid
- Paste from clipboard button
- Recent URLs dropdown (localStorage)

### 1.2 Column Auto-Mapping

**Current:** Manual selection for each field
**Target:** Smart auto-suggest based on header names

```typescript
// New utility: lib/utils/column-matcher.ts
const HEADER_PATTERNS: Record<string, RegExp[]> = {
  keyword: [/keyword/i, /anahtar/i, /kelime/i, /query/i, /term/i],
  search_volume: [/volume/i, /hacim/i, /search/i, /arama/i, /sv/i],
  keyword_difficulty: [/difficulty/i, /zorluk/i, /kd/i, /hard/i],
  cpc: [/cpc/i, /cost/i, /maliyet/i, /tıklama/i],
  competition: [/competition/i, /rekabet/i, /comp/i],
  search_intent: [/intent/i, /niyet/i, /amaç/i],
  opportunity_score: [/opportunity/i, /fırsat/i, /score/i, /skor/i],
  ai_category: [/category/i, /kategori/i, /ai/i, /grup/i],
};

export function suggestColumnMappings(
  columns: { letter: string; header: string }[]
): Record<string, string> {
  const suggestions: Record<string, string> = {};

  for (const [field, patterns] of Object.entries(HEADER_PATTERNS)) {
    for (const col of columns) {
      if (patterns.some(p => p.test(col.header))) {
        suggestions[field] = col.letter;
        break;
      }
    }
  }

  return suggestions;
}
```

**UI Enhancement:**
- "🪄 Otomatik Eşleştir" button
- Confidence indicators (high/medium/low match)
- One-click accept all suggestions
- Manual override always available

### 1.3 Set Default from Config List

**Current:** Can only set default during create/edit
**Target:** Quick toggle in list view

```typescript
// New hook addition: lib/hooks/use-sheets-config.ts
export function useSetDefaultConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, configId }: { clientId: number; configId: number }) =>
      localFetch(`/api/clients/${clientId}/sheets-config/${configId}/set-default`, {
        method: 'PUT',
      }),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: sheetsConfigKeys.list(clientId) });
    },
  });
}
```

**New API Endpoint:**
```
PUT /api/clients/[clientId]/sheets-config/[configId]/set-default
```

### 1.4 Connection Test Button

**Current:** No way to verify connection after creation
**Target:** Test button in config list

```typescript
// New hook: useTestConnection
export function useTestConnection() {
  return useMutation({
    mutationFn: (params: { spreadsheetId: string; sheetName: string }) =>
      n8nFetch('/sheets-test', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
}
```

**New n8n Workflow: WF-008-Sheets-Test**
- Validates OAuth credentials still valid
- Checks sheet still exists
- Returns row count and last modified date

---

## Phase 2: Enhanced User Experience

### 2.1 Export Preview

**Current:** Direct export without preview
**Target:** Show data before sending

**New Component: SheetsExportPreview**
```typescript
interface ExportPreviewProps {
  keywords: KeywordData[];
  columnMappings: Record<string, string>;
  onConfirm: () => void;
  onCancel: () => void;
}

// Shows:
// - Table preview with mapped columns
// - Row count summary
// - Estimated cells to be written
// - Warning for existing data (replace mode)
```

### 2.2 Sync History & Logs

**Database Schema Addition:**
```sql
CREATE TABLE sheets_sync_logs (
  id SERIAL PRIMARY KEY,
  config_id INTEGER REFERENCES sheets_config(id),
  operation_type VARCHAR(50), -- 'export', 'update_cell', 'insert_row', etc.
  status VARCHAR(20), -- 'success', 'failed', 'partial'
  rows_affected INTEGER,
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**New Component: SheetsSyncHistory**
- Last 20 operations with status
- Filter by operation type
- Retry failed operations
- Export log as CSV

### 2.3 Config Duplicate Feature

**UI Enhancement in SheetsConfigList:**
- "Kopyala" button in dropdown menu
- Opens form with pre-filled data
- Auto-appends "(Copy)" to name

### 2.4 Column Mapping Collision Detection

**Current:** Same column can be assigned to multiple fields
**Target:** Warning/prevention

```typescript
// In SheetsConfigForm
const usedColumns = Object.values(columnMappings);
const hasDuplicates = usedColumns.length !== new Set(usedColumns).size;

// Show warning badge next to duplicated columns
// Prevent save with duplicates
```

---

## Phase 3: Advanced Features

### 3.1 Quick Config from Keywords Page

**New Button in SheetsExportModal:**
"Yeni Konfigürasyon Ekle" when no configs exist or user wants new one

**Implementation:**
- Mini wizard modal (3 steps instead of 4)
- Inline in export flow
- Auto-selects after creation

### 3.2 Scheduled Sync

**Database Schema:**
```sql
ALTER TABLE sheets_config ADD COLUMN sync_schedule VARCHAR(50); -- cron format
ALTER TABLE sheets_config ADD COLUMN last_scheduled_sync TIMESTAMP;
ALTER TABLE sheets_config ADD COLUMN next_scheduled_sync TIMESTAMP;
```

**New n8n Workflow: WF-009-Scheduled-Sync**
- Cron trigger
- Fetches pending syncs from database
- Processes each config
- Updates sync timestamps

**UI:**
- Toggle "Otomatik Senkronizasyon"
- Frequency selector (hourly, daily, weekly)
- Time picker for daily/weekly

### 3.3 Bidirectional Sync (Read from Sheets)

**New n8n Workflow: WF-010-Sheets-Read-All**
- Reads entire sheet data
- Returns as JSON array

**Use Cases:**
- Import keywords from existing sheet
- Sync content updates back to database
- Sheet as source of truth option

### 3.4 Bulk Actions

**Config List:**
- Checkbox selection
- Bulk delete
- Bulk export (all configs to their sheets)

**Keywords Page:**
- Multi-config export (send to multiple sheets at once)

### 3.5 Webhook Notifications

**Database Schema:**
```sql
ALTER TABLE sheets_config ADD COLUMN notify_webhook_url TEXT;
ALTER TABLE sheets_config ADD COLUMN notify_on_success BOOLEAN DEFAULT false;
ALTER TABLE sheets_config ADD COLUMN notify_on_failure BOOLEAN DEFAULT true;
```

**Notification Payload:**
```json
{
  "event": "sheets_sync_complete",
  "status": "success",
  "config_name": "Main Keywords",
  "rows_written": 150,
  "spreadsheet_url": "https://...",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## Implementation Roadmap

### Sprint 1 (Phase 1) - Critical UX
| Task | Effort | Priority |
|------|--------|----------|
| URL validation utility | 1h | P0 |
| Column auto-mapping | 2h | P0 |
| Set default API & UI | 2h | P0 |
| Connection test workflow | 2h | P0 |
| Connection test UI | 1h | P0 |

### Sprint 2 (Phase 2) - Enhanced UX
| Task | Effort | Priority |
|------|--------|----------|
| Export preview component | 3h | P1 |
| Sync logs database schema | 1h | P1 |
| Sync logs API endpoints | 2h | P1 |
| SheetsSyncHistory component | 2h | P1 |
| Config duplicate feature | 1h | P1 |
| Column collision detection | 1h | P1 |

### Sprint 3 (Phase 3) - Advanced
| Task | Effort | Priority |
|------|--------|----------|
| Quick config from keywords | 3h | P2 |
| Scheduled sync schema | 1h | P2 |
| Scheduled sync workflow | 3h | P2 |
| Scheduled sync UI | 2h | P2 |
| Bidirectional sync workflow | 3h | P2 |
| Bidirectional sync UI | 2h | P2 |
| Bulk actions | 3h | P2 |
| Webhook notifications | 2h | P2 |

---

## File Structure After Implementation

```
apps/web/
├── lib/
│   ├── utils/
│   │   ├── sheets-url.ts          # NEW: URL validation
│   │   └── column-matcher.ts      # NEW: Auto-mapping
│   ├── api/
│   │   └── sheets-config.ts       # UPDATED: New endpoints
│   └── hooks/
│       └── use-sheets-config.ts   # UPDATED: New hooks
├── components/
│   └── sheets/
│       ├── index.ts               # UPDATED: Export new components
│       ├── SheetsConfigForm.tsx   # UPDATED: Auto-mapping, validation
│       ├── SheetsConfigList.tsx   # UPDATED: Set default, test, duplicate
│       ├── SheetsExportModal.tsx  # UPDATED: Preview step
│       ├── SheetsAdvancedModal.tsx
│       ├── SheetsExportPreview.tsx    # NEW
│       ├── SheetsSyncHistory.tsx      # NEW
│       ├── SheetsQuickConfig.tsx      # NEW
│       └── SheetsScheduleConfig.tsx   # NEW
└── app/
    ├── api/
    │   └── clients/
    │       └── [clientId]/
    │           └── sheets-config/
    │               └── [configId]/
    │                   └── set-default/
    │                       └── route.ts  # NEW
    └── clients/
        └── [clientId]/
            └── page.tsx           # UPDATED: New tabs

n8n/workflows/
├── WF-008-Sheets-Test.json        # NEW
├── WF-009-Scheduled-Sync.json     # NEW
└── WF-010-Sheets-Read-All.json    # NEW
```

---

## Migration Notes

### Database Migrations Required
1. `sheets_sync_logs` table creation
2. `sheets_config` column additions for scheduling
3. `sheets_config` column additions for notifications

### Breaking Changes
None - all changes are additive

### Rollback Plan
Each phase can be rolled back independently by:
1. Reverting frontend changes
2. Keeping database columns (nullable)
3. Deactivating new n8n workflows

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Config creation time | ~2 min | <30 sec |
| Export error rate | Unknown | <5% |
| User confusion reports | N/A | 0 |
| Feature adoption | N/A | 80% within 1 week |

---

## Next Steps

1. Review and approve plan
2. Start Phase 1 implementation
3. User testing after each phase
4. Iterate based on feedback
