import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface ApiKeyRecord {
  id: number;
  user_id: number | null;
  name: string;
  key_hash: string;
  scopes: string[] | null;
  is_active: boolean;
}

// Validate API key from header
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; scopes?: string[] }> {
  if (!apiKey) return { valid: false };

  // Extract prefix (first 8 chars)
  const prefix = apiKey.substring(0, 8);

  // Find API keys with matching prefix
  const keys = await query<ApiKeyRecord[]>(
    `SELECT id, user_id, name, key_hash, scopes, is_active
     FROM api_keys
     WHERE key_prefix = ? AND is_active = TRUE
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [prefix]
  );

  for (const key of keys) {
    const isValid = await bcrypt.compare(apiKey, key.key_hash);
    if (isValid) {
      // Update last used timestamp
      await query(
        `UPDATE api_keys SET last_used_at = NOW() WHERE id = ?`,
        [key.id]
      );

      const scopes = typeof key.scopes === 'string' ? JSON.parse(key.scopes) : key.scopes;
      return { valid: true, scopes: scopes || [] };
    }
  }

  return { valid: false };
}

// Check if API key has required scope
export function hasScope(scopes: string[] | undefined, requiredScope: string): boolean {
  if (!scopes) return false;
  return scopes.includes(requiredScope) || scopes.includes('*');
}

// Generate a new API key
export async function generateApiKey(userId: number | null, name: string, scopes: string[] = []): Promise<string> {
  // Generate random key
  const prefix = 'sk_' + (userId ? 'user' : 'sys') + '_';
  const randomPart = Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]
  ).join('');

  const apiKey = prefix + randomPart;
  const keyHash = await bcrypt.hash(apiKey, 10);

  await query(
    `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, scopes, is_active)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [userId, name, keyHash, prefix, JSON.stringify(scopes)]
  );

  return apiKey;
}

// Middleware to validate n8n webhook requests
export async function validateN8nRequest(request: NextRequest): Promise<{
  authenticated: boolean;
  method: 'jwt' | 'apikey' | null;
  scopes?: string[];
  error?: string;
}> {
  // Check for JWT token first
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token) {
    return {
      authenticated: true,
      method: 'jwt',
      scopes: ['*'], // JWT users have full access based on their role
    };
  }

  // Check for API key
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    const result = await validateApiKey(apiKeyHeader);
    if (result.valid) {
      return {
        authenticated: true,
        method: 'apikey',
        scopes: result.scopes,
      };
    }
    return {
      authenticated: false,
      method: null,
      error: 'Invalid API key',
    };
  }

  // Also check Authorization header for Bearer token API keys
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer sk_')) {
    const apiKey = authHeader.substring(7);
    const result = await validateApiKey(apiKey);
    if (result.valid) {
      return {
        authenticated: true,
        method: 'apikey',
        scopes: result.scopes,
      };
    }
    return {
      authenticated: false,
      method: null,
      error: 'Invalid API key',
    };
  }

  return {
    authenticated: false,
    method: null,
    error: 'No authentication provided',
  };
}

// Wrapper for n8n proxy routes
export async function withN8nAuth(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await validateN8nRequest(request);

  if (!authResult.authenticated) {
    return NextResponse.json(
      { success: false, error: authResult.error || 'Yetkilendirme gerekli' },
      { status: 401 }
    );
  }

  return handler();
}
