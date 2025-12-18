import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { canAccessClient } from '@/lib/auth/permissions';

interface RouteParams {
  params: { projectId: string };
}

interface KeywordResult {
  id?: number;
  keyword: string;
  search_volume?: number | null;
  cpc?: number | null;
  competition?: string | null;
}

interface AICategory {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
  description?: string;
}

// Turkish character normalization map
const turkishCharMap: { [key: string]: string } = {
  'ı': 'i', 'İ': 'I',
  'ğ': 'g', 'Ğ': 'G',
  'ü': 'u', 'Ü': 'U',
  'ş': 's', 'Ş': 'S',
  'ö': 'o', 'Ö': 'O',
  'ç': 'c', 'Ç': 'C'
};

// Normalize keyword for comparison (remove Turkish chars, lowercase)
function normalizeKeyword(keyword: string): string {
  let normalized = keyword.toLowerCase().trim();
  for (const [turkish, ascii] of Object.entries(turkishCharMap)) {
    normalized = normalized.replace(new RegExp(turkish, 'g'), ascii);
  }
  // Remove extra spaces and common suffixes
  normalized = normalized.replace(/\s+/g, ' ');
  return normalized;
}

// Deduplicate keywords - keep the one with Turkish characters if both exist
function deduplicateKeywords(keywords: KeywordResult[]): KeywordResult[] {
  const normalizedMap = new Map<string, KeywordResult>();

  for (const kw of keywords) {
    const normalized = normalizeKeyword(kw.keyword);
    const existing = normalizedMap.get(normalized);

    if (!existing) {
      normalizedMap.set(normalized, kw);
    } else {
      // Prefer the keyword with Turkish characters (more accurate)
      const hasTurkishChars = (str: string) => /[ığüşöçİĞÜŞÖÇ]/.test(str);
      const currentHasTurkish = hasTurkishChars(kw.keyword);
      const existingHasTurkish = hasTurkishChars(existing.keyword);

      if (currentHasTurkish && !existingHasTurkish) {
        // Current has Turkish chars, existing doesn't - prefer current
        // But keep the higher search volume
        normalizedMap.set(normalized, {
          ...kw,
          search_volume: Math.max(kw.search_volume || 0, existing.search_volume || 0) || kw.search_volume,
          cpc: kw.cpc || existing.cpc
        });
      } else if (!currentHasTurkish && existingHasTurkish) {
        // Existing has Turkish chars - keep it but update metrics if needed
        normalizedMap.set(normalized, {
          ...existing,
          search_volume: Math.max(kw.search_volume || 0, existing.search_volume || 0) || existing.search_volume,
          cpc: existing.cpc || kw.cpc
        });
      } else {
        // Both have or both don't have Turkish chars - keep higher volume
        if ((kw.search_volume || 0) > (existing.search_volume || 0)) {
          normalizedMap.set(normalized, kw);
        }
      }
    }
  }

  return Array.from(normalizedMap.values());
}

