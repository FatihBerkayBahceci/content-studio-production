/**
 * Sheets Export User Preferences
 * Stores user preferences in localStorage for better UX
 */

const STORAGE_KEY = 'sheets-export-preferences';

interface SheetsPreferences {
  // Last used config per project
  lastUsedConfigs: Record<string, number>;
  // Default write mode preference
  defaultWriteMode: 'append' | 'replace';
  // Show preview before export
  showPreview: boolean;
  // Last export timestamps
  lastExports: Record<string, {
    configId: number;
    timestamp: number;
    rowCount: number;
  }>;
}

const DEFAULT_PREFERENCES: SheetsPreferences = {
  lastUsedConfigs: {},
  defaultWriteMode: 'append',
  showPreview: true,
  lastExports: {},
};

function getPreferences(): SheetsPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;

    return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function savePreferences(prefs: SheetsPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save sheets preferences:', e);
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * Get the last used config ID for a project
 */
export function getLastUsedConfig(projectId: string): number | null {
  const prefs = getPreferences();
  return prefs.lastUsedConfigs[projectId] || null;
}

/**
 * Set the last used config for a project
 */
export function setLastUsedConfig(projectId: string, configId: number): void {
  const prefs = getPreferences();
  prefs.lastUsedConfigs[projectId] = configId;
  savePreferences(prefs);
}

/**
 * Get the default write mode preference
 */
export function getDefaultWriteMode(): 'append' | 'replace' {
  return getPreferences().defaultWriteMode;
}

/**
 * Set the default write mode preference
 */
export function setDefaultWriteMode(mode: 'append' | 'replace'): void {
  const prefs = getPreferences();
  prefs.defaultWriteMode = mode;
  savePreferences(prefs);
}

/**
 * Get whether to show preview before export
 */
export function getShowPreview(): boolean {
  return getPreferences().showPreview;
}

/**
 * Set whether to show preview before export
 */
export function setShowPreview(show: boolean): void {
  const prefs = getPreferences();
  prefs.showPreview = show;
  savePreferences(prefs);
}

/**
 * Record a successful export
 */
export function recordExport(
  projectId: string,
  configId: number,
  rowCount: number
): void {
  const prefs = getPreferences();
  prefs.lastExports[projectId] = {
    configId,
    timestamp: Date.now(),
    rowCount,
  };
  // Also update last used config
  prefs.lastUsedConfigs[projectId] = configId;
  savePreferences(prefs);
}

/**
 * Get last export info for a project
 */
export function getLastExport(projectId: string): {
  configId: number;
  timestamp: number;
  rowCount: number;
} | null {
  const prefs = getPreferences();
  return prefs.lastExports[projectId] || null;
}

/**
 * Clear all preferences
 */
export function clearPreferences(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
