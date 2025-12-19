// =====================================================================
// SEO TOOL SUITE - SHEETS CONFIG API
// =====================================================================

import type { ApiResponse } from '@seo-tool-suite/shared/types';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface SheetsConfig {
  id: number;
  client_id: number;
  config_name: string;
  spreadsheet_id: string;
  spreadsheet_url: string;
  spreadsheet_name: string | null;
  sheet_name: string;
  sheet_gid: string | null;
  start_row: number;
  column_mappings: Record<string, string>;
  include_headers: boolean;
  is_default: boolean;
  is_active: boolean;
  last_export_at: string | null;
  last_export_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSheetsConfigInput {
  config_name: string;
  spreadsheet_id: string;
  spreadsheet_url: string;
  spreadsheet_name?: string;
  sheet_name: string;
  sheet_gid?: string;
  start_row?: number;
  column_mappings: Record<string, string>;
  include_headers?: boolean;
  is_default?: boolean;
}

export interface UpdateSheetsConfigInput {
  config_name?: string;
  spreadsheet_id?: string;
  spreadsheet_url?: string;
  spreadsheet_name?: string;
  sheet_name?: string;
  sheet_gid?: string;
  start_row?: number;
  column_mappings?: Record<string, string>;
  include_headers?: boolean;
  is_default?: boolean;
}

export interface SheetsConnectResponse {
  success: boolean;
  spreadsheet_id: string;
  spreadsheet_name: string;
  sheets: { name: string; gid: string; row_count?: number }[];
  error?: string;
}

export interface SheetsColumnsResponse {
  success: boolean;
  columns: { letter: string; header: string; index: number }[];
  has_data: boolean;
  first_empty_column: string;
  error?: string;
}

export interface SheetsCheckResponse {
  success: boolean;
  has_existing_data: boolean;
  existing_row_count: number;
  first_empty_row: number;
  error?: string;
}

export interface SheetsExportResponse {
  success: boolean;
  data?: {
    rows_written: number;
    spreadsheet_url: string;
    sheet_name: string;
    write_mode: WriteMode;
  };
  message?: string;
  error?: string;
}

// ---------------------------------------------------------------------
// Advanced Write Types (5 Modes)
// ---------------------------------------------------------------------

export type WriteMode = 'replace' | 'append' | 'update_cell' | 'insert_row' | 'update_row';

export interface AdvancedWriteParams {
  spreadsheet_id: string;
  sheet_name: string;
  sheet_gid?: number;
  write_mode: WriteMode;
  column_mappings: Record<string, string>;
  data: Record<string, unknown>[];
  include_headers?: boolean;
  // For precision operations
  target_row?: number;
  target_column?: string;
  append_separator?: string;
}

export interface AdvancedWriteResponse {
  success: boolean;
  mode: WriteMode;
  rows_written?: number;
  cell?: string;
  new_value?: string;
  inserted_at_row?: number;
  updated_row?: number;
  spreadsheet_url: string;
  error?: string;
}

export interface GetCellValueResponse {
  success: boolean;
  value: string;
  cell: string;
  error?: string;
}

export interface GetRowDataResponse {
  success: boolean;
  row: number;
  values: Record<string, string>;
  error?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  spreadsheet_name: string;
  sheet_name: string;
  row_count: number;
  last_modified?: string;
  error?: string;
}

// ---------------------------------------------------------------------
// Local API Helper
// ---------------------------------------------------------------------

async function localFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  return response.json();
}

// n8n API base URL
const N8N_API_BASE = '/api/n8n';

async function n8nFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${N8N_API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  return response.json();
}

// ---------------------------------------------------------------------
// Config CRUD (Local API)
// ---------------------------------------------------------------------

/**
 * List all sheets configs for a client
 */
export async function listSheetsConfigs(
  clientId: number | string
): Promise<ApiResponse<SheetsConfig[]>> {
  return localFetch<ApiResponse<SheetsConfig[]>>(`/api/clients/${clientId}/sheets-config`);
}

/**
 * Get a single sheets config
 */
export async function getSheetsConfig(
  clientId: number | string,
  configId: number
): Promise<ApiResponse<SheetsConfig>> {
  return localFetch<ApiResponse<SheetsConfig>>(
    `/api/clients/${clientId}/sheets-config/${configId}`
  );
}

/**
 * Create a new sheets config
 */
