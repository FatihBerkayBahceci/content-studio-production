import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

interface RouteParams {
  params: { projectId: string };
}

interface SheetsConfig {
  id: number;
  client_id: number;
  config_name: string;
  spreadsheet_id: string;
  spreadsheet_url: string;
  sheet_name: string;
  start_row: number;
  column_mappings: Record<string, string>;
  include_headers: boolean;
}

interface Keyword {
  id: number;
  keyword: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: string | null;
  search_intent: string | null;
  opportunity_score: number | null;
  ai_category: string | null;
}

// POST /api/projects/[projectId]/export-sheets - Export keywords to Google Sheets
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
    const { config_id, keyword_ids, write_mode = 'append' } = body;

    // Validate inputs
    if (!config_id) {
      return NextResponse.json(
        { success: false, error: 'Sheets konfigürasyonu seçilmedi' },
        { status: 400 }
      );
    }

    if (!keyword_ids || !Array.isArray(keyword_ids) || keyword_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aktarılacak anahtar kelime seçilmedi' },
        { status: 400 }
      );
    }

    if (!['append', 'replace'].includes(write_mode)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz yazma modu' },
        { status: 400 }
      );
    }

    // Get project info
    const projects = await query<{ id: number; client_id: number }[]>(
      `SELECT id, client_id FROM keyword_projects WHERE (id = ? OR uuid = ?) LIMIT 1`,
      [projectId, projectId]
    );

    if (!projects || projects.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Proje bulunamadı' },
        { status: 404 }
      );
    }

    const project = projects[0];

    // Get sheets config
    const configs = await query<SheetsConfig[]>(
      `SELECT id, client_id, config_name, spreadsheet_id, spreadsheet_url, sheet_name,
              start_row, column_mappings, include_headers
       FROM client_sheets_config
       WHERE id = ? AND is_active = 1`,
      [config_id]
    );

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sheets konfigürasyonu bulunamadı' },
        { status: 404 }
      );
    }

    const config = configs[0];

    // Parse column_mappings if needed
    const columnMappings = typeof config.column_mappings === 'string'
      ? JSON.parse(config.column_mappings)
      : config.column_mappings;

    // Verify config belongs to project's client
    if (config.client_id !== project.client_id) {
      return NextResponse.json(
        { success: false, error: 'Bu konfigürasyon bu projeye ait değil' },
        { status: 403 }
      );
    }

    // Fetch keywords - try keyword_results first, then keyword_results_raw
    let keywords = await query<Keyword[]>(
      `SELECT id, keyword, search_volume, keyword_difficulty, cpc, competition,
              search_intent, opportunity_score
       FROM keyword_results
       WHERE project_id = ? AND id IN (${keyword_ids.map(() => '?').join(',')})`,
      [project.id, ...keyword_ids]
    );

    // If no results in keyword_results, try keyword_results_raw
    if (!keywords || keywords.length === 0) {
      keywords = await query<Keyword[]>(
        `SELECT id, keyword, search_volume, NULL as keyword_difficulty, cpc, competition,
                NULL as search_intent, NULL as opportunity_score, ai_category
         FROM keyword_results_raw
         WHERE project_id = ? AND id IN (${keyword_ids.map(() => '?').join(',')})`,
        [project.id, ...keyword_ids]
      );
    }

    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Seçilen anahtar kelimeler bulunamadı' },
        { status: 404 }
      );
    }

    // Prepare data for n8n
    const exportData = keywords.map(kw => ({
      keyword: kw.keyword,
      search_volume: kw.search_volume,
      keyword_difficulty: kw.keyword_difficulty,
      cpc: kw.cpc,
      competition: kw.competition,
      search_intent: kw.search_intent,
      opportunity_score: kw.opportunity_score,
      ai_category: kw.ai_category,
    }));

    // Call n8n sheets-write webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5679/webhook';

    const n8nResponse = await fetch(`${n8nWebhookUrl}/sheets-write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spreadsheet_id: config.spreadsheet_id,
        sheet_name: config.sheet_name,
        column_mappings: columnMappings,
        start_row: config.start_row,
        write_mode,
        include_headers: Boolean(config.include_headers),
        data: exportData,
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n sheets-write error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Google Sheets yazma hatası' },
        { status: 500 }
      );
    }

    const n8nResult = await n8nResponse.json();

    // Update last_export info on config
    await query(
      `UPDATE client_sheets_config
       SET last_export_at = NOW(), last_export_count = ?
       WHERE id = ?`,
      [keywords.length, config_id]
    );

    return NextResponse.json({
      success: true,
      data: {
        rows_written: n8nResult.rows_written || keywords.length,
        spreadsheet_url: config.spreadsheet_url,
        sheet_name: config.sheet_name,
        write_mode,
      },
      message: `${keywords.length} anahtar kelime başarıyla aktarıldı`,
    });
  } catch (error) {
    console.error('Error exporting to sheets:', error);
    return NextResponse.json(
      { success: false, error: 'Sheets\'e aktarım başarısız' },
      { status: 500 }
    );
  }
}
