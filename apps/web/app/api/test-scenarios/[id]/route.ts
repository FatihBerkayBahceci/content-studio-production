import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single test scenario
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const scenarios = await query<any[]>(
      `SELECT
        ts.*,
        u.name as creator_name
       FROM test_scenarios ts
       LEFT JOIN users u ON ts.created_by = u.id
       WHERE ts.id = ? OR ts.uuid = ?`,
      [id, id]
    );

    if (scenarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    const scenario = scenarios[0];

    return NextResponse.json({
      success: true,
      data: {
        ...scenario,
        steps: scenario.steps ? (typeof scenario.steps === 'string' ? JSON.parse(scenario.steps) : scenario.steps) : []
      }
    });
  } catch (error: any) {
    console.error('Error fetching test scenario:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
}

// PUT - Update test scenario (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { category, title, description, steps, expected_result, priority, status } = body;

    // Check if exists
    const existing = await query<any[]>(
      'SELECT id FROM test_scenarios WHERE id = ? OR uuid = ?',
      [id, id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    const scenarioId = existing[0].id;

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (steps !== undefined) {
      updates.push('steps = ?');
      values.push(JSON.stringify(steps));
    }
    if (expected_result !== undefined) {
      updates.push('expected_result = ?');
      values.push(expected_result);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(scenarioId);

    await query(
      `UPDATE test_scenarios SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated scenario
    const [updated] = await query<any[]>(
      'SELECT * FROM test_scenarios WHERE id = ?',
      [scenarioId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        steps: updated.steps ? JSON.parse(updated.steps) : []
      },
      message: 'Scenario updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating test scenario:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

// DELETE - Delete test scenario (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if exists
    const existing = await query<any[]>(
      'SELECT id FROM test_scenarios WHERE id = ? OR uuid = ?',
      [id, id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    await query('DELETE FROM test_scenarios WHERE id = ?', [existing[0].id]);

    return NextResponse.json({
      success: true,
      message: 'Scenario deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting test scenario:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}
