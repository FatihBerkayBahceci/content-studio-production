// =====================================================================
// SEO TOOL SUITE - ZOD VALIDATION SCHEMAS
// =====================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------
// Common Validators
// ---------------------------------------------------------------------

export const projectStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

export const toneOfVoiceSchema = z.enum(['formal', 'casual', 'professional', 'friendly', 'technical']);

export const aiModelSchema = z.enum(['gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet', 'gemini-pro']);

// ---------------------------------------------------------------------
// Client Validators
// ---------------------------------------------------------------------

export const createClientSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  domain: z.string().url().optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  defaultLanguage: z.string().length(2).default('tr'),
  defaultCountry: z.string().length(2).default('TR'),
});

export const updateClientSchema = createClientSchema.partial();

export const clientConfigurationSchema = z.object({
  toneOfVoice: toneOfVoiceSchema.default('professional'),
  brandKeywords: z.array(z.string()).default([]),
  forbiddenWords: z.array(z.string()).default([]),
  competitorDomains: z.array(z.string().url()).default([]),
  keywordDensityMin: z.number().min(0).max(5).default(0.5),
  keywordDensityMax: z.number().min(0).max(5).default(2.5),
  internalLinksPerThousandWords: z.number().min(0).max(20).default(3),
  externalLinksPerThousandWords: z.number().min(0).max(10).default(1),
  aiModelPreference: aiModelSchema.default('gpt-4'),
  aiTemperature: z.number().min(0).max(1).default(0.7),
});

// ---------------------------------------------------------------------
// Tool 1: Keyword Research Validators
// ---------------------------------------------------------------------

export const keywordScenarioTypeSchema = z.enum(['seed_keyword', 'topic_based']);

export const searchIntentSchema = z.enum(['informational', 'commercial', 'transactional', 'navigational']);

export const createKeywordProjectSchema = z.object({
  clientId: z.number().int().positive(),
  projectName: z.string().min(1).max(200),
  mainKeyword: z.string().min(1).max(200),
  scenarioType: keywordScenarioTypeSchema,
  targetCountry: z.string().length(2).default('TR'),
  targetLanguage: z.string().length(2).default('tr'),
});

// ---------------------------------------------------------------------
// Tool 2: Content Studio Validators
// ---------------------------------------------------------------------

export const contentScenarioTypeSchema = z.enum(['content_exists', 'content_generate']);

export const contentTypeSchema = z.enum([
  'blog_post',
  'landing_page',
  'product_page',
  'category_page',
  'guide',
  'comparison',
  'listicle',
  'how_to',
]);

export const schemaTypeSchema = z.enum([
  'Article',
  'BlogPosting',
  'HowTo',
  'FAQPage',
  'Product',
  'LocalBusiness',
  'Organization',
  'WebPage',
  'BreadcrumbList',
]);

export const createContentProjectSchema = z.object({
  clientId: z.number().int().positive(),
  sourceKeywordProjectId: z.number().int().positive().optional().nullable(),
  projectName: z.string().min(1).max(200),
  targetKeyword: z.string().min(1).max(200),
  scenarioType: contentScenarioTypeSchema,
  contentType: contentTypeSchema,
  targetWordCount: z.number().int().min(100).max(20000).optional().nullable(),
});

// ---------------------------------------------------------------------
// Tool 3: Internal Linking Validators
// ---------------------------------------------------------------------

export const linkingScenarioTypeSchema = z.enum(['keyword_cluster', 'topic_based', 'url_sitemap']);

export const equityFlowModelSchema = z.enum(['top_down', 'bottom_up', 'lateral', 'mixed']);

export const nodeRoleSchema = z.enum(['pillar', 'hub', 'cluster', 'money_page', 'booster', 'bridge']);

export const anchorTypeSchema = z.enum(['exact_match', 'partial_match', 'branded', 'semantic', 'generic', 'naked_url']);

export const linkDirectionSchema = z.enum(['top_down', 'bottom_up', 'lateral']);

export const createLinkingProjectSchema = z.object({
  clientId: z.number().int().positive(),
  sourceContentProjectId: z.number().int().positive().optional().nullable(),
  sourceKeywordProjectId: z.number().int().positive().optional().nullable(),
  projectName: z.string().min(1).max(200),
  scenarioType: linkingScenarioTypeSchema,
  equityFlowModel: equityFlowModelSchema.default('mixed'),
  maxLinksPerPage: z.number().int().min(1).max(50).default(10),
});

export const approveLinkSuggestionSchema = z.object({
  suggestionId: z.number().int().positive(),
  approved: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
});

// ---------------------------------------------------------------------
// URL Inventory Validators
// ---------------------------------------------------------------------

export const pageTypeSchema = z.enum(['homepage', 'category', 'product', 'blog', 'landing', 'other']);

export const addUrlToInventorySchema = z.object({
  clientId: z.number().int().positive(),
  url: z.string().url(),
  pageTitle: z.string().max(200).optional().nullable(),
  pageType: pageTypeSchema.default('other'),
  nodeRole: nodeRoleSchema.optional().nullable(),
  primaryKeyword: z.string().max(200).optional().nullable(),
});

// ---------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientConfigurationInput = z.infer<typeof clientConfigurationSchema>;
export type CreateKeywordProjectInput = z.infer<typeof createKeywordProjectSchema>;
export type CreateContentProjectInput = z.infer<typeof createContentProjectSchema>;
export type CreateLinkingProjectInput = z.infer<typeof createLinkingProjectSchema>;
export type ApproveLinkSuggestionInput = z.infer<typeof approveLinkSuggestionSchema>;
export type AddUrlToInventoryInput = z.infer<typeof addUrlToInventorySchema>;
