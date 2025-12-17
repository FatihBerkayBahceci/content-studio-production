import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { filterClientsByAccess } from '@/lib/auth/permissions';

interface Client {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  domain: string | null;
  industry: string | null;
  default_language: string;
  default_country: string;
  is_active: boolean;
}

// GET /api/clients - List all active clients (filtered by user access)
export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const allClients = await query<Client[]>(
      `SELECT id, uuid, name, slug, domain, industry, default_language, default_country, is_active
       FROM clients
       WHERE is_active = 1 AND deleted_at IS NULL
       ORDER BY name ASC`
    );

    // Filter clients based on user access
    const accessibleClients = filterClientsByAccess(session.user, allClients);

    return NextResponse.json({
      success: true,
      clients: accessibleClients,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