export async function createSheetsConfig(
  clientId: number | string,
  data: CreateSheetsConfigInput
): Promise<ApiResponse<SheetsConfig>> {
  return localFetch<ApiResponse<SheetsConfig>>(`/api/clients/${clientId}/sheets-config`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a sheets config
 */
export async function updateSheetsConfig(
  clientId: number | string,
  configId: number,
  data: UpdateSheetsConfigInput
): Promise<ApiResponse<SheetsConfig>> {
  return localFetch<ApiResponse<SheetsConfig>>(
    `/api/clients/${clientId}/sheets-config/${configId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a sheets config
 */
export async function deleteSheetsConfig(
  clientId: number | string,
  configId: number
): Promise<ApiResponse<{ success: boolean }>> {
  return localFetch<ApiResponse<{ success: boolean }>>(
    `/api/clients/${clientId}/sheets-config/${configId}`,
    {
      method: 'DELETE',
    }
  );
}

// ---------------------------------------------------------------------
// n8n Operations (via proxy)
// ---------------------------------------------------------------------

/**
 * Connect to a Google Sheet and get sheet list
 */
export async function sheetsConnect(
  spreadsheetUrl: string
): Promise<SheetsConnectResponse> {
  return n8nFetch<SheetsConnectResponse>('/sheets-connect', {
    method: 'POST',
    body: JSON.stringify({ spreadsheet_url: spreadsheetUrl }),
  });
}

/**
 * Get column headers from a sheet
 */
export async function sheetsGetColumns(
  spreadsheetId: string,
  sheetName: string
): Promise<SheetsColumnsResponse> {
  return n8nFetch<SheetsColumnsResponse>('/sheets-get-columns', {
    method: 'POST',
    body: JSON.stringify({
      spreadsheet_id: spreadsheetId,
      sheet_name: sheetName,
    }),
  });
}

/**
 * Check if target columns have existing data
 */
export async function sheetsCheck(
  spreadsheetId: string,
  sheetName: string,
  columnMappings: Record<string, string>,
  startRow: number
): Promise<SheetsCheckResponse> {
  return n8nFetch<SheetsCheckResponse>('/sheets-check', {
    method: 'POST',
    body: JSON.stringify({
      spreadsheet_id: spreadsheetId,
      sheet_name: sheetName,
      column_mappings: columnMappings,
      start_row: startRow,
    }),
  });
}

/**
 * Export keywords to Google Sheets (bulk operations)
 */
export async function exportToSheets(
  projectId: string,
  configId: number,
  keywordIds: number[],
  writeMode: 'append' | 'replace'
): Promise<SheetsExportResponse> {
  return localFetch<SheetsExportResponse>(`/api/projects/${projectId}/export-sheets`, {
    method: 'POST',
    body: JSON.stringify({
      config_id: configId,
      keyword_ids: keywordIds,
      write_mode: writeMode,
    }),
  });
}

// ---------------------------------------------------------------------
// Advanced Write Operations (5 Modes)
// ---------------------------------------------------------------------

/**
 * Advanced write to Google Sheets - supports all 5 modes
 * - replace: Clear sheet and write new data
 * - append: Add rows at the end
 * - update_cell: Append text to a specific cell
 * - insert_row: Insert row at specific position
 * - update_row: Update specific row
 */
export async function sheetsAdvancedWrite(
  params: AdvancedWriteParams
): Promise<AdvancedWriteResponse> {
  return n8nFetch<AdvancedWriteResponse>('/sheets-write', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get current value of a specific cell
 */
export async function sheetsGetCellValue(
  spreadsheetId: string,
  sheetName: string,
  row: number,
  column: string
): Promise<GetCellValueResponse> {
  return n8nFetch<GetCellValueResponse>('/sheets-get-cell', {
    method: 'POST',
    body: JSON.stringify({
      spreadsheet_id: spreadsheetId,
      sheet_name: sheetName,
      row,
      column,
    }),
  });
}

/**
 * Get data from a specific row
 */
export async function sheetsGetRowData(
  spreadsheetId: string,
  sheetName: string,
  row: number,
  columnMappings: Record<string, string>
): Promise<GetRowDataResponse> {
  return n8nFetch<GetRowDataResponse>('/sheets-get-row', {
    method: 'POST',
    body: JSON.stringify({
      spreadsheet_id: spreadsheetId,
      sheet_name: sheetName,
      row,
      column_mappings: columnMappings,
    }),
  });
}

/**
 * Test connection to a Google Sheet
 * Verifies OAuth credentials and sheet accessibility
 */
export async function sheetsTestConnection(
  spreadsheetId: string,
  sheetName: string
): Promise<TestConnectionResponse> {
  return n8nFetch<TestConnectionResponse>('/sheets-test', {
    method: 'POST',
    body: JSON.stringify({
      spreadsheet_id: spreadsheetId,
      sheet_name: sheetName,
    }),
  });
}

// ---------------------------------------------------------------------
// Available Keyword Fields for Mapping
// ---------------------------------------------------------------------

export const KEYWORD_FIELDS = [
  { key: 'keyword', label: 'Anahtar Kelime', required: true },
  { key: 'search_volume', label: 'Arama Hacmi', required: false },
  { key: 'keyword_difficulty', label: 'Zorluk', required: false },
  { key: 'cpc', label: 'CPC', required: false },
  { key: 'competition', label: 'Rekabet', required: false },
  { key: 'search_intent', label: 'Arama Niyeti', required: false },
  { key: 'opportunity_score', label: 'Fırsat Skoru', required: false },
  { key: 'ai_category', label: 'AI Kategorisi', required: false },
] as const;

export type KeywordFieldKey = typeof KEYWORD_FIELDS[number]['key'];
