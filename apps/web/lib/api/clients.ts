// =====================================================================
// SEO TOOL SUITE - CLIENTS API
// Uses local Next.js API routes instead of n8n proxy
// =====================================================================

import { api } from './client';
import type { Client, ClientConfiguration, ApiResponse } from '@seo-tool-suite/shared/types';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface CreateClientInput {
  name: string;
  slug?: string;
  domain?: string;
  industry?: string;
  default_language?: string;
  default_country?: string;
}

export interface UpdateClientInput {
  // Basic info
  name?: string;
  slug?: string;
  domain?: string;
  industry?: string;
  default_language?: string;
  default_country?: string;
  is_active?: boolean;

  // Content settings
  system_prompt_id?: number | null;
  tone_of_voice?: string;
  writing_style?: string;
  target_audience?: string;

  // Brand
  brand_keywords?: string[];
  forbidden_words?: string[];

  // SEO
  keyword_density_min?: number;
  keyword_density_max?: number;
  internal_links_per_1000_words?: number;

  // AI
  ai_model_preference?: string;
  ai_temperature?: number;
  enable_ai_analysis?: boolean;

  // Competitors
  competitor_domains?: string[];
  competitor_count?: number;
  cache_duration_days?: number;
  enable_ahrefs_api?: boolean;
}

/**
 * Client with configuration fields.
 * Includes snake_case aliases for API compatibility.
 */
export interface ClientWithConfig extends Client {
  // snake_case aliases
  is_active?: boolean;
  default_language?: string;
  default_country?: string;
  created_at?: string;
  updated_at?: string;
  logo_url?: string;

  // Content settings
  system_prompt_id?: number | null;
  tone_of_voice?: string;
  writing_style?: string;
  target_audience?: string;

  // Brand
  brand_keywords?: string[];
  forbidden_words?: string[];

  // SEO
  keyword_density_min?: number;
  keyword_density_max?: number;
  internal_links_per_1000_words?: number;

  // AI
  ai_model_preference?: string;
  ai_temperature?: number;
  enable_ai_analysis?: boolean;

  // Competitors
  competitor_domains?: string[];
  competitor_count?: number;
  cache_duration_days?: number;
  enable_ahrefs_api?: boolean;
}

// ---------------------------------------------------------------------
// Local API Helper (bypasses n8n proxy)
// ---------------------------------------------------------------------

async function localFetch<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  return response.json();
}

// ---------------------------------------------------------------------
// API Functions - Using Local Next.js Routes
// ---------------------------------------------------------------------

/**
 * List all clients
 */
export async function listClients(): Promise<ApiResponse<Client[]>> {
  return localFetch<Client[]>('/api/clients');
}

/**
 * Get a client by ID or UUID
 */
export async function getClient(
  clientId: string | number
): Promise<ApiResponse<ClientWithConfig>> {
  return localFetch<ClientWithConfig>(`/api/clients/${clientId}`);
}

/**
 * Create a new client
 */
export async function createClient(
  data: CreateClientInput
): Promise<ApiResponse<Client>> {
  return localFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a client
 */
export async function updateClient(
  clientId: number,
  data: UpdateClientInput
): Promise<ApiResponse<Client>> {
  return localFetch<Client>(`/api/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a client (soft delete)
 */
export async function deleteClient(
  clientId: number
): Promise<ApiResponse<{ success: boolean }>> {
  return localFetch<{ success: boolean }>(`/api/clients/${clientId}`, {
    method: 'DELETE',
  });
}

/**
 * Get client configuration
 */
export async function getClientConfig(
  clientId: number
): Promise<ApiResponse<ClientConfiguration>> {
  return api.get(`/clients/${clientId}/config`);
}

/**
 * Update client configuration
 */
export async function updateClientConfig(
  clientId: number,
  data: Partial<ClientConfiguration>
): Promise<ApiResponse<ClientConfiguration>> {
  return api.put(`/clients/${clientId}/config`, data);
}

/**
 * Get client URL inventory
 */
export async function getClientUrls(
  clientId: number,
  params?: {
    page_type?: string;
    node_role?: string;
    is_active?: boolean;
  }
): Promise<ApiResponse<any[]>> {
  return api.get(`/clients/${clientId}/urls`, { params });
}
