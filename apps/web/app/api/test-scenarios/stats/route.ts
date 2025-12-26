import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get test scenarios statistics
export async function GET(request: NextRequest) {
  try {
    // Total counts by status
    const statusStats = await query<any[]>(`
      SELECT
        status,
        COUNT(*) as count
      FROM test_scenarios
      GROUP BY status
    `);

    // Total counts by category
    const categoryStats = await query<any[]>(`
      SELECT
        category,
        COUNT(*) as count
      FROM test_scenarios
      GROUP BY category
    `);

    // Priority stats
    const priorityStats = await query<any[]>(`
      SELECT
        priority,
        COUNT(*) as count
      FROM test_scenarios
      GROUP BY priority
    `);

    // Recent activity
    const recentResults = await query<any[]>(`
      SELECT
        tr.id,
        tr.status,
        tr.notes,
        tr.created_at,
        ts.title as scenario_title,
        ts.category as scenario_category,
        u.name as tester_name
      FROM test_results tr
      JOIN test_scenarios ts ON tr.scenario_id = ts.id
      LEFT JOIN users u ON tr.user_id = u.id
      ORDER BY tr.created_at DESC
      LIMIT 10
    `);

    // Calculate totals
    const total = statusStats.reduce((sum, s) => sum + s.count, 0);
    const passed = statusStats.find(s => s.status === 'passed')?.count || 0;
    const failed = statusStats.find(s => s.status === 'failed')?.count || 0;
    const partial = statusStats.find(s => s.status === 'partial')?.count || 0;
    const pending = statusStats.find(s => s.status === 'pending')?.count || 0;
    const skipped = statusStats.find(s => s.status === 'skipped')?.count || 0;

    const uiux = categoryStats.find(c => c.category === 'ui_ux')?.count || 0;
    const backend = categoryStats.find(c => c.category === 'backend')?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        total,
        byStatus: {
          passed,
          failed,
          partial,
          pending,
          skipped
        },
        byCategory: {
          ui_ux: uiux,
          backend
        },
        byPriority: {
          critical: priorityStats.find(p => p.priority === 'critical')?.count || 0,
          high: priorityStats.find(p => p.priority === 'high')?.count || 0,
          medium: priorityStats.find(p => p.priority === 'medium')?.count || 0,
          low: priorityStats.find(p => p.priority === 'low')?.count || 0
        },
        recentActivity: recentResults,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching test stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
