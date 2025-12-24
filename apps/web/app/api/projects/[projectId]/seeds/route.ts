import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface SeedSummary {
  keyword: string;
  total_count: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  avg_volume: number;
  total_volume: number;
}

// GET /api/projects/[projectId]/seeds - Get seed keywords with stats for bulk projects
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Get project to check access
    const projectResult = await query<{ client_id: number; project_type: string; seed_keywords: string | null }[]>(
      `SELECT client_id, COALESCE(project_type, 'single') as project_type, seed_keywords
       FROM keyword_projects
       WHERE id = ? OR uuid = ?`,
      [projectId, projectId]
    );

    if (!projectResult || projectResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Proje bulunamadı' },
        { status: 404 }
      );
    }

    const project = projectResult[0];

    // Check client access
    if (!canAccessClient(session.user, project.client_id)) {
      return NextResponse.json(
        { success: false, error: 'Bu projeye erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    // Get seed keyword stats from keyword_results
    const seedStats = await query<SeedSummary[]>(
      `SELECT
         seed_keyword as keyword,
         COUNT(*) as total_count,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
         ROUND(AVG(search_volume), 0) as avg_volume,
         SUM(COALESCE(search_volume, 0)) as total_volume
       FROM keyword_results
       WHERE project_id = (SELECT id FROM keyword_projects WHERE id = ? OR uuid = ? LIMIT 1)
         AND seed_keyword IS NOT NULL
       GROUP BY seed_keyword
       ORDER BY total_volume DESC`,
      [projectId, projectId]
    );

    // Parse seed_keywords from project if available
    let originalSeeds: string[] = [];
    if (project.seed_keywords) {
      try {
        originalSeeds = JSON.parse(project.seed_keywords);
      } catch (e) {
        // Ignore parse errors
      }
    }

    // If no results from DB, return original seeds with zero counts
    if (!seedStats || seedStats.length === 0) {
      const emptySeeds = originalSeeds.map(kw => ({
        keyword: kw,
        total_count: 0,
        approved_count: 0,
        rejected_count: 0,
        pending_count: 0,
        avg_volume: 0,
        total_volume: 0,
      }));

      return NextResponse.json({
        success: true,
        project_type: project.project_type,
        seeds: emptySeeds,
        total_seeds: emptySeeds.length,
      });
    }

    return NextResponse.json({
      success: true,
      project_type: project.project_type,
      seeds: seedStats,
      total_seeds: seedStats.length,
      summary: {
        total_keywords: seedStats.reduce((sum, s) => sum + s.total_count, 0),
        total_approved: seedStats.reduce((sum, s) => sum + s.approved_count, 0),
        total_rejected: seedStats.reduce((sum, s) => sum + s.rejected_count, 0),
        total_pending: seedStats.reduce((sum, s) => sum + s.pending_count, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching seeds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch seeds', details: String(error) },
      { status: 500 }
    );
  }
}
