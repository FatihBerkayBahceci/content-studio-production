import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface RouteParams {
  params: { projectId: string };
}

type KeywordStatus = 'approved' | 'pending' | 'rejected' | 'trash' | 'negative';

const VALID_STATUSES: KeywordStatus[] = ['approved', 'pending', 'rejected', 'trash', 'negative'];

// POST /api/projects/[projectId]/keywords/bulk-status - Update status for multiple keywords
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
    const { keywordIds, status } = body;

    // Validate input
    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'keywordIds array gerekli' },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Geçersiz status. Geçerli değerler: ${VALID_STATUSES.join(', ')}` },
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

    // Build the update query with placeholders for keyword IDs
    const placeholders = keywordIds.map(() => '?').join(',');

    // Set trashed_at timestamp when moving to trash
    let updateSql: string;
    let updateParams: any[];

    if (status === 'trash') {
      updateSql = `
        UPDATE keyword_results
        SET status = ?, trashed_at = NOW()
        WHERE project_id = ? AND id IN (${placeholders})
      `;
      updateParams = [status, pid, ...keywordIds];
    } else {
      // Clear trashed_at when restoring from trash
      updateSql = `
        UPDATE keyword_results
        SET status = ?, trashed_at = NULL
        WHERE project_id = ? AND id IN (${placeholders})
      `;
      updateParams = [status, pid, ...keywordIds];
    }

    const result = await query(updateSql, updateParams) as any;

    const statusMessages: Record<string, string> = {
      'approved': 'Ana listeye taşındı',
      'pending': 'Havuza taşındı',
      'rejected': 'Reddedildi',
      'trash': 'Çöp kutusuna taşındı',
      'negative': 'Negatif listeye taşındı',
    };

    return NextResponse.json({
      success: true,
      updated: result.affectedRows,
      message: `${result.affectedRows} keyword ${statusMessages[status]}`
    });
  } catch (error) {
    console.error('Error updating keyword status:', error);
    return NextResponse.json(
      { success: false, error: 'Keyword durumu güncellenemedi' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]/keywords/bulk-status - Update single keyword status
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
    const { keywordId, status } = body;

    // Validate input
    if (!keywordId) {
      return NextResponse.json(
        { success: false, error: 'keywordId gerekli' },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Geçersiz status. Geçerli değerler: ${VALID_STATUSES.join(', ')}` },
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

    // Set trashed_at timestamp when moving to trash
    let updateSql: string;
    let updateParams: any[];

    if (status === 'trash') {
      updateSql = `
        UPDATE keyword_results
        SET status = ?, trashed_at = NOW()
        WHERE project_id = ? AND id = ?
      `;
      updateParams = [status, pid, keywordId];
    } else {
      // Clear trashed_at when restoring from trash
      updateSql = `
        UPDATE keyword_results
        SET status = ?, trashed_at = NULL
        WHERE project_id = ? AND id = ?
      `;
      updateParams = [status, pid, keywordId];
    }

    const result = await query(updateSql, updateParams) as any;

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Keyword bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Keyword durumu güncellendi'
    });
  } catch (error) {
    console.error('Error updating keyword status:', error);
    return NextResponse.json(
      { success: false, error: 'Keyword durumu güncellenemedi' },
      { status: 500 }
    );
  }
}
