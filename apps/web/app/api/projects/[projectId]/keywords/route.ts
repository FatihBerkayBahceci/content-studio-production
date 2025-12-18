import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface RouteParams {
  params: { projectId: string };
}

// GET /api/projects/[projectId]/keywords - Get keywords for a project
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
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit')) || 500;
    const offsetParam = Number(searchParams.get('offset')) || 0;

    // First get the project to check permissions and get numeric ID
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

    // Ensure project.id is a proper number
    const pid = Number(project.id);

    // Get keywords with inline LIMIT/OFFSET to avoid prepared statement issues
    const keywordsSql = `
      SELECT
        id,
        keyword,
        keyword_type,
        search_volume,
        keyword_difficulty,
        cpc,
        competition,
        search_intent,
        trend_direction,
        parent_topic,
        keyword_cluster,
        opportunity_score,
        source,
        content_priority,
        page_type,
        content_format,
        recommended_word_count,
        created_at
      FROM keyword_results
      WHERE project_id = ${pid}
      ORDER BY
        CASE WHEN content_priority = 'high' THEN 1 WHEN content_priority = 'medium' THEN 2 ELSE 3 END,
        opportunity_score DESC,
        search_volume DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;
    const keywords = await query(keywordsSql, []);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM keyword_results WHERE project_id = ${pid}`;
    const countResult = await query(countSql, []);
    const total = Array.isArray(countResult) && countResult.length > 0 ? countResult[0].total : 0;

    // Calculate stats - use backticks for reserved words
    const statsSql = `
      SELECT
        COUNT(*) as total_count,
        COUNT(CASE WHEN content_priority IS NOT NULL THEN 1 END) as filtered_count,
        COUNT(CASE WHEN search_intent IS NOT NULL THEN 1 END) as with_intent,
        COALESCE(AVG(NULLIF(search_volume, 0)), 0) as avg_volume,
        COALESCE(AVG(NULLIF(keyword_difficulty, 0)), 0) as avg_difficulty,
        COALESCE(AVG(NULLIF(opportunity_score, 0)), 0) as avg_opportunity,
        COUNT(CASE WHEN content_priority = 'high' THEN 1 END) as cnt_high,
        COUNT(CASE WHEN content_priority = 'medium' THEN 1 END) as cnt_medium,
        COUNT(CASE WHEN content_priority = 'low' THEN 1 END) as cnt_low
      FROM keyword_results
      WHERE project_id = ${pid}
    `;
    const statsResult = await query(statsSql, []);
    const statsRow = Array.isArray(statsResult) && statsResult.length > 0 ? statsResult[0] : null;

    // Get cluster distribution
    const clusterSql = `
      SELECT keyword_cluster, COUNT(*) as cnt
      FROM keyword_results
      WHERE project_id = ${pid} AND keyword_cluster IS NOT NULL
      GROUP BY keyword_cluster
      ORDER BY cnt DESC
    `;
    const clusterResult = await query(clusterSql, []);
    const byCluster: Record<string, number> = {};
    if (Array.isArray(clusterResult)) {
      for (const row of clusterResult) {
        if (row.keyword_cluster) {
          byCluster[row.keyword_cluster] = Number(row.cnt);
        }
      }
    }

    // Get type distribution
    const typeSql = `
      SELECT keyword_type, COUNT(*) as cnt
      FROM keyword_results
      WHERE project_id = ${pid}
      GROUP BY keyword_type
    `;
    const typeResult = await query(typeSql, []);
    const byType: Record<string, number> = {};
    if (Array.isArray(typeResult)) {
      for (const row of typeResult) {
        if (row.keyword_type) {
          byType[row.keyword_type] = Number(row.cnt);
        }
      }
    }

    // Map keywords to include priority alias
    const mappedKeywords = Array.isArray(keywords) ? keywords.map((kw: Record<string, unknown>) => ({
      ...kw,
      priority: kw.content_priority,
    })) : [];

    return NextResponse.json({
      success: true,
      data: mappedKeywords,
      stats: statsRow ? {
        total: Number(statsRow.total_count) || 0,
        filtered_count: Number(statsRow.filtered_count) || 0,
        with_intent: Number(statsRow.with_intent) || 0,
        avg_volume: Math.round(Number(statsRow.avg_volume) || 0),
        avg_difficulty: Math.round(Number(statsRow.avg_difficulty) || 0),
        avg_opportunity: Math.round(Number(statsRow.avg_opportunity) || 0),
        high_priority: Number(statsRow.cnt_high) || 0,
        medium_priority: Number(statsRow.cnt_medium) || 0,
        low_priority: Number(statsRow.cnt_low) || 0,
      } : null,
      by_cluster: byCluster,
      by_type: byType,
      pagination: {
        total: Number(total),
        limit: limitParam,
        offset: offsetParam,
      },
    });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { success: false, error: 'Keyword verileri alınamadı' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/keywords - Add a keyword to the project
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { keyword, search_volume, cpc, competition, source } = body;

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword gerekli' },
        { status: 400 }
      );
    }

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

    // Check if keyword already exists
    const existsSql = `SELECT id FROM keyword_results WHERE project_id = ? AND keyword = ? LIMIT 1`;
    const existing = await query(existsSql, [pid, keyword]);

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu keyword zaten listede mevcut' },
        { status: 409 }
      );
    }

    // Insert the keyword
    const insertSql = `
      INSERT INTO keyword_results (project_id, keyword, search_volume, cpc, competition, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const result = await query(insertSql, [
      pid,
      keyword,
      search_volume || null,
      cpc || null,
      competition || null,
      source || 'manual'
    ]) as any;

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Keyword başarıyla eklendi'
    });
  } catch (error) {
    console.error('Error adding keyword:', error);
    return NextResponse.json(
      { success: false, error: 'Keyword eklenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/keywords - Remove keyword(s) from the project
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
    const keyword = searchParams.get('keyword');

    if (!keywordId && !keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword ID veya keyword gerekli' },
        { status: 400 }
      );
    }

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

    // Delete the keyword
    let deleteSql: string;
    let deleteParams: any[];

    if (keywordId) {
      deleteSql = `DELETE FROM keyword_results WHERE project_id = ? AND id = ?`;
      deleteParams = [pid, keywordId];
    } else {
      deleteSql = `DELETE FROM keyword_results WHERE project_id = ? AND keyword = ?`;
      deleteParams = [pid, keyword];
    }

    const result = await query(deleteSql, deleteParams) as any;

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Keyword bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Keyword başarıyla silindi'
    });
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { success: false, error: 'Keyword silinemedi' },
      { status: 500 }
    );
  }
}