// GET /api/projects/[projectId]/keywords-categorize - Mevcut kategorileri getir
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Get the project with categorization status
    const projectSql = `
      SELECT id, client_id, main_keyword, ai_categories, ai_categorization_done
      FROM keyword_projects
      WHERE uuid = ? OR id = ?
      LIMIT 1
    `;
    const projects = await query(projectSql, [projectId, projectId]);
    const project = Array.isArray(projects) && projects.length > 0 ? projects[0] : null;

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proje bulunamadı' },
        { status: 404 }
      );
    }

    // Check access
    if (session.user.role !== 'admin' && !canAccessClient(session.user, project.client_id)) {
      return NextResponse.json(
        { success: false, error: 'Bu projeye erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    // Handle TINYINT which may come as number, string, or Buffer from MySQL
    const isDone = project.ai_categorization_done == 1 || project.ai_categorization_done === true;

    // Parse categories - handle both string and already-parsed JSON
    let categories = null;
    if (project.ai_categories) {
      try {
        categories = typeof project.ai_categories === 'string'
          ? JSON.parse(project.ai_categories)
          : project.ai_categories;
      } catch (e) {
        console.error('Failed to parse ai_categories:', e);
      }
    }

    return NextResponse.json({
      success: true,
      categorization_done: isDone,
      categories: categories
    });
  } catch (error) {
    console.error('Error getting categorization status:', error);
    return NextResponse.json(
      { success: false, error: 'Kategorileme durumu alınamadı' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/keywords-categorize - AI ile kelimeleri kategorize et
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
    const { keywords, force = false } = body as { keywords?: KeywordResult[]; force?: boolean };

    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kategorize edilecek keyword bulunamadı' },
        { status: 400 }
      );
    }

    // Get the project to check permissions and categorization status
    const projectSql = `
      SELECT id, client_id, main_keyword, ai_categories, ai_categorization_done
      FROM keyword_projects
      WHERE uuid = ? OR id = ?
      LIMIT 1
    `;
    const projects = await query(projectSql, [projectId, projectId]);
    const project = Array.isArray(projects) && projects.length > 0 ? projects[0] : null;

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proje bulunamadı' },
        { status: 404 }
      );
    }

    // Check access
    if (session.user.role !== 'admin' && !canAccessClient(session.user, project.client_id)) {
      return NextResponse.json(
        { success: false, error: 'Bu projeye erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    // If already categorized and not forcing, return existing categories
    const alreadyCategorized = project.ai_categorization_done == 1 || project.ai_categorization_done === true;
    if (alreadyCategorized && !force && project.ai_categories) {
      console.log(`[Keywords Categorize] Project ${project.id} already categorized, returning cached`);
      try {
        const cachedCategories = typeof project.ai_categories === 'string'
          ? JSON.parse(project.ai_categories)
          : project.ai_categories;
        return NextResponse.json({
          success: true,
          categories: cachedCategories,
          cached: true,
          ai_source: 'database'
        });
      } catch (e) {
        console.error('Failed to parse cached categories, will re-run AI:', e);
      }
    }

    // First deduplicate keywords (handle masaustu vs masaüstü)
    const originalCount = keywords.length;
    const deduplicatedKeywords = deduplicateKeywords(keywords);
    const duplicatesRemoved = originalCount - deduplicatedKeywords.length;

    console.log(`[Keywords Categorize] Deduplicated: ${originalCount} -> ${deduplicatedKeywords.length} (${duplicatesRemoved} duplicates removed)`);

    // Prepare keyword list for AI (limit to first 500 for token efficiency)
    const keywordsToAnalyze = deduplicatedKeywords.slice(0, 500);
    const keywordList = keywordsToAnalyze.map((kw, i) => `${i + 1}. ${kw.keyword}`).join('\n');

    // Build AI prompt
    const prompt = `Aşağıdaki ${keywordsToAnalyze.length} anahtar kelimeyi analiz et ve kategorilere ayır.

Ana Konu: "${project.main_keyword}"

Anahtar Kelimeler:
${keywordList}

KURALLAR:
1. Kelimelere bakarak anlamlı kategoriler oluştur (Markalar, Ebatlar/Boyutlar, Fiyat Aramaları, Sorular, Karşılaştırmalar, vs.)
2. Her kategori için unique bir ID (küçük harf, tire ile), açıklayıcı bir isim ve uygun bir lucide icon adı belirt
3. Her kelimeyi sadece BİR kategoriye ata
4. Minimum 3, maksimum 8 kategori oluştur
5. "Diğer" kategorisi olmasın, her kelime anlamlı bir kategoriye girmeli

ÇIKTI FORMATI (sadece JSON, başka bir şey yazma):
{
  "categories": [
    {
      "id": "category-id",
      "name": "Kategori Adı",
      "icon": "lucide-icon-name",
      "description": "Bu kategori hakkında kısa açıklama",
      "keywords": [1, 5, 12, 23]
    }
  ]
}

icon değerleri şunlardan biri olabilir: tag, ruler, dollar-sign, help-circle, git-compare, package, building-2, car, star, zap, heart, shield, clock, map-pin, users, shopping-cart, trending-up, search, settings

JSON:`;

    // Call Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { success: false, error: 'AI API yapılandırması eksik' },
        { status: 500 }
      );
    }

    const startTime = Date.now();
    let aiResponse: any = null;
    let aiSource = 'none';

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4096
            }
          })
        }
      );

      const data = await response.json();

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const textContent = data.candidates[0].content.parts[0].text;
        // Parse JSON from response
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            aiResponse = JSON.parse(jsonMatch[0]);
            aiSource = 'gemini';
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
          }
        }
      }
    } catch (aiError) {
      console.error('Gemini API error:', aiError);
    }

    const responseTime = Date.now() - startTime;

    // If AI failed, use fallback rule-based categorization
    if (!aiResponse?.categories) {
      aiResponse = generateFallbackCategories(keywordsToAnalyze);
      aiSource = 'fallback';
    }

    // Map keyword indices to actual keywords
    const mappedCategories: AICategory[] = aiResponse.categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || 'package',
      description: cat.description,
      keywords: (cat.keywords || [])
        .filter((idx: number) => idx > 0 && idx <= keywordsToAnalyze.length)
        .map((idx: number) => keywordsToAnalyze[idx - 1].keyword)
    }));

    // Log API usage
    try {
      await query(`
        INSERT INTO api_usage_tracking
        (client_id, tool_name, project_id, workflow_name, api_provider, model_name, tokens_input, tokens_output, requests_count, response_time_ms, was_successful)
        VALUES (?, 'tool1', ?, 'keywords-categorize', 'google', 'gemini-2.0-flash', ?, ?, 1, ?, ?)
      `, [
        project.client_id,
        project.id,
        Math.round(prompt.length / 4), // Approximate input tokens
        Math.round(JSON.stringify(aiResponse).length / 4), // Approximate output tokens
        responseTime,
        aiSource !== 'fallback' ? 1 : 0
      ]);
    } catch (logError) {
      console.error('Failed to log API usage:', logError);
    }

    // Save categories to database for caching
    try {
      // 1. Save categories to keyword_projects table
      await query(`
        UPDATE keyword_projects
        SET ai_categories = ?, ai_categorization_done = 1, updated_at = NOW()
        WHERE id = ?
      `, [JSON.stringify(mappedCategories), project.id]);

      console.log(`[Keywords Categorize] Saved ${mappedCategories.length} categories to project ${project.id}`);

      // 2. Update each keyword_result with its category
      // Create a map of keyword -> category
      const keywordToCategoryMap = new Map<string, string>();
      for (const cat of mappedCategories) {
        for (const kw of cat.keywords) {
          keywordToCategoryMap.set(kw.toLowerCase(), cat.id);
        }
      }

      // Batch update keywords with their categories in BOTH tables
      const updatePromises: Promise<any>[] = [];
      const entries = Array.from(keywordToCategoryMap.entries());
      for (const entry of entries) {
        const keyword = entry[0];
        const categoryId = entry[1];
        // Update keyword_results
        updatePromises.push(
          query(`
            UPDATE keyword_results
            SET ai_category = ?
            WHERE project_id = ? AND LOWER(keyword) = ?
          `, [categoryId, project.id, keyword])
        );
        // Update keyword_results_raw
        updatePromises.push(
          query(`
            UPDATE keyword_results_raw
            SET ai_category = ?
            WHERE project_id = ? AND LOWER(keyword) = ?
          `, [categoryId, project.id, keyword])
        );
      }

      // Execute updates in batches of 50 to avoid overwhelming the DB
      const batchSize = 50;
      for (let i = 0; i < updatePromises.length; i += batchSize) {
        await Promise.all(updatePromises.slice(i, i + batchSize));
      }

      console.log(`[Keywords Categorize] Updated ${keywordToCategoryMap.size} keywords with categories in both tables`);
    } catch (saveError) {
      console.error('Failed to save categories to database:', saveError);
      // Don't fail the request, just log the error - categories will still be returned
    }

    return NextResponse.json({
      success: true,
      categories: mappedCategories,
      keywords: keywordsToAnalyze, // Return deduplicated keywords
      ai_source: aiSource,
      keyword_count: keywordsToAnalyze.length,
      original_count: originalCount,
      duplicates_removed: duplicatesRemoved,
      response_time_ms: responseTime,
      saved_to_db: true
    });
  } catch (error) {
    console.error('Error categorizing keywords:', error);
    return NextResponse.json(
      { success: false, error: 'Kategorileme işlemi başarısız oldu' },
      { status: 500 }
    );
  }
}

