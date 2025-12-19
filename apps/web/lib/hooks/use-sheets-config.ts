// =====================================================================
// SEO TOOL SUITE - SHEETS CONFIG HOOKS
// =====================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as sheetsApi from '@/lib/api/sheets-config';

// ---------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------

export const sheetsConfigKeys = {
  all: ['sheets-config'] as const,
  list: (clientId: number | string) => [...sheetsConfigKeys.all, 'list', clientId] as const,
  detail: (clientId: number | string, configId: number) =>
    [...sheetsConfigKeys.all, 'detail', clientId, configId] as const,
};

// ---------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------

/**
 * Fetch all sheets configs for a client
 */
export function useSheetsConfigs(clientId: number | string | null) {
  return useQuery({
    queryKey: sheetsConfigKeys.list(clientId || ''),
    queryFn: () => sheetsApi.listSheetsConfigs(clientId!),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single sheets config
 */
export function useSheetsConfig(clientId: number | string | null, configId: number | null) {
  return useQuery({
    queryKey: sheetsConfigKeys.detail(clientId || '', configId || 0),
    queryFn: () => sheetsApi.getSheetsConfig(clientId!, configId!),
    enabled: !!clientId && !!configId,
  });
}

// ---------------------------------------------------------------------
// Mutation Hooks - Config CRUD
// ---------------------------------------------------------------------

/**
 * Create a new sheets config
 */
export function useCreateSheetsConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: number | string;
      data: sheetsApi.CreateSheetsConfigInput;
    }) => sheetsApi.createSheetsConfig(clientId, data),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: sheetsConfigKeys.list(clientId) });
    },
  });
}

/**
 * Update a sheets config
 */
export function useUpdateSheetsConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      configId,
      data,
    }: {
      clientId: number | string;
      configId: number;
      data: sheetsApi.UpdateSheetsConfigInput;
    }) => sheetsApi.updateSheetsConfig(clientId, configId, data),
    onSuccess: (_, { clientId, configId }) => {
      queryClient.invalidateQueries({ queryKey: sheetsConfigKeys.list(clientId) });
      queryClient.invalidateQueries({ queryKey: sheetsConfigKeys.detail(clientId, configId) });
    },
  });
}

/**
 * Delete a sheets config
 */
export function useDeleteSheetsConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      configId,
    }: {
      clientId: number | string;
      configId: number;
    }) => sheetsApi.deleteSheetsConfig(clientId, configId),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: sheetsConfigKeys.list(clientId) });
    },
  });
}

/**
 * Set a config as default
 */
export function useSetDefaultConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      configId,
    }: {
      clientId: number | string;
      configId: number;
    }) => sheetsApi.updateSheetsConfig(clientId, configId, { is_default: true }),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: sheetsConfigKeys.list(clientId) });
    },
  });
}

/**
 * Test connection to a sheet
 */
export function useTestConnection() {
  return useMutation({
    mutationFn: (params: { spreadsheetId: string; sheetName: string }) =>
      sheetsApi.sheetsTestConnection(params.spreadsheetId, params.sheetName),
  });
}

// ---------------------------------------------------------------------
// Mutation Hooks - n8n Operations
// ---------------------------------------------------------------------

/**
 * Connect to a Google Sheet
 */
export function useSheetsConnect() {
  return useMutation({
    mutationFn: (spreadsheetUrl: string) => sheetsApi.sheetsConnect(spreadsheetUrl),
  });
}

/**
 * Get column headers from a sheet
 */
export function useSheetsGetColumns() {
  return useMutation({
    mutationFn: ({
      spreadsheetId,
      sheetName,
    }: {
      spreadsheetId: string;
      sheetName: string;
    }) => sheetsApi.sheetsGetColumns(spreadsheetId, sheetName),
  });
}

/**
 * Check if target columns have existing data
 */
export function useSheetsCheck() {
  return useMutation({
    mutationFn: (params: {
      spreadsheetId: string;
      sheetName: string;
      columnMappings: Record<string, string>;
      startRow: number;
    }) =>
      sheetsApi.sheetsCheck(
        params.spreadsheetId,
        params.sheetName,
        params.columnMappings,
        params.startRow
      ),
  });
}

/**
 * Export keywords to Google Sheets (bulk operations)
 */
export function useExportToSheets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      projectId: string;
      configId: number;
      keywordIds: number[];
      writeMode: 'append' | 'replace';
    }) =>
      sheetsApi.exportToSheets(
        params.projectId,
        params.configId,
        params.keywordIds,
        params.writeMode
      ),
    onSuccess: () => {
      // Invalidate all config lists to refresh last_export info
      queryClient.invalidateQueries({ queryKey: sheetsConfigKeys.all });
    },
  });
}

// ---------------------------------------------------------------------
// Mutation Hooks - Advanced Write Operations
// ---------------------------------------------------------------------

/**
 * Advanced write to Google Sheets - supports all 5 modes
 * Modes: replace, append, update_cell, insert_row, update_row
 */
export function useAdvancedSheetsWrite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: sheetsApi.AdvancedWriteParams) =>
      sheetsApi.sheetsAdvancedWrite(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sheetsConfigKeys.all });
    },
  });
}

/**
 * Get current value of a specific cell
 * Useful for previewing before update_cell operation
 */
export function useGetCellValue() {
  return useMutation({
    mutationFn: (params: {
      spreadsheetId: string;
      sheetName: string;
      row: number;
      column: string;
    }) =>
      sheetsApi.sheetsGetCellValue(
        params.spreadsheetId,
        params.sheetName,
        params.row,
        params.column
      ),
  });
}

/**
 * Get data from a specific row
 * Useful for previewing before update_row operation
 */
export function useGetRowData() {
  return useMutation({
    mutationFn: (params: {
      spreadsheetId: string;
      sheetName: string;
      row: number;
      columnMappings: Record<string, string>;
    }) =>
      sheetsApi.sheetsGetRowData(
        params.spreadsheetId,
        params.sheetName,
        params.row,
        params.columnMappings
      ),
  });
}

// ---------------------------------------------------------------------
// Re-export types and constants
// ---------------------------------------------------------------------

export type {
  SheetsConfig,
  CreateSheetsConfigInput,
  UpdateSheetsConfigInput,
  WriteMode,
  AdvancedWriteParams,
  AdvancedWriteResponse,
  GetCellValueResponse,
  GetRowDataResponse,
} from '@/lib/api/sheets-config';

export { KEYWORD_FIELDS } from '@/lib/api/sheets-config';
