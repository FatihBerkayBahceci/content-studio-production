import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface RouteParams {
  params: { projectId: string };
}

// GET /api/projects/[projectId]/keywords-trash - Get trash keywords for a project
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

    // Get the project to check permissions and get numeric ID
    const projectSql = `
      SELECT id, client_id FROM keyword_projects
      WHERE uuid = ? OR id = ?
      LIMIT 1
    `;
    const projects = await query(projectSql, [projectId, projectId]);
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

    const pid = Number(project.id);

    // Get trash keywords
    const keywordsSql = `
      SELECT
        id,
        keyword,
        seed_keyword,
        keyword_type,
        search_volume,
        keyword_difficulty,
        cpc,
        competition,
        search_intent,
        trend_direction,
        source,
        status,
        trashed_at,
        created_at
      FROM keyword_results
      WHERE project_id = ${pid} AND status = 'trash'
      ORDER BY trashed_at DESC
    `;
    const keywords = await query(keywordsSql, []);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM keyword_results WHERE project_id = ${pid} AND status = 'trash'`;
    const countResult = await query(countSql, []);
    const total = Array.isArray(countResult) && countResult.length > 0 ? countResult[0].total : 0;

    return NextResponse.json({
      success: true,
      data: Array.isArray(keywords) ? keywords : [],
      total: Number(total),
    });
  } catch (error) {
    console.error('Error fetching trash keywords:', error);
    return NextResponse.json(
      { success: false, error: 'Trash keyword verileri alınamadı' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/keywords-trash - Permanently delete trash keyword(s)
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
    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('id');
    const clearAll = searchParams.get('all') === 'true';

    // Get the project to check permissions
    const projectSql = `
      SELECT id, client_id FROM keyword_projects
      WHERE uuid = ? OR id = ?
      LIMIT 1
    `;
    const projects = await query(projectSql, [projectId, projectId]);
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

    const pid = Number(project.id);

    let deleteSql: string;
    let deleteParams: any[];

    if (clearAll) {
      // Delete all trash keywords
      deleteSql = `DELETE FROM keyword_results WHERE project_id = ? AND status = 'trash'`;
      deleteParams = [pid];
    } else if (keywordId) {
      // Delete specific keyword
      deleteSql = `DELETE FROM keyword_results WHERE project_id = ? AND id = ? AND status = 'trash'`;
      deleteParams = [pid, keywordId];
    } else {
      return NextResponse.json(
        { success: false, error: 'Keyword ID veya all=true parametresi gerekli' },
        { status: 400 }
      );
    }

    const result = await query(deleteSql, deleteParams) as any;

    return NextResponse.json({
      success: true,
      deleted: result.affectedRows,
      message: clearAll ? 'Tüm çöp kutusu temizlendi' : 'Keyword kalıcı olarak silindi'
    });
  } catch (error) {
    console.error('Error deleting trash keywords:', error);
    return NextResponse.json(
      { success: false, error: 'Keyword silinemedi' },
      { status: 500 }
    );
  }
}
