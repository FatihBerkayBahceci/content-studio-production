// =====================================================================
// SEO TOOL SUITE - CLIENTS HOOKS
// =====================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as clientsApi from '@/lib/api/clients';
import { useClientStore } from '@/lib/stores/client-store';

// ---------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------

export const clientKeys = {
  all: ['clients'] as const,
  list: () => [...clientKeys.all, 'list'] as const,
  detail: (id: string | number) => [...clientKeys.all, 'detail', id] as const,
  config: (id: number) => [...clientKeys.all, 'config', id] as const,
  urls: (id: number) => [...clientKeys.all, 'urls', id] as const,
};

// ---------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------

/**
 * Fetch all clients
 */
export function useClients() {
  const setClients = useClientStore((state) => state.setClients);

  return useQuery({
    queryKey: clientKeys.list(),
    queryFn: async () => {
      const response = await clientsApi.listClients();
      if (response.success && response.data) {
        setClients(response.data);
      }
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single client
 */
export function useClient(clientId: string | number | null) {
  return useQuery({
    queryKey: clientKeys.detail(clientId || ''),
    queryFn: () => clientsApi.getClient(clientId!),
    enabled: !!clientId,
  });
}

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const addClient = useClientStore((state) => state.addClient);

  return useMutation({
    mutationFn: clientsApi.createClient,
    onSuccess: (response) => {
      if (response.success && response.data) {
        addClient(response.data);
        queryClient.invalidateQueries({ queryKey: clientKeys.list() });
      }
    },
  });
}

/**
 * Update a client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const updateClient = useClientStore((state) => state.updateClient);

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: number;
      data: clientsApi.UpdateClientInput;
    }) => clientsApi.updateClient(clientId, data),
    onSuccess: (response, variables) => {
      if (response.success && response.data) {
        updateClient(variables.clientId, response.data);
        queryClient.invalidateQueries({ queryKey: clientKeys.list() });
        queryClient.invalidateQueries({
          queryKey: clientKeys.detail(variables.clientId),
        });
      }
    },
  });
}

/**
 * Delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const removeClient = useClientStore((state) => state.removeClient);

  return useMutation({
    mutationFn: clientsApi.deleteClient,
    onSuccess: (_, clientId) => {
      removeClient(clientId);
      queryClient.invalidateQueries({ queryKey: clientKeys.list() });
    },
  });
}

/**
 * Get client configuration
 */
export function useClientConfig(clientId: number | null) {
  return useQuery({
    queryKey: clientKeys.config(clientId || 0),
    queryFn: () => clientsApi.getClientConfig(clientId!),
    enabled: !!clientId,
  });
}

/**
 * Get client URLs
 */
export function useClientUrls(
  clientId: number | null,
  params?: Parameters<typeof clientsApi.getClientUrls>[1]
) {
  return useQuery({
    queryKey: [...clientKeys.urls(clientId || 0), params],
    queryFn: () => clientsApi.getClientUrls(clientId!, params),
    enabled: !!clientId,
  });
}
