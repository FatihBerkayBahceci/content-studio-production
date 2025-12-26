import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - List all test scenarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let sql = `
      SELECT
        ts.*,
        (SELECT COUNT(*) FROM test_results WHERE scenario_id = ts.id) as result_count,
        (SELECT tr.status FROM test_results tr WHERE tr.scenario_id = ts.id ORDER BY tr.created_at DESC LIMIT 1) as latest_result_status,
        (SELECT tr.notes FROM test_results tr WHERE tr.scenario_id = ts.id ORDER BY tr.created_at DESC LIMIT 1) as latest_result_notes,
        (SELECT tr.created_at FROM test_results tr WHERE tr.scenario_id = ts.id ORDER BY tr.created_at DESC LIMIT 1) as latest_result_date,
        (SELECT u.name FROM test_results tr LEFT JOIN users u ON tr.user_id = u.id WHERE tr.scenario_id = ts.id ORDER BY tr.created_at DESC LIMIT 1) as latest_tester_name
      FROM test_scenarios ts
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      sql += ' AND ts.category = ?';
      params.push(category);
    }

    if (status && status !== 'all') {
      sql += ' AND ts.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (ts.title LIKE ? OR ts.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY ts.priority = "critical" DESC, ts.priority = "high" DESC, ts.created_at DESC';

    const scenarios = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      data: scenarios.map(s => ({
        ...s,
        steps: s.steps ? (typeof s.steps === 'string' ? JSON.parse(s.steps) : s.steps) : []
      }))
    });
  } catch (error: any) {
    console.error('Error fetching test scenarios:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

// POST - Create new test scenario (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin role from headers (set by middleware)
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, title, description, steps, expected_result, priority } = body;

    // Validation
    if (!category || !title) {
      return NextResponse.json(
        { success: false, error: 'Category and title are required' },
        { status: 400 }
      );
    }

    const userId = request.headers.get('x-user-id');

    const result = await query<any>(
      `INSERT INTO test_scenarios (category, title, description, steps, expected_result, priority, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        category,
        title,
        description || null,
        steps ? JSON.stringify(steps) : null,
        expected_result || null,
        priority || 'medium',
        userId || null
      ]
    );

    // Get created scenario
    const [created] = await query<any[]>(
      'SELECT * FROM test_scenarios WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...created,
        steps: created.steps ? JSON.parse(created.steps) : []
      },
      message: 'Test scenario created successfully'
    });
  } catch (error: any) {
    console.error('Error creating test scenario:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create scenario' },
      { status: 500 }
    );
  }
}
