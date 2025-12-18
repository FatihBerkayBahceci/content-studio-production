import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'seo_tool_suite',
};

// Turkish character normalization map
const turkishCharMap: { [key: string]: string } = {
  'ı': 'i', 'İ': 'i',
  'ğ': 'g', 'Ğ': 'g',
  'ü': 'u', 'Ü': 'u',
  'ş': 's', 'Ş': 's',
  'ö': 'o', 'Ö': 'o',
  'ç': 'c', 'Ç': 'c'
};

// Normalize keyword for comparison (remove Turkish chars, lowercase)
function normalizeKeyword(keyword: string): string {
  let normalized = keyword.toLowerCase().trim();
  for (const [turkish, ascii] of Object.entries(turkishCharMap)) {
    normalized = normalized.replace(new RegExp(turkish, 'g'), ascii);
  }
  return normalized.replace(/\s+/g, ' ');
}

// Check if keyword has Turkish characters
function hasTurkishChars(str: string): boolean {
  return /[ığüşöçİĞÜŞÖÇ]/.test(str);
}

interface RawKeyword {
  id: number;
  keyword: string;
  search_volume: number | null;
  cpc: number | null;
  competition: string | null;
  competition_index: number | null;
  source: string | null;
  ai_category: string | null;
  created_at: string;
}

// Deduplicate keywords - merge "koltuk takımları" and "koltuk takimlari"
function deduplicateKeywords(keywords: RawKeyword[]): RawKeyword[] {
  const normalizedMap = new Map<string, RawKeyword>();

  for (const kw of keywords) {
    const normalized = normalizeKeyword(kw.keyword);
    const existing = normalizedMap.get(normalized);

    if (!existing) {
      normalizedMap.set(normalized, kw);
    } else {
      // Prefer Turkish characters version, merge volumes
      const currentHasTurkish = hasTurkishChars(kw.keyword);
      const existingHasTurkish = hasTurkishChars(existing.keyword);

      // Calculate merged volume (use max, as they represent same query)
      const mergedVolume = Math.max(kw.search_volume || 0, existing.search_volume || 0);
      const mergedCpc = Math.max(kw.cpc || 0, existing.cpc || 0);

      if (currentHasTurkish && !existingHasTurkish) {
        // Current has Turkish chars - use it
        normalizedMap.set(normalized, {
          ...kw,
          search_volume: mergedVolume || kw.search_volume,
          cpc: mergedCpc || kw.cpc
        });
      } else if (!currentHasTurkish && existingHasTurkish) {
        // Existing has Turkish chars - keep it but update volume
        normalizedMap.set(normalized, {
          ...existing,
          search_volume: mergedVolume || existing.search_volume,
          cpc: mergedCpc || existing.cpc
        });
      } else {
        // Both have or both don't have Turkish chars - keep higher volume one
        if ((kw.search_volume || 0) > (existing.search_volume || 0)) {
          normalizedMap.set(normalized, {
            ...kw,
            search_volume: mergedVolume
          });
        } else {
          normalizedMap.set(normalized, {
            ...existing,
            search_volume: mergedVolume
          });
        }
      }
    }
  }

  return Array.from(normalizedMap.values());
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Get project info
    const [projects] = await connection.execute(
      `SELECT id FROM keyword_projects WHERE uuid = ? OR id = ? LIMIT 1`,
      [projectId, projectId]
    );

    if (!Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json({ success: false, error: 'Proje bulunamadı' }, { status: 404 });
    }

    const project = projects[0] as any;
    const pid = project.id;

    // Get raw keywords with ai_category
    const [rawKeywords] = await connection.execute(
      `SELECT
        id,
        keyword,
        search_volume,
        cpc,
        competition,
        competition_index,
        source,
        ai_category,
        created_at
      FROM keyword_results_raw
      WHERE project_id = ?
      ORDER BY search_volume DESC`,
      [pid]
    );

    await connection.end();

    // Deduplicate keywords (merge "koltuk takımları" and "koltuk takimlari")
    const rawKeywordsArray = rawKeywords as RawKeyword[];
    const originalCount = rawKeywordsArray.length;
    const deduplicatedKeywords = deduplicateKeywords(rawKeywordsArray);
    const duplicatesRemoved = originalCount - deduplicatedKeywords.length;

    // Sort by search volume desc after deduplication
    deduplicatedKeywords.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));

    // Calculate stats from deduplicated data
    const volumes = deduplicatedKeywords.map(k => k.search_volume || 0);
    const totalVolume = volumes.reduce((sum, v) => sum + v, 0);
    const avgVolume = deduplicatedKeywords.length > 0 ? totalVolume / deduplicatedKeywords.length : 0;
    const maxVolume = volumes.length > 0 ? Math.max(...volumes) : 0;
    const minVolume = volumes.length > 0 ? Math.min(...volumes) : 0;

    console.log(`[Keywords Raw] Deduplicated: ${originalCount} -> ${deduplicatedKeywords.length} (${duplicatesRemoved} Turkish char duplicates merged)`);

    return NextResponse.json({
      success: true,
      data: deduplicatedKeywords,
      stats: {
        total: deduplicatedKeywords.length,
        avg_volume: Math.round(avgVolume),
        total_volume: totalVolume,
        max_volume: maxVolume,
        min_volume: minVolume,
      },
      original_count: originalCount,
      duplicates_merged: duplicatesRemoved
    });

  } catch (error: any) {
    console.error('Error fetching raw keywords:', error);
    if (connection) await connection.end();
    return NextResponse.json(
      { success: false, error: error.message || 'Veritabanı hatası' },
      { status: 500 }
    );
  }
}
