import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface RouteParams {
  params: { projectId: string };
}

// GET /api/projects/[projectId]/keywords-negative - Get negative keywords for a project
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

    // Get negative keywords
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
        created_at
      FROM keyword_results
      WHERE project_id = ${pid} AND status = 'negative'
      ORDER BY keyword ASC
    `;
    const keywords = await query(keywordsSql, []);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM keyword_results WHERE project_id = ${pid} AND status = 'negative'`;
    const countResult = await query(countSql, []);
    const total = Array.isArray(countResult) && countResult.length > 0 ? countResult[0].total : 0;

    return NextResponse.json({
      success: true,
      data: Array.isArray(keywords) ? keywords : [],
      total: Number(total),
    });
  } catch (error) {
    console.error('Error fetching negative keywords:', error);
    return NextResponse.json(
      { success: false, error: 'Negatif keyword verileri alınamadı' },
      { status: 500 }
    );
  }
}
