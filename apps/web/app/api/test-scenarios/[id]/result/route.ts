import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Submit test result
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    // Only admin and test roles can submit results
    if (!userRole || !['admin', 'test'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin or Test role required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes, screenshot_url, browser, device } = body;

    // Validation
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'passed', 'failed', 'partial', 'skipped'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

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

    // Insert test result
    const result = await query<any>(
      `INSERT INTO test_results (scenario_id, user_id, status, notes, screenshot_url, browser, device)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        scenarioId,
        userId || 1, // Default to 1 if no user
        status,
        notes || null,
        screenshot_url || null,
        browser || null,
        device || null
      ]
    );

    // Update scenario status based on latest result
    await query(
      'UPDATE test_scenarios SET status = ? WHERE id = ?',
      [status, scenarioId]
    );

    // Get created result with user info
    const [created] = await query<any[]>(
      `SELECT
        tr.*,
        u.name as tester_name,
        u.email as tester_email
       FROM test_results tr
       LEFT JOIN users u ON tr.user_id = u.id
       WHERE tr.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Test result submitted successfully'
    });
  } catch (error: any) {
    console.error('Error submitting test result:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit result' },
      { status: 500 }
    );
  }
}
