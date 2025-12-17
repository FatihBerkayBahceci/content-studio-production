import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface SystemPrompt {
  id: number;
  name: string;
  slug: string;
  category: string;
  prompt_text: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// GET - Get a single system prompt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promptId = parseInt(id);

    if (isNaN(promptId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid prompt ID' },
        { status: 400 }
      );
    }

    const rows = await query<SystemPrompt[]>(
      'SELECT * FROM system_prompts WHERE id = ?',
      [promptId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'System prompt not found' },
        { status: 404 }
      );
    }

    const data = {
      ...rows[0],
      is_active: rows[0].is_active === true || (rows[0].is_active as unknown) === 1,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch system prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system prompt' },
      { status: 500 }
    );
  }
}

// PUT - Update a system prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promptId = parseInt(id);

    if (isNaN(promptId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid prompt ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.slug !== undefined) {
      updates.push('slug = ?');
      values.push(body.slug);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      values.push(body.category);
    }
    if (body.prompt_text !== undefined) {
      updates.push('prompt_text = ?');
      values.push(body.prompt_text);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }
    if (body.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(body.sort_order);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');
    values.push(promptId);

    await query(
      `UPDATE system_prompts SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await query<SystemPrompt[]>(
      'SELECT * FROM system_prompts WHERE id = ?',
      [promptId]
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'System prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...updated, is_active: updated.is_active === true || (updated.is_active as unknown) === 1 },
      message: 'System prompt updated successfully',
    });
  } catch (error) {
    console.error('Failed to update system prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update system prompt' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a system prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promptId = parseInt(id);

    if (isNaN(promptId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid prompt ID' },
        { status: 400 }
      );
    }

    const existing = await query<SystemPrompt[]>(
      'SELECT id FROM system_prompts WHERE id = ?',
      [promptId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'System prompt not found' },
        { status: 404 }
      );
    }

    await query('DELETE FROM system_prompts WHERE id = ?', [promptId]);

    return NextResponse.json({
      success: true,
      message: 'System prompt deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete system prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete system prompt' },
      { status: 500 }
    );
  }
}
