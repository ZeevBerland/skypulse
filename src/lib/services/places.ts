import { cache } from '@/lib/services/cache';
import { generateWithMapsGrounding } from '@/lib/services/gemini';
import { savePlanCache, getPlanCache } from '@/lib/db';
import type { Place, PlaceCategory } from '@/lib/types/places';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const COMPETITOR_TYPES: Record<string, string[]> = {
  pharmacy: ['pharmacy', 'drugstore', 'parapharmacy', 'drug store', 'chemist'],
  convenience_store: ['convenience', 'mini-market', 'minimarket', 'supermarket', 'grocery', 'kiosk', 'bodega', 'corner store', 'market'],
  cafe: ['cafe', 'café', 'coffee', 'bakery', 'restaurant', 'bistro', 'bar', 'juice', 'tea house', 'food'],
};

const DEMAND_ANCHOR_TYPES = [
  'bus station',
  'train station',
  'school',
  'office building',
  'shopping mall',
  'hospital',
  'university',
  'park',
  'beach',
  'hotel',
  'event venue',
];

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function categorizePlace(placeType: string, businessType: string): PlaceCategory {
  const competitorKeywords = COMPETITOR_TYPES[businessType] ?? [];
  const lower = placeType.toLowerCase();
  const isCompetitor = competitorKeywords.some((kw) => lower.includes(kw));
  return isCompetitor ? 'competitor' : 'demand_anchor';
}

function filterOwnBusiness(
  places: Place[],
  lat: number,
  lng: number,
  businessName?: string,
): Place[] {
  const nameLower = businessName?.toLowerCase() ?? '';
  if (!nameLower) return places;
  return places.filter((p) => {
    if (p.name.toLowerCase().includes(nameLower)) return false;
    if (nameLower.includes(p.name.toLowerCase())) return false;
    const dist = p.distance_m ?? distanceMeters(lat, lng, p.lat, p.lng);
    if (dist < 30) return false;
    return true;
  });
}

export async function getNearbyPlaces(
  lat: number,
  lng: number,
  businessType: string,
  businessId?: string,
  skipCache = false,
  businessName?: string,
): Promise<Place[]> {
  const cacheKey = `places:${lat.toFixed(4)},${lng.toFixed(4)}:${businessType}`;

  if (!skipCache) {
    const memCached = cache.get<Place[]>(cacheKey);
    if (memCached) {
      console.log(`[Places] Memory cache hit: ${memCached.length} places`);
      return filterOwnBusiness(memCached, lat, lng, businessName);
    }

    if (businessId) {
      try {
        const dbCached = await getPlanCache(businessId, 'places');
        if (dbCached && Array.isArray(dbCached) && dbCached.length > 0) {
          const recategorized = (dbCached as Place[]).map(p => ({
            ...p,
            category: categorizePlace(p.type, businessType),
          }));
          cache.set(cacheKey, recategorized, CACHE_TTL_MS);
          console.log(`[Places] DB cache hit: ${recategorized.length} places`);
          return filterOwnBusiness(recategorized, lat, lng, businessName);
        }
      } catch { /* fall through to Gemini */ }
    }
  }

  const fetchFromGemini = async (): Promise<Place[]> => {
    const competitorTypes = COMPETITOR_TYPES[businessType]?.join(', ') ?? businessType;
    const demandTypes = DEMAND_ANCHOR_TYPES.join(', ');

    const excludeClause = businessName ? `\nIMPORTANT: Do NOT include "${businessName}" — that is my own business.` : '';
    const prompt = `Find nearby businesses and points of interest within 1 kilometer of this location.

I need to know about these types of places:
- Competitors such as: ${competitorTypes}
- Demand anchors such as: ${demandTypes}
${excludeClause}
Please search for real places nearby and tell me what you find. For each place, include the name, address, approximate latitude and longitude, what type of place it is, the estimated distance in meters, and a brief one-line description.

Format your response as a JSON array where each object has these fields: "name", "address", "lat", "lng", "type", "distance_m", "description".`;

    const raw = await generateWithMapsGrounding(prompt, lat, lng);
    console.log(`[Places] Gemini raw response length: ${raw.length}, first 300 chars:`, raw.slice(0, 300));

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('[Places] No JSON array found in Gemini response');
      return [];
    }

    const parsed: Array<{
      name: string;
      address: string;
      lat: number;
      lng: number;
      type: string;
      distance_m?: number;
      description?: string;
    }> = JSON.parse(jsonMatch[0]);

    return parsed.map((p) => ({
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      type: p.type,
      category: categorizePlace(p.type, businessType),
      distance_m: p.distance_m,
      description: p.description,
    }));
  };

  try {
    let places = await fetchFromGemini();
    console.log(`[Places] Gemini attempt 1: ${places.length} raw places`);

    if (places.length === 0) {
      console.log('[Places] Empty result, retrying once...');
      places = await fetchFromGemini();
      console.log(`[Places] Gemini attempt 2: ${places.length} raw places`);
    }

    places = filterOwnBusiness(places, lat, lng, businessName);

    if (places.length > 0) {
      cache.set(cacheKey, places, CACHE_TTL_MS);
      if (businessId) {
        savePlanCache(businessId, 'places', places).catch(() => {});
      }
    }

    console.log(`[Places] Returning ${places.length} places for ${businessType} at ${lat.toFixed(4)},${lng.toFixed(4)}`);
    return places;
  } catch (error) {
    console.error('[Places] Gemini discovery failed:', error instanceof Error ? error.message : error);
    if (businessId) {
      try {
        const dbFallback = await getPlanCache(businessId, 'places');
        if (dbFallback && Array.isArray(dbFallback) && dbFallback.length > 0) {
          console.log(`[Places] Using DB fallback after Gemini failure: ${(dbFallback as Place[]).length} places`);
          return filterOwnBusiness(dbFallback as Place[], lat, lng, businessName);
        }
      } catch { /* no fallback */ }
    }
    return [];
  }
}
