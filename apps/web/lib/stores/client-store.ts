import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client } from '@seo-tool-suite/shared/types';

interface ClientStore {
  // State
  selectedClientId: number | null;
  clients: Client[];

  // Actions
  setSelectedClient: (id: number | null) => void;
  setSelectedClientId: (id: number | null) => void; // Alias for setSelectedClient
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: number, updates: Partial<Client>) => void;
  removeClient: (id: number) => void;
  clearSelection: () => void;

  // Selectors
  getSelectedClient: () => Client | undefined;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      // Initial State
      selectedClientId: null,
      clients: [],

      // Actions
      setSelectedClient: (id) => set({ selectedClientId: id }),
      setSelectedClientId: (id) => set({ selectedClientId: id }), // Alias

      setClients: (clients) => set({ clients }),

      addClient: (client) =>
        set((state) => ({
          clients: [...state.clients, client],
        })),

      updateClient: (id, updates) =>
        set((state) => ({
          clients: state.clients.map((client) =>
            client.id === id ? { ...client, ...updates } : client
          ),
        })),

      removeClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((client) => client.id !== id),
          selectedClientId:
            state.selectedClientId === id ? null : state.selectedClientId,
        })),

      clearSelection: () => set({ selectedClientId: null }),

      // Selectors
      getSelectedClient: () => {
        const state = get();
        return state.clients.find(
          (client) => client.id === state.selectedClientId
        );
      },
    }),
    {
      name: 'seo-suite-client-store',
      partialize: (state) => ({
        selectedClientId: state.selectedClientId,
      }),
    }
  )
);
