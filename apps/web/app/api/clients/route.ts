import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { filterClientsByAccess } from '@/lib/auth/permissions';
import { v4 as uuidv4 } from 'uuid';

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
  logo_url: string | null;
}

// Helper to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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
      `SELECT id, uuid, name, slug, domain, industry, default_language, default_country, is_active, logo_url
       FROM clients
       WHERE is_active = 1 AND deleted_at IS NULL
       ORDER BY id ASC`
    );

    // Filter clients based on user access
    const accessibleClients = filterClientsByAccess(session.user, allClients);

    return NextResponse.json({
      success: true,
      data: accessibleClients,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only admins can create clients
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, domain, industry, default_language, default_country } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Müşteri adı zorunludur' },
        { status: 400 }
      );
    }

    const uuid = uuidv4();
    const slug = createSlug(name);

    const result = await query(
      `INSERT INTO clients (uuid, name, slug, domain, industry, default_language, default_country, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [uuid, name.trim(), slug, domain || null, industry || null, default_language || 'tr', default_country || 'TR']
    );

    const insertId = (result as any).insertId;

    // Fetch the created client
    const clients = await query<Client[]>(
      `SELECT id, uuid, name, slug, domain, industry, default_language, default_country, is_active
       FROM clients WHERE id = ?`,
      [insertId]
    );

    return NextResponse.json({
      success: true,
      data: clients[0],
      message: 'Müşteri başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { success: false, error: 'Müşteri oluşturulamadı' },
      { status: 500 }
    );
  }
}
