// =====================================================================
// SEO TOOL SUITE - n8n WEBHOOK PROXY
// Proxies requests to n8n to avoid CORS issues
// Protected with API Key + JWT authentication
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateN8nRequest } from '@/lib/auth/api-key';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5679/webhook';

// Check if auth is enabled (can be disabled for development)
const AUTH_ENABLED = process.env.N8N_AUTH_ENABLED !== 'false';

// Authenticate request
async function authenticateRequest(request: NextRequest): Promise<NextResponse | null> {
  if (!AUTH_ENABLED) return null; // Auth disabled, allow all

  const authResult = await validateN8nRequest(request);

  if (!authResult.authenticated) {
    return NextResponse.json(
      { success: false, error: authResult.error || 'Yetkilendirme gerekli' },
      { status: 401 }
    );
  }

  return null; // Authenticated, continue
}

async function proxyRequest(request: NextRequest, path: string) {
  // Include query parameters from the original request
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';
  const url = `${N8N_WEBHOOK_URL}/${path}${queryString}`;

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Build fetch options
  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  // Add body for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
    } catch {
      // No body or invalid JSON
    }
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Get response text first
    const text = await response.text();

    // Debug: log response size
    console.log(`[n8n Proxy] Response from ${path}: ${text.length} bytes`);

    // Try to parse as JSON, fallback to wrapping text
    let data;
    try {
      data = text ? JSON.parse(text) : { success: true, message: 'Empty response' };

      // n8n sometimes returns array instead of object - unwrap if needed
      if (Array.isArray(data)) {
        console.log('[n8n Proxy] Response is an array, unwrapping first element. Array length:', data.length);
        data = data[0] || { success: false, error: 'Empty array response' };
      }

      // Debug: log parsed data structure for keyword-research
      if (path.includes('keyword-research')) {
        console.log('[n8n Proxy] keyword-research response:', {
          success: data.success,
          project_id: data.project_id,
          project_uuid: data.project_uuid,
          projectUuid: data.projectUuid,
          hasKeywords: !!data.keywords,
          keywordsType: typeof data.keywords,
          keywordsIsArray: Array.isArray(data.keywords),
          keywordsLength: data.keywords?.length,
          statsTotal: data.stats?.total,
          message: data.message?.substring(0, 100),
          allKeys: Object.keys(data)
        });
      }
    } catch (parseError) {
      // If not valid JSON, wrap the text response
      console.log('[n8n Proxy] Failed to parse JSON:', parseError, 'text preview:', text.substring(0, 200));
      data = { success: response.ok, message: text || 'No response body' };
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Proxy request failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const authError = await authenticateRequest(request);
  if (authError) return authError;

  const { path } = await params;
  return proxyRequest(request, path.join('/'));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const authError = await authenticateRequest(request);
  if (authError) return authError;

  const { path } = await params;
  return proxyRequest(request, path.join('/'));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const authError = await authenticateRequest(request);
  if (authError) return authError;

  const { path } = await params;
  return proxyRequest(request, path.join('/'));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const authError = await authenticateRequest(request);
  if (authError) return authError;

  const { path } = await params;
  return proxyRequest(request, path.join('/'));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const authError = await authenticateRequest(request);
  if (authError) return authError;

  const { path } = await params;
  return proxyRequest(request, path.join('/'));
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}
