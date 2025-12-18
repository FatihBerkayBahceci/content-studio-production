import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface RouteParams {
  params: { clientId: string };
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

// GET /api/clients/[clientId]/sheets-config - List all sheets configs for client
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

    // Get client ID (handle both numeric ID and UUID)
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

    // Fetch sheets configs
    const configs = await query<SheetsConfig[]>(
      `SELECT
        id, client_id, config_name, spreadsheet_id, spreadsheet_url,
        spreadsheet_name, sheet_name, sheet_gid, start_row, column_mappings,
        include_headers, is_default, is_active, last_export_at, last_export_count,
        created_at, updated_at
       FROM client_sheets_config
       WHERE client_id = ? AND is_active = 1
       ORDER BY is_default DESC, created_at DESC`,
      [client.id]
    );

    // Parse JSON column_mappings
    const parsedConfigs = configs.map(config => ({
      ...config,
      column_mappings: typeof config.column_mappings === 'string'
        ? JSON.parse(config.column_mappings)
        : config.column_mappings,
      include_headers: Boolean(config.include_headers),
      is_default: Boolean(config.is_default),
      is_active: Boolean(config.is_active),
    }));

    return NextResponse.json({
      success: true,
      data: parsedConfigs,
    });
  } catch (error) {
    console.error('Error fetching sheets configs:', error);
    return NextResponse.json(
      { success: false, error: 'Sheets konfigürasyonları alınamadı' },
      { status: 500 }
    );
  }
}

// POST /api/clients/[clientId]/sheets-config - Create new sheets config
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { clientId } = params;

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

    const body = await request.json();
    const {
      config_name,
      spreadsheet_id,
      spreadsheet_url,
      spreadsheet_name,
      sheet_name,
      sheet_gid,
      start_row = 2,
      column_mappings,
      include_headers = true,
      is_default = false,
    } = body;

    // Validate required fields
    if (!config_name || !spreadsheet_id || !spreadsheet_url || !sheet_name || !column_mappings) {
      return NextResponse.json(
        { success: false, error: 'Zorunlu alanlar eksik' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await query(
        `UPDATE client_sheets_config SET is_default = 0 WHERE client_id = ?`,
        [client.id]
      );
    }

    // Insert new config
    const result = await query(
      `INSERT INTO client_sheets_config
        (client_id, config_name, spreadsheet_id, spreadsheet_url, spreadsheet_name,
         sheet_name, sheet_gid, start_row, column_mappings, include_headers, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client.id,
        config_name,
        spreadsheet_id,
        spreadsheet_url,
        spreadsheet_name || null,
        sheet_name,
        sheet_gid || null,
        start_row,
        JSON.stringify(column_mappings),
        include_headers ? 1 : 0,
        is_default ? 1 : 0,
      ]
    );

    const insertId = (result as any).insertId;

    // Fetch created config
    const configs = await query<SheetsConfig[]>(
      `SELECT * FROM client_sheets_config WHERE id = ?`,
      [insertId]
    );

    const config = configs[0];

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        column_mappings: typeof config.column_mappings === 'string'
          ? JSON.parse(config.column_mappings)
          : config.column_mappings,
        include_headers: Boolean(config.include_headers),
        is_default: Boolean(config.is_default),
        is_active: Boolean(config.is_active),
      },
      message: 'Sheets konfigürasyonu oluşturuldu',
    });
  } catch (error) {
    console.error('Error creating sheets config:', error);
    return NextResponse.json(
      { success: false, error: 'Sheets konfigürasyonu oluşturulamadı' },
      { status: 500 }
    );
  }
}
