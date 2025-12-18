// Keyword Grouping Utilities
// Kural tabanlı gruplama: Markalar, Ebatlar, Fiyat, Sorular

export interface KeywordResult {
  id?: number;
  keyword: string;
  source?: string;
  search_volume?: number | null;
  keyword_difficulty?: number | null;
  competition?: string | null;
  cpc?: number | null;
  search_intent?: string | null;
  keyword_cluster?: string | null;
  opportunity_score?: number | null;
  content_priority?: string | null;
}

export interface KeywordSubgroup {
  name: string;
  displayName: string;
  keywords: KeywordResult[];
  totalVolume: number;
}

export interface KeywordGroup {
  id: string;
  name: string;
  icon: string;
  keywords: KeywordResult[];
  subgroups?: KeywordSubgroup[];
  totalVolume: number;
}

// Yaygın lastik markaları
const TIRE_BRANDS = [
  'petlas', 'lassa', 'goodyear', 'pirelli', 'michelin', 'continental',
  'bridgestone', 'nokian', 'nokia', 'hankook', 'dunlop', 'falken',
  'yokohama', 'toyo', 'kumho', 'nexen', 'riken', 'barum', 'milestone',
  'firestone', 'bfgoodrich', 'general tire', 'maxxis', 'cooper',
  'gt radial', 'sailun', 'triangle', 'linglong', 'westlake', 'goodride',
  'debica', 'sava', 'matador', 'kormoran', 'fulda', 'semperit', 'uniroyal',
  'kleber', 'vredestein', 'giti', 'achilles', 'accelera', 'federal',
  'nankang', 'zeetex', 'apollo', 'ceat', 'mrf', 'jk tyre'
];

// Ebat pattern regex - 205/55R16, 205 55 r16, 205/55 16 vb.
const SIZE_PATTERN = /(\d{3})\s*[\/\s]?\s*(\d{2,3})\s*[rR]?\s*(\d{2})/;

// Fiyat ile ilgili kelimeler
const PRICE_KEYWORDS = [
  'fiyat', 'fiyatı', 'fiyatları', 'fiyatlari', 'ucuz', 'indirim',
  'kampanya', 'taksit', 'kredi', 'kaç para', 'ne kadar', 'uygun',
  'ekonomik', 'hesaplı', 'bütçe'
];

// Soru kelimeleri
const QUESTION_KEYWORDS = [
  'nasıl', 'nedir', 'ne zaman', 'hangisi', 'kaç', 'neden', 'niçin',
  'hangi', 'mi', 'mı', 'mu', 'mü', 'ne', 'kim', 'nerede', 'nereden'
];

// Karşılaştırma kelimeleri
const COMPARISON_KEYWORDS = [
  'vs', 'karşılaştırma', 'fark', 'farkı', 'mı yoksa', 'mi yoksa',
  'arasındaki', 'hangisi daha', 'en iyi'
];

/**
 * Keyword'ü normalize et (Türkçe karakterler için)
 */
function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/**
 * Keyword'den marka tespit et
 */
