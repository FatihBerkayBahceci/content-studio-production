import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  description: string | null;
}

// GET - Get all settings or specific setting by key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const rows = await query<SystemSetting[]>(
        'SELECT * FROM system_settings WHERE setting_key = ?',
        [key]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Setting not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: rows[0] });
    }

    const rows = await query<SystemSetting[]>(
      'SELECT * FROM system_settings ORDER BY setting_key'
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update a setting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Setting key is required' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
      [value, key]
    );

    const [updated] = await query<SystemSetting[]>(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    console.error('Failed to update setting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
