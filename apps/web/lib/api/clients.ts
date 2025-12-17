// =====================================================================
// SEO TOOL SUITE - CLIENTS API
// =====================================================================

import { api } from './client';
import type { Client, ClientConfiguration, ApiResponse } from '@seo-tool-suite/shared/types';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface CreateClientInput {
  name: string;
  slug: string;
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
 * Includes snake_case aliases for n8n API compatibility.
 */
export interface ClientWithConfig extends Client {
  // n8n snake_case aliases
  is_active?: boolean;
  default_language?: string;
  default_country?: string;
  created_at?: string;
  updated_at?: string;

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
// API Functions
// ---------------------------------------------------------------------

/**
 * List all clients
 */
export async function listClients(): Promise<ApiResponse<Client[]>> {
  return api.get('/clients/list');
}

/**
 * Get a client by ID or UUID
 */
export async function getClient(
  clientId: string | number
): Promise<ApiResponse<ClientWithConfig>> {
  return api.get(`/clients-get/clients/${clientId}`);
}

/**
 * Create a new client
 */
export async function createClient(
  data: CreateClientInput
): Promise<ApiResponse<Client>> {
  return api.post('/clients/create', data);
}

/**
 * Update a client
 */
export async function updateClient(
  clientId: number,
  data: UpdateClientInput
): Promise<ApiResponse<Client>> {
  return api.put(`/clients-update/clients/${clientId}/update`, data);
}

/**
 * Delete a client (soft delete)
 */
export async function deleteClient(
  clientId: number
): Promise<ApiResponse<{ success: boolean }>> {
  return api.delete(`/clients-delete/clients/${clientId}`);
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