function detectBrand(keyword: string): string | null {
  const normalized = normalizeKeyword(keyword);

  for (const brand of TIRE_BRANDS) {
    const normalizedBrand = normalizeKeyword(brand);
    // Kelime sınırlarında ara
    const regex = new RegExp(`(^|\\s)${normalizedBrand}($|\\s)`, 'i');
    if (regex.test(normalized) || normalized.includes(normalizedBrand)) {
      // Orijinal marka adını capitalize et
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }

  return null;
}

/**
 * Keyword'den ebat tespit et
 */
function detectSize(keyword: string): string | null {
  const match = keyword.match(SIZE_PATTERN);
  if (match) {
    const [, width, ratio, diameter] = match;
    return `${width}/${ratio} R${diameter}`;
  }
  return null;
}

/**
 * Keyword türünü tespit et
 */
function detectKeywordType(keyword: string): 'price' | 'question' | 'comparison' | 'other' {
  const normalized = normalizeKeyword(keyword);

  // Fiyat kontrolü
  for (const priceWord of PRICE_KEYWORDS) {
    if (normalized.includes(normalizeKeyword(priceWord))) {
      return 'price';
    }
  }

  // Karşılaştırma kontrolü
  for (const compWord of COMPARISON_KEYWORDS) {
    if (normalized.includes(normalizeKeyword(compWord))) {
      return 'comparison';
    }
  }

  // Soru kontrolü
  for (const questionWord of QUESTION_KEYWORDS) {
    if (normalized.includes(normalizeKeyword(questionWord))) {
      return 'question';
    }
  }

  return 'other';
}

/**
 * Toplam hacmi hesapla
 */
function calculateTotalVolume(keywords: KeywordResult[]): number {
  return keywords.reduce((sum, kw) => sum + (kw.search_volume || 0), 0);
}

/**
 * Keyword'leri gruplandır
 */
export function groupKeywords(keywords: KeywordResult[]): KeywordGroup[] {
  const brandMap = new Map<string, KeywordResult[]>();
  const sizeMap = new Map<string, KeywordResult[]>();
  const priceKeywords: KeywordResult[] = [];
  const questionKeywords: KeywordResult[] = [];
  const comparisonKeywords: KeywordResult[] = [];
  const otherKeywords: KeywordResult[] = [];

  // Her keyword'ü kategorize et
  const categorized = new Set<number | string>();

  for (const kw of keywords) {
    const kwId = kw.id || kw.keyword;

    // Marka tespiti
    const brand = detectBrand(kw.keyword);
    if (brand) {
      if (!brandMap.has(brand)) {
        brandMap.set(brand, []);
      }
      brandMap.get(brand)!.push(kw);
      categorized.add(kwId);
    }

    // Ebat tespiti
    const size = detectSize(kw.keyword);
    if (size) {
      if (!sizeMap.has(size)) {
        sizeMap.set(size, []);
      }
      sizeMap.get(size)!.push(kw);
      categorized.add(kwId);
    }

    // Tür tespiti
    const type = detectKeywordType(kw.keyword);
    if (type === 'price') {
      priceKeywords.push(kw);
      categorized.add(kwId);
    } else if (type === 'question') {
      questionKeywords.push(kw);
      categorized.add(kwId);
    } else if (type === 'comparison') {
      comparisonKeywords.push(kw);
      categorized.add(kwId);
    }
  }

  // Kategorize edilmemiş keyword'leri "Diğer"e ekle
  for (const kw of keywords) {
    const kwId = kw.id || kw.keyword;
    if (!categorized.has(kwId)) {
      otherKeywords.push(kw);
    }
  }

  // Grupları oluştur
  const groups: KeywordGroup[] = [];

  // Markalar grubu (subgrouplar ile)
  if (brandMap.size > 0) {
    const brandSubgroups: KeywordSubgroup[] = Array.from(brandMap.entries())
      .map(([brand, kws]) => ({
        name: brand.toLowerCase(),
        displayName: brand,
        keywords: kws.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)),
        totalVolume: calculateTotalVolume(kws)
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume);

    const allBrandKeywords = Array.from(brandMap.values()).flat();

    groups.push({
      id: 'brands',
      name: 'Markalar',
      icon: 'tag',
      keywords: allBrandKeywords,
      subgroups: brandSubgroups,
      totalVolume: calculateTotalVolume(allBrandKeywords)
    });
  }

  // Ebatlar grubu (subgrouplar ile)
  if (sizeMap.size > 0) {
    const sizeSubgroups: KeywordSubgroup[] = Array.from(sizeMap.entries())
      .map(([size, kws]) => ({
        name: size,
        displayName: size,
        keywords: kws.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)),
        totalVolume: calculateTotalVolume(kws)
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume);

    const allSizeKeywords = Array.from(sizeMap.values()).flat();

    groups.push({
      id: 'sizes',
      name: 'Ebatlar',
      icon: 'ruler',
      keywords: allSizeKeywords,
      subgroups: sizeSubgroups,
      totalVolume: calculateTotalVolume(allSizeKeywords)
    });
  }

  // Fiyat Aramaları
  if (priceKeywords.length > 0) {
    groups.push({
      id: 'price',
      name: 'Fiyat Aramaları',
      icon: 'dollar-sign',
      keywords: priceKeywords.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)),
      totalVolume: calculateTotalVolume(priceKeywords)
    });
  }

  // Karşılaştırma
  if (comparisonKeywords.length > 0) {
    groups.push({
      id: 'comparison',
      name: 'Karşılaştırma',
      icon: 'git-compare',
      keywords: comparisonKeywords.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)),
      totalVolume: calculateTotalVolume(comparisonKeywords)
    });
  }

  // Sorular
  if (questionKeywords.length > 0) {
    groups.push({
      id: 'questions',
      name: 'Sorular',
      icon: 'help-circle',
      keywords: questionKeywords.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)),
      totalVolume: calculateTotalVolume(questionKeywords)
    });
  }

  // Diğer
  if (otherKeywords.length > 0) {
    groups.push({
      id: 'other',
      name: 'Diğer',
      icon: 'package',
      keywords: otherKeywords.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)),
      totalVolume: calculateTotalVolume(otherKeywords)
    });
  }

  return groups;
}

/**
 * Gruplama istatistiklerini al
 */
export function getGroupingStats(groups: KeywordGroup[]) {
  return {
    totalGroups: groups.length,
    totalKeywords: groups.reduce((sum, g) => sum + g.keywords.length, 0),
    totalVolume: groups.reduce((sum, g) => sum + g.totalVolume, 0),
    byGroup: groups.map(g => ({
      id: g.id,
      name: g.name,
      count: g.keywords.length,
      volume: g.totalVolume,
      subgroupCount: g.subgroups?.length || 0
    }))
  };
}
