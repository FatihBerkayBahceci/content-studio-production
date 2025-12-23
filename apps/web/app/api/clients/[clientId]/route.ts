import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface RouteParams {
  params: { clientId: string };
}

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
  created_at: string;
  updated_at: string;
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

// GET /api/clients/[clientId] - Get single client
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { clientId } = params;

    // Fetch client by ID or UUID
    const clients = await query<Client[]>(
      `SELECT id, uuid, name, slug, domain, industry, default_language, default_country, is_active, logo_url, created_at, updated_at
       FROM clients
       WHERE (id = ? OR uuid = ?) AND deleted_at IS NULL
       LIMIT 1`,
      [clientId, clientId]
    );

    if (!clients || clients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    const client = clients[0];

    // Check access permission
    if (session.user.role !== 'admin' && !canAccessClient(session.user, client.id)) {
      return NextResponse.json(
        { success: false, error: 'Bu müşteriye erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { success: false, error: 'Müşteri bilgileri alınamadı' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[clientId] - Update client
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only admins can update clients
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    const { clientId } = params;
    const body = await request.json();
    const { name, domain, industry, default_language, default_country, is_active } = body;

    // Check if client exists
    const existingClients = await query<Client[]>(
      `SELECT id FROM clients WHERE (id = ? OR uuid = ?) AND deleted_at IS NULL LIMIT 1`,
      [clientId, clientId]
    );

    if (!existingClients || existingClients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    const existingClient = existingClients[0];

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
      updates.push('slug = ?');
      values.push(createSlug(name));
    }
    if (domain !== undefined) {
      updates.push('domain = ?');
      values.push(domain || null);
    }
    if (industry !== undefined) {
      updates.push('industry = ?');
      values.push(industry || null);
    }
    if (default_language !== undefined) {
      updates.push('default_language = ?');
      values.push(default_language);
    }
    if (default_country !== undefined) {
      updates.push('default_country = ?');
      values.push(default_country);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncellenecek alan bulunamadı' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');
    values.push(existingClient.id);

    await query(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated client
    const updatedClients = await query<Client[]>(
      `SELECT id, uuid, name, slug, domain, industry, default_language, default_country, is_active, logo_url, created_at, updated_at
       FROM clients WHERE id = ?`,
      [existingClient.id]
    );

    return NextResponse.json({
      success: true,
      data: updatedClients[0],
      message: 'Müşteri başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { success: false, error: 'Müşteri güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[clientId] - Soft delete client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only admins can delete clients
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    const { clientId } = params;

    // Check if client exists
    const existingClients = await query<Client[]>(
      `SELECT id, name FROM clients WHERE (id = ? OR uuid = ?) AND deleted_at IS NULL LIMIT 1`,
      [clientId, clientId]
    );

    if (!existingClients || existingClients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    const existingClient = existingClients[0];

    // Soft delete - set deleted_at and is_active = 0
    await query(
      `UPDATE clients SET is_active = 0, deleted_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [existingClient.id]
    );

    return NextResponse.json({
      success: true,
      message: `"${existingClient.name}" müşterisi başarıyla silindi`
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { success: false, error: 'Müşteri silinemedi' },
      { status: 500 }
    );
  }
}
