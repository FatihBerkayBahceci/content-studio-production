// =====================================================================
// TOKEN STATISTICS HOOK
// =====================================================================

import { useQuery } from '@tanstack/react-query';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface TokenStatsSummary {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_calls: number;
  avg_input_per_call: number;
  avg_output_per_call: number;
  estimated_cost_usd: string;
}

export interface ProviderStats {
  api_provider: string;
  model_name: string;
  total_input: number;
  total_output: number;
  call_count: number;
  estimated_cost: number;
}

export interface ProjectTokenStats {
  project_id: number;
  main_keyword: string;
  total_input: number;
  total_output: number;
  total_cost: number;
  call_count: number;
}

export interface WorkflowStats {
  workflow_name: string;
  tool_name: string;
  total_input: number;
  total_output: number;
  call_count: number;
  avg_response_time: number;
}

export interface DailyStats {
  date: string;
  input_tokens: number;
  output_tokens: number;
  call_count: number;
}

export interface TokenStatsData {
  summary: TokenStatsSummary;
  by_provider: ProviderStats[];
  by_project: ProjectTokenStats[];
  by_workflow: WorkflowStats[];
  daily_trend: DailyStats[];
  pricing_info: {
    gemini_input_per_1m: number;
    gemini_output_per_1m: number;
    openai_input_per_1m: number;
    openai_output_per_1m: number;
  };
}

export interface TokenStatsResponse {
  success: boolean;
  data?: TokenStatsData;
  error?: string;
}

export interface TokenStatsParams {
  project_id?: number;
  client_id?: number;
  tool?: string;
  start_date?: string;
  end_date?: string;
}

// ---------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------

export const tokenStatsKeys = {
  all: ['tokenStats'] as const,
  stats: (params?: TokenStatsParams) => [...tokenStatsKeys.all, params] as const,
};

// ---------------------------------------------------------------------
// API Function
// ---------------------------------------------------------------------

async function fetchTokenStats(params?: TokenStatsParams): Promise<TokenStatsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.project_id) searchParams.set('project_id', params.project_id.toString());
  if (params?.client_id) searchParams.set('client_id', params.client_id.toString());
  if (params?.tool) searchParams.set('tool', params.tool);
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);

  const queryString = searchParams.toString();
  const url = `/api/token-stats${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch token stats');
  }
  return response.json();
}

// ---------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------

/**
 * Hook to fetch token usage statistics
 */
export function useTokenStats(params?: TokenStatsParams) {
  return useQuery({
    queryKey: tokenStatsKeys.stats(params),
    queryFn: () => fetchTokenStats(params),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}
