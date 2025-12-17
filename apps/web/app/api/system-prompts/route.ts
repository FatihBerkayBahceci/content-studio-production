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

// GET - List all system prompts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active') === 'true';

    let sql = 'SELECT * FROM system_prompts';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (activeOnly) {
      conditions.push('is_active = 1');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY sort_order ASC, created_at DESC';

    const rows = await query<SystemPrompt[]>(sql, params);

    const data = rows.map(row => ({
      ...row,
      is_active: row.is_active === true || (row.is_active as unknown) === 1,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch system prompts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system prompts' },
      { status: 500 }
    );
  }
}

// POST - Create a new system prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, category, prompt_text, description, is_active, sort_order } = body;

    if (!name || !slug || !prompt_text) {
      return NextResponse.json(
        { success: false, error: 'Name, slug, and prompt_text are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await query<SystemPrompt[]>(
      'SELECT id FROM system_prompts WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A prompt with this slug already exists' },
        { status: 400 }
      );
    }

    const result = await query<{ insertId: number }>(
      `INSERT INTO system_prompts (name, slug, category, prompt_text, description, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        category || 'other',
        prompt_text,
        description || null,
        is_active !== false ? 1 : 0,
        sort_order || 0,
      ]
    );

    const insertId = (result as unknown as { insertId: number }).insertId;

    const [created] = await query<SystemPrompt[]>(
      'SELECT * FROM system_prompts WHERE id = ?',
      [insertId]
    );

    return NextResponse.json({
      success: true,
      data: { ...created, is_active: created.is_active === true || (created.is_active as unknown) === 1 },
      message: 'System prompt created successfully',
    });
  } catch (error) {
    console.error('Failed to create system prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create system prompt' },
      { status: 500 }
    );
  }
}
