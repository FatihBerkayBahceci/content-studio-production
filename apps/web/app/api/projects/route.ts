import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth/session';
import { canAccessClient, canEditClient } from '@/lib/auth/permissions';

interface CreateProjectRequest {
  client_id: number;
  name: string;
  main_keyword: string;
  target_country?: string;
  target_language?: string;
  project_type?: string;
}

interface InsertResult {
  insertId: number;
  affectedRows: number;
}

// POST /api/projects - Create a new keyword project
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const body: CreateProjectRequest = await request.json();

    // Validate required fields
    if (!body.client_id || !body.name || !body.main_keyword) {
      return NextResponse.json(
        { success: false, error: 'client_id, name, and main_keyword are required' },
        { status: 400 }
      );
    }

    // Check client access
    if (!canAccessClient(session.user, body.client_id)) {
      return NextResponse.json(
        { success: false, error: 'Bu müşteriye erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    // Check edit permission (clients cannot create projects)
    const canEdit = await canEditClient(session.user, body.client_id);
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Bu müşteri için proje oluşturma yetkiniz yok' },
        { status: 403 }
      );
    }

    const uuid = randomUUID();
    const targetCountry = body.target_country || 'TR';
    const targetLanguage = body.target_language || 'tr';

    // Insert new keyword project
    const result = await query<InsertResult>(
      `INSERT INTO keyword_projects
        (uuid, client_id, project_name, main_keyword, target_country, target_language, status, scenario_type)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'seed_keyword')`,
      [uuid, body.client_id, body.name, body.main_keyword, targetCountry, targetLanguage]
    );

    // Get the inserted ID (mysql2 returns insertId differently)
    const insertId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      project: {
        id: insertId,
        uuid: uuid,
        client_id: body.client_id,
        name: body.name,
        main_keyword: body.main_keyword,
        target_country: targetCountry,
        target_language: targetLanguage,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/projects - List projects (filtered by user access)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    // If specific client requested, check access
    if (clientId && !canAccessClient(session.user, parseInt(clientId))) {
      return NextResponse.json(
        { success: false, error: 'Bu müşteriye erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    let sql = `
      SELECT kp.id, kp.uuid, kp.client_id, kp.project_name as name,
             kp.main_keyword, kp.target_country, kp.target_language, kp.status,
             kp.total_keywords_found, kp.created_at,
             c.name as client_name
      FROM keyword_projects kp
      JOIN clients c ON kp.client_id = c.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    // Filter by client access for non-admin users
    if (session.user.role !== 'admin') {
      const accessibleClientIds = session.user.accessibleClients;
      if (accessibleClientIds.length === 0) {
        return NextResponse.json({
          success: true,
          projects: [],
        });
      }
      sql += ` AND kp.client_id IN (${accessibleClientIds.map(() => '?').join(',')})`;
      params.push(...accessibleClientIds);
    }

    if (clientId) {
      sql += ' AND kp.client_id = ?';
      params.push(clientId);
    }

    sql += ' ORDER BY kp.created_at DESC LIMIT 100';

    const projects = await query(sql, params);

    return NextResponse.json({
      success: true,
      projects: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
