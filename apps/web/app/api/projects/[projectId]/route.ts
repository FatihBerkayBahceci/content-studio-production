import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface RouteParams {
  params: { projectId: string };
}

// GET /api/projects/[projectId] - Get a single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Try to find by UUID first, then by ID
    const sql = `
      SELECT kp.*, c.name as client_name
      FROM keyword_projects kp
      JOIN clients c ON kp.client_id = c.id
      WHERE kp.uuid = ? OR kp.id = ?
      LIMIT 1
    `;

    const projects = await query(sql, [projectId, projectId]);
    const project = Array.isArray(projects) && projects.length > 0 ? projects[0] : null;

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proje bulunamadı' },
        { status: 404 }
      );
    }

    // Check access
    if (session.user.role !== 'admin' && !canAccessClient(session.user, project.client_id)) {
      return NextResponse.json(
        { success: false, error: 'Bu projeye erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { success: false, error: 'Proje alınamadı' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId] - Update a project
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { projectId } = params;
    const body = await request.json();

    // First get the project to check permissions
    const findSql = `
      SELECT id, client_id FROM keyword_projects
      WHERE uuid = ? OR id = ?
      LIMIT 1
    `;
    const projects = await query(findSql, [projectId, projectId]);
    const project = Array.isArray(projects) && projects.length > 0 ? projects[0] : null;

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proje bulunamadı' },
        { status: 404 }
      );
    }

    // Check access (admin or has access to client)
    if (session.user.role !== 'admin' && !canAccessClient(session.user, project.client_id)) {
      return NextResponse.json(
        { success: false, error: 'Bu projeyi düzenleme yetkiniz yok' },
        { status: 403 }
      );
    }

    // Build update query dynamically
    const allowedFields = ['project_name', 'status', 'total_keywords_found', 'total_competitors_analyzed', 'total_paa_found', 'bulk_stats', 'seed_keywords', 'ai_categories', 'ai_categorization_done'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        // JSON stringify object fields
        if ((field === 'bulk_stats' || field === 'seed_keywords' || field === 'ai_categories') && typeof body[field] === 'object') {
          values.push(JSON.stringify(body[field]));
        } else {
          values.push(body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncellenecek alan belirtilmedi' },
        { status: 400 }
      );
    }

    // Add project ID to values
    values.push(project.id);

    const updateSql = `
      UPDATE keyword_projects
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateSql, values);

    return NextResponse.json({
      success: true,
      message: 'Proje güncellendi',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Proje güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // First get the project to check permissions
    const findSql = `
      SELECT id, client_id FROM keyword_projects
      WHERE uuid = ? OR id = ?
      LIMIT 1
    `;
    const projects = await query(findSql, [projectId, projectId]);
    const project = Array.isArray(projects) && projects.length > 0 ? projects[0] : null;

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proje bulunamadı' },
        { status: 404 }
      );
    }

    // Check access (admin or has access to client)
    if (session.user.role !== 'admin' && !canAccessClient(session.user, project.client_id)) {
      return NextResponse.json(
        { success: false, error: 'Bu projeyi silme yetkiniz yok' },
        { status: 403 }
      );
    }

    // Delete related keyword results first
    await query('DELETE FROM keyword_results WHERE project_id = ?', [project.id]);

    // Delete the project
    await query('DELETE FROM keyword_projects WHERE id = ?', [project.id]);

    return NextResponse.json({
      success: true,
      message: 'Proje silindi',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Proje silinemedi' },
      { status: 500 }
    );
  }
}
