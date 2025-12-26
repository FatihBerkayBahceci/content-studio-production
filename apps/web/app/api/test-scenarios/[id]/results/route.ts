import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get test results history for a scenario
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if scenario exists
    const scenarios = await query<any[]>(
      'SELECT id FROM test_scenarios WHERE id = ? OR uuid = ?',
      [id, id]
    );

    if (scenarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    const scenarioId = scenarios[0].id;

    // Get all results for this scenario
    const results = await query<any[]>(
      `SELECT
        tr.*,
        u.name as tester_name,
        u.email as tester_email
       FROM test_results tr
       LEFT JOIN users u ON tr.user_id = u.id
       WHERE tr.scenario_id = ?
       ORDER BY tr.created_at DESC`,
      [scenarioId]
    );

    // Calculate stats
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const partial = results.filter(r => r.status === 'partial').length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        stats: {
          total,
          passed,
          failed,
          partial,
          passRate: total > 0 ? Math.round((passed / total) * 100) : 0
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
