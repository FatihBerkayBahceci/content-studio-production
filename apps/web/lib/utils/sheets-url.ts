// =====================================================================
// SEO TOOL SUITE - GOOGLE SHEETS URL UTILITIES
// =====================================================================

/**
 * Regex pattern to extract spreadsheet ID from Google Sheets URL
 * Supports:
 * - https://docs.google.com/spreadsheets/d/{id}/edit
 * - https://docs.google.com/spreadsheets/d/{id}/edit#gid=0
 * - https://docs.google.com/spreadsheets/d/{id}
 */
export const SHEETS_URL_REGEX = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

/**
 * Alternative patterns that might be pasted
 */
const ALTERNATIVE_PATTERNS = [
  // Mobile URL
  /^https:\/\/docs\.google\.com\/spreadsheets\/u\/\d+\/d\/([a-zA-Z0-9-_]+)/,
  // Shortened with /d/ somewhere
  /spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
];

export interface SheetsUrlValidation {
  valid: boolean;
  spreadsheetId: string | null;
  error: string | null;
  warning: string | null;
}

/**
 * Validate and extract spreadsheet ID from Google Sheets URL
 */
export function validateSheetsUrl(url: string): SheetsUrlValidation {
  // Empty check
  if (!url || !url.trim()) {
    return {
      valid: false,
      spreadsheetId: null,
      error: null,
      warning: null,
    };
  }

  const trimmedUrl = url.trim();

  // Check main pattern
  const mainMatch = trimmedUrl.match(SHEETS_URL_REGEX);
  if (mainMatch) {
    return {
      valid: true,
      spreadsheetId: mainMatch[1],
      error: null,
      warning: null,
    };
  }

  // Check alternative patterns
  for (const pattern of ALTERNATIVE_PATTERNS) {
    const altMatch = trimmedUrl.match(pattern);
    if (altMatch) {
      return {
        valid: true,
        spreadsheetId: altMatch[1],
        error: null,
        warning: 'URL formatı standart dışı, ancak geçerli görünüyor',
      };
    }
  }

  // Check if it looks like a spreadsheet ID directly (44 char alphanumeric)
  if (/^[a-zA-Z0-9-_]{40,50}$/.test(trimmedUrl)) {
    return {
      valid: true,
      spreadsheetId: trimmedUrl,
      error: null,
      warning: 'Spreadsheet ID olarak algılandı (URL değil)',
    };
  }

  // Common mistakes
  if (trimmedUrl.includes('google.com') && !trimmedUrl.includes('spreadsheets')) {
    return {
      valid: false,
      spreadsheetId: null,
      error: 'Bu bir Google Sheets URL\'si değil. Docs veya Drive linki olabilir.',
      warning: null,
    };
  }

  if (trimmedUrl.startsWith('http') && !trimmedUrl.includes('google.com')) {
    return {
      valid: false,
      spreadsheetId: null,
      error: 'Bu URL Google Sheets\'e ait değil',
      warning: null,
    };
  }

  // Generic invalid
  return {
    valid: false,
    spreadsheetId: null,
    error: 'Geçersiz Google Sheets URL formatı. Örnek: https://docs.google.com/spreadsheets/d/...',
    warning: null,
  };
}

/**
 * Extract spreadsheet ID from URL (simple version)
 */
export function extractSpreadsheetId(url: string): string | null {
  const result = validateSheetsUrl(url);
  return result.spreadsheetId;
}

/**
 * Build Google Sheets URL from spreadsheet ID
 */
export function buildSheetsUrl(spreadsheetId: string, sheetGid?: string): string {
  let url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  if (sheetGid) {
    url += `#gid=${sheetGid}`;
  }
  return url;
}

/**
 * Recent URLs storage key
 */
const RECENT_URLS_KEY = 'sheets-recent-urls';
const MAX_RECENT_URLS = 5;

/**
 * Get recent spreadsheet URLs from localStorage
 */
export function getRecentSheetsUrls(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_URLS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add URL to recent list
 */
export function addRecentSheetsUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentSheetsUrls();
    // Remove if already exists
    const filtered = recent.filter((u) => u !== url);
    // Add to front
    filtered.unshift(url);
    // Limit size
    const limited = filtered.slice(0, MAX_RECENT_URLS);
    localStorage.setItem(RECENT_URLS_KEY, JSON.stringify(limited));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Clear recent URLs
 */
export function clearRecentSheetsUrls(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_URLS_KEY);
  } catch {
    // Ignore
  }
}
