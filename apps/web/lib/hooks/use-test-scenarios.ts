import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface TestScenario {
  id: number;
  uuid: string;
  category: 'ui_ux' | 'backend';
  title: string;
  description: string | null;
  steps: string[];
  expected_result: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'passed' | 'failed' | 'partial' | 'skipped';
  created_by: number | null;
  created_at: string;
  updated_at: string;
  // From joins
  result_count?: number;
  latest_result_status?: string;
  latest_result_notes?: string;
  latest_result_date?: string;
  latest_tester_name?: string;
  creator_name?: string;
}

export interface TestResult {
  id: number;
  scenario_id: number;
  user_id: number;
  status: 'pending' | 'passed' | 'failed' | 'partial' | 'skipped';
  notes: string | null;
  screenshot_url: string | null;
  browser: string | null;
  device: string | null;
  created_at: string;
  tester_name?: string;
  tester_email?: string;
}

export interface TestStats {
  total: number;
  byStatus: {
    passed: number;
    failed: number;
    partial: number;
    pending: number;
    skipped: number;
  };
  byCategory: {
    ui_ux: number;
    backend: number;
  };
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentActivity: any[];
  passRate: number;
}

// Query Keys
export const testScenarioKeys = {
  all: ['test-scenarios'] as const,
  list: (filters?: { category?: string; status?: string; search?: string }) =>
    [...testScenarioKeys.all, 'list', filters] as const,
  detail: (id: string | number) => [...testScenarioKeys.all, 'detail', id] as const,
  results: (id: string | number) => [...testScenarioKeys.all, 'results', id] as const,
  stats: () => [...testScenarioKeys.all, 'stats'] as const,
};

// Fetch functions
async function fetchScenarios(filters?: { category?: string; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);

  const res = await fetch(`/api/test-scenarios?${params.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data as TestScenario[];
}

async function fetchScenario(id: string | number) {
  const res = await fetch(`/api/test-scenarios/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data as TestScenario;
}

async function fetchScenarioResults(id: string | number) {
  const res = await fetch(`/api/test-scenarios/${id}/results`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data as { results: TestResult[]; stats: any };
}

async function fetchStats() {
  const res = await fetch('/api/test-scenarios/stats');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data as TestStats;
}

// Hooks
export function useTestScenarios(filters?: { category?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: testScenarioKeys.list(filters),
    queryFn: () => fetchScenarios(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useTestScenario(id: string | number) {
  return useQuery({
    queryKey: testScenarioKeys.detail(id),
    queryFn: () => fetchScenario(id),
    enabled: !!id,
  });
}

export function useTestScenarioResults(id: string | number) {
  return useQuery({
    queryKey: testScenarioKeys.results(id),
    queryFn: () => fetchScenarioResults(id),
    enabled: !!id,
  });
}

export function useTestStats() {
  return useQuery({
    queryKey: testScenarioKeys.stats(),
    queryFn: fetchStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Mutations
export function useCreateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TestScenario>) => {
      const res = await fetch('/api/test-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      return result.data as TestScenario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testScenarioKeys.all });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<TestScenario> }) => {
      const res = await fetch(`/api/test-scenarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      return result.data as TestScenario;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: testScenarioKeys.all });
      queryClient.setQueryData(testScenarioKeys.detail(data.id), data);
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const res = await fetch(`/api/test-scenarios/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testScenarioKeys.all });
    },
  });
}

export function useSubmitTestResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scenarioId,
      data,
    }: {
      scenarioId: string | number;
      data: {
        status: string;
        notes?: string;
        screenshot_url?: string;
        browser?: string;
        device?: string;
      };
    }) => {
      const res = await fetch(`/api/test-scenarios/${scenarioId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      return result.data as TestResult;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testScenarioKeys.all });
      queryClient.invalidateQueries({ queryKey: testScenarioKeys.results(variables.scenarioId) });
    },
  });
}
