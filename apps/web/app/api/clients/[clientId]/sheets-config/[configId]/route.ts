import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface RouteParams {
  params: { clientId: string; configId: string };
}

interface SheetsConfig {
  id: number;
  client_id: number;
  config_name: string;
  spreadsheet_id: string;
  spreadsheet_url: string;
  spreadsheet_name: string | null;
  sheet_name: string;
  sheet_gid: string | null;
  start_row: number;
  column_mappings: Record<string, string>;
  include_headers: boolean;
  is_default: boolean;
  is_active: boolean;
  last_export_at: string | null;
  last_export_count: number | null;
  created_at: string;
  updated_at: string;
}

// Helper to parse config
function parseConfig(config: SheetsConfig): SheetsConfig {
  return {
    ...config,
    column_mappings: typeof config.column_mappings === 'string'
      ? JSON.parse(config.column_mappings)
      : config.column_mappings,
    include_headers: Boolean(config.include_headers),
    is_default: Boolean(config.is_default),
    is_active: Boolean(config.is_active),
  };
}

// GET /api/clients/[clientId]/sheets-config/[configId] - Get single config
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { clientId, configId } = params;

    // Get client ID
    const clients = await query<{ id: number }[]>(
      `SELECT id FROM clients WHERE (id = ? OR uuid = ?) AND deleted_at IS NULL LIMIT 1`,
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

    // Fetch config
    const configs = await query<SheetsConfig[]>(
      `SELECT * FROM client_sheets_config WHERE id = ? AND client_id = ? AND is_active = 1`,
      [configId, client.id]
    );

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Konfigürasyon bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parseConfig(configs[0]),
    });
  } catch (error) {
    console.error('Error fetching sheets config:', error);
    return NextResponse.json(
      { success: false, error: 'Konfigürasyon alınamadı' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[clientId]/sheets-config/[configId] - Update config
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { clientId, configId } = params;

    // Get client ID
    const clients = await query<{ id: number }[]>(
      `SELECT id FROM clients WHERE (id = ? OR uuid = ?) AND deleted_at IS NULL LIMIT 1`,
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

    // Check if config exists
    const existingConfigs = await query<SheetsConfig[]>(
      `SELECT * FROM client_sheets_config WHERE id = ? AND client_id = ? AND is_active = 1`,
      [configId, client.id]
    );

    if (!existingConfigs || existingConfigs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Konfigürasyon bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      config_name,
      spreadsheet_id,
      spreadsheet_url,
      spreadsheet_name,
      sheet_name,
      sheet_gid,
      start_row,
      column_mappings,
      include_headers,
      is_default,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (config_name !== undefined) {
      updates.push('config_name = ?');
      values.push(config_name);
    }
    if (spreadsheet_id !== undefined) {
      updates.push('spreadsheet_id = ?');
      values.push(spreadsheet_id);
    }
    if (spreadsheet_url !== undefined) {
      updates.push('spreadsheet_url = ?');
      values.push(spreadsheet_url);
    }
    if (spreadsheet_name !== undefined) {
      updates.push('spreadsheet_name = ?');
      values.push(spreadsheet_name);
    }
    if (sheet_name !== undefined) {
      updates.push('sheet_name = ?');
      values.push(sheet_name);
    }
    if (sheet_gid !== undefined) {
      updates.push('sheet_gid = ?');
      values.push(sheet_gid);
    }
    if (start_row !== undefined) {
      updates.push('start_row = ?');
      values.push(start_row);
    }
    if (column_mappings !== undefined) {
      updates.push('column_mappings = ?');
      values.push(JSON.stringify(column_mappings));
    }
    if (include_headers !== undefined) {
      updates.push('include_headers = ?');
      values.push(include_headers ? 1 : 0);
    }
    if (is_default !== undefined) {
      // If setting as default, unset others first
      if (is_default) {
        await query(
          `UPDATE client_sheets_config SET is_default = 0 WHERE client_id = ? AND id != ?`,
          [client.id, configId]
        );
      }
      updates.push('is_default = ?');
      values.push(is_default ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncellenecek alan bulunamadı' },
        { status: 400 }
      );
    }

    values.push(configId);

    await query(
      `UPDATE client_sheets_config SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated config
    const updatedConfigs = await query<SheetsConfig[]>(
      `SELECT * FROM client_sheets_config WHERE id = ?`,
      [configId]
    );

    return NextResponse.json({
      success: true,
      data: parseConfig(updatedConfigs[0]),
      message: 'Konfigürasyon güncellendi',
    });
  } catch (error) {
    console.error('Error updating sheets config:', error);
    return NextResponse.json(
      { success: false, error: 'Konfigürasyon güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[clientId]/sheets-config/[configId] - Soft delete config
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { clientId, configId } = params;

    // Get client ID
    const clients = await query<{ id: number }[]>(
      `SELECT id FROM clients WHERE (id = ? OR uuid = ?) AND deleted_at IS NULL LIMIT 1`,
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

    // Check if config exists
    const existingConfigs = await query<{ id: number; config_name: string }[]>(
      `SELECT id, config_name FROM client_sheets_config WHERE id = ? AND client_id = ? AND is_active = 1`,
      [configId, client.id]
    );

    if (!existingConfigs || existingConfigs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Konfigürasyon bulunamadı' },
        { status: 404 }
      );
    }

    // Soft delete
    await query(
      `UPDATE client_sheets_config SET is_active = 0 WHERE id = ?`,
      [configId]
    );

    return NextResponse.json({
      success: true,
      message: `"${existingConfigs[0].config_name}" konfigürasyonu silindi`,
    });
  } catch (error) {
    console.error('Error deleting sheets config:', error);
    return NextResponse.json(
      { success: false, error: 'Konfigürasyon silinemedi' },
      { status: 500 }
    );
  }
}