// Fallback rule-based categorization
function generateFallbackCategories(keywords: KeywordResult[]): { categories: any[] } {
  const categories: { [key: string]: number[] } = {
    price: [],
    question: [],
    brand: [],
    comparison: [],
    other: []
  };

  const priceWords = ['fiyat', 'fiyatı', 'fiyatları', 'ucuz', 'indirim', 'kampanya', 'kaç para', 'ne kadar'];
  const questionWords = ['nasıl', 'nedir', 'ne zaman', 'hangisi', 'kaç', 'neden', 'hangi', 'nerede'];
  const comparisonWords = ['vs', 'karşılaştırma', 'fark', 'mı yoksa', 'arasındaki', 'hangisi daha', 'en iyi'];
  // Common brand patterns - detect capitalized words or known brand patterns
  const brandPattern = /\b[A-Z][a-z]+\b/;

  keywords.forEach((kw, idx) => {
    const lower = kw.keyword.toLowerCase();
    const num = idx + 1;

    if (priceWords.some(w => lower.includes(w))) {
      categories.price.push(num);
    } else if (questionWords.some(w => lower.includes(w))) {
      categories.question.push(num);
    } else if (comparisonWords.some(w => lower.includes(w))) {
      categories.comparison.push(num);
    } else if (brandPattern.test(kw.keyword)) {
      categories.brand.push(num);
    } else {
      categories.other.push(num);
    }
  });

  const result: any[] = [];

  if (categories.price.length > 0) {
    result.push({
      id: 'price',
      name: 'Fiyat Aramaları',
      icon: 'dollar-sign',
      description: 'Fiyat ve maliyet ile ilgili aramalar',
      keywords: categories.price
    });
  }

  if (categories.question.length > 0) {
    result.push({
      id: 'questions',
      name: 'Sorular',
      icon: 'help-circle',
      description: 'Soru formatındaki aramalar',
      keywords: categories.question
    });
  }

  if (categories.comparison.length > 0) {
    result.push({
      id: 'comparison',
      name: 'Karşılaştırmalar',
      icon: 'git-compare',
      description: 'Ürün veya hizmet karşılaştırmaları',
      keywords: categories.comparison
    });
  }

  if (categories.brand.length > 0) {
    result.push({
      id: 'brands',
      name: 'Markalar',
      icon: 'tag',
      description: 'Marka ile ilgili aramalar',
      keywords: categories.brand
    });
  }

  if (categories.other.length > 0) {
    result.push({
      id: 'general',
      name: 'Genel',
      icon: 'package',
      description: 'Diğer genel aramalar',
      keywords: categories.other
    });
  }

  return { categories: result };
}
