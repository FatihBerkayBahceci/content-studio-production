// =====================================================================
// SEO TOOL SUITE - COLUMN AUTO-MAPPING UTILITIES
// =====================================================================

/**
 * Column definition with header text
 */
export interface SheetColumn {
  letter: string;
  header: string;
  index: number;
}

/**
 * Mapping suggestion with confidence level
 */
export interface MappingSuggestion {
  field: string;
  column: string;
  confidence: 'high' | 'medium' | 'low';
  matchedPattern: string;
}

/**
 * Header patterns for each field
 * Ordered by priority - first match wins
 */
const HEADER_PATTERNS: Record<string, { patterns: RegExp[]; priority: number }> = {
  keyword: {
    patterns: [
      /^keyword$/i,
      /^anahtar\s*kelime$/i,
      /^query$/i,
      /^term$/i,
      /^search\s*term$/i,
      /keyword/i,
      /anahtar/i,
      /kelime/i,
    ],
    priority: 1,
  },
  search_volume: {
    patterns: [
      /^search\s*volume$/i,
      /^volume$/i,
      /^sv$/i,
      /^arama\s*hacmi$/i,
      /^hacim$/i,
      /^monthly\s*searches$/i,
      /volume/i,
      /hacim/i,
      /arama/i,
    ],
    priority: 2,
  },
  keyword_difficulty: {
    patterns: [
      /^keyword\s*difficulty$/i,
      /^difficulty$/i,
      /^kd$/i,
      /^zorluk$/i,
      /^seo\s*difficulty$/i,
      /difficulty/i,
      /zorluk/i,
    ],
    priority: 3,
  },
  cpc: {
    patterns: [
      /^cpc$/i,
      /^cost\s*per\s*click$/i,
      /^avg\.?\s*cpc$/i,
      /^tıklama\s*maliyeti$/i,
      /^maliyet$/i,
      /cpc/i,
      /cost/i,
    ],
    priority: 4,
  },
  competition: {
    patterns: [
      /^competition$/i,
      /^comp$/i,
      /^rekabet$/i,
      /^competitive$/i,
      /competition/i,
      /rekabet/i,
    ],
    priority: 5,
  },
  search_intent: {
    patterns: [
      /^search\s*intent$/i,
      /^intent$/i,
      /^arama\s*niyeti$/i,
      /^niyet$/i,
      /^user\s*intent$/i,
      /intent/i,
      /niyet/i,
    ],
    priority: 6,
  },
  opportunity_score: {
    patterns: [
      /^opportunity\s*score$/i,
      /^opportunity$/i,
      /^fırsat\s*skoru$/i,
      /^fırsat$/i,
      /^score$/i,
      /opportunity/i,
      /fırsat/i,
      /skor/i,
    ],
    priority: 7,
  },
  ai_category: {
    patterns: [
      /^ai\s*category$/i,
      /^category$/i,
      /^kategori$/i,
      /^ai\s*kategori$/i,
      /^group$/i,
      /^grup$/i,
      /category/i,
      /kategori/i,
      /grup/i,
    ],
    priority: 8,
  },
};

/**
 * Calculate match confidence based on pattern position
 */
function getConfidence(patternIndex: number, totalPatterns: number): 'high' | 'medium' | 'low' {
  const ratio = patternIndex / totalPatterns;
  if (ratio < 0.3) return 'high';
  if (ratio < 0.6) return 'medium';
  return 'low';
}

/**
 * Find best column match for a field
 */
function findBestMatch(
  field: string,
  columns: SheetColumn[],
  usedColumns: Set<string>
): MappingSuggestion | null {
  const config = HEADER_PATTERNS[field];
  if (!config) return null;

  for (let i = 0; i < config.patterns.length; i++) {
    const pattern = config.patterns[i];

    for (const col of columns) {
      // Skip already used columns
      if (usedColumns.has(col.letter)) continue;

      // Skip empty headers
      if (!col.header || !col.header.trim()) continue;

      if (pattern.test(col.header)) {
        return {
          field,
          column: col.letter,
          confidence: getConfidence(i, config.patterns.length),
          matchedPattern: pattern.source,
        };
      }
    }
  }

  return null;
}

/**
 * Suggest column mappings based on header names
 * Returns mappings and detailed suggestions
 */
export function suggestColumnMappings(columns: SheetColumn[]): {
  mappings: Record<string, string>;
  suggestions: MappingSuggestion[];
  unmappedFields: string[];
  unusedColumns: SheetColumn[];
} {
  const mappings: Record<string, string> = {};
  const suggestions: MappingSuggestion[] = [];
  const usedColumns = new Set<string>();

  // Sort fields by priority
  const sortedFields = Object.entries(HEADER_PATTERNS)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([field]) => field);

  // Try to match each field
  for (const field of sortedFields) {
    const match = findBestMatch(field, columns, usedColumns);
    if (match) {
      mappings[field] = match.column;
      suggestions.push(match);
      usedColumns.add(match.column);
    }
  }

  // Find unmapped fields
  const unmappedFields = sortedFields.filter((f) => !mappings[f]);

  // Find unused columns
  const unusedColumns = columns.filter((c) => !usedColumns.has(c.letter));

  return {
    mappings,
    suggestions,
    unmappedFields,
    unusedColumns,
  };
}

/**
 * Get simple mappings (just the Record)
 */
export function getAutoMappings(columns: SheetColumn[]): Record<string, string> {
  return suggestColumnMappings(columns).mappings;
}

/**
 * Check for duplicate column assignments
 */
export function findDuplicateMappings(mappings: Record<string, string>): {
  hasDuplicates: boolean;
  duplicates: { column: string; fields: string[] }[];
} {
  const columnToFields: Record<string, string[]> = {};

  for (const [field, column] of Object.entries(mappings)) {
    if (!column) continue;
    if (!columnToFields[column]) {
      columnToFields[column] = [];
    }
    columnToFields[column].push(field);
  }

  const duplicates = Object.entries(columnToFields)
    .filter(([, fields]) => fields.length > 1)
    .map(([column, fields]) => ({ column, fields }));

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}

/**
 * Field display names (Turkish)
 */
export const FIELD_LABELS: Record<string, string> = {
  keyword: 'Anahtar Kelime',
  search_volume: 'Arama Hacmi',
  keyword_difficulty: 'Zorluk',
  cpc: 'CPC',
  competition: 'Rekabet',
  search_intent: 'Arama Niyeti',
  opportunity_score: 'Fırsat Skoru',
  ai_category: 'AI Kategorisi',
};

/**
 * Get confidence badge color
 */
export function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'medium':
      return 'bg-amber-500/20 text-amber-400';
    case 'low':
      return 'bg-orange-500/20 text-orange-400';
  }
}

/**
 * Get confidence label
 */
export function getConfidenceLabel(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'Yüksek eşleşme';
    case 'medium':
      return 'Orta eşleşme';
    case 'low':
      return 'Düşük eşleşme';
  }
}
