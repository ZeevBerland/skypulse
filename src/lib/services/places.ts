import { cache } from '@/lib/services/cache';
import { generateWithMapsGrounding } from '@/lib/services/gemini';
import type { Place, PlaceCategory } from '@/lib/types/places';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const COMPETITOR_TYPES: Record<string, string[]> = {
  pharmacy: ['pharmacy', 'drugstore', 'parapharmacy'],
  convenience_store: ['convenience store', 'mini-market', 'supermarket', 'grocery'],
  cafe: ['cafe', 'coffee shop', 'bakery', 'restaurant'],
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

function categorizePlace(placeType: string, businessType: string): PlaceCategory {
  const competitorKeywords = COMPETITOR_TYPES[businessType] ?? [];
  const lower = placeType.toLowerCase();
  const isCompetitor = competitorKeywords.some((kw) => lower.includes(kw));
  return isCompetitor ? 'competitor' : 'demand_anchor';
}

export async function getNearbyPlaces(
  lat: number,
  lng: number,
  businessType: string,
): Promise<Place[]> {
  const cacheKey = `places:${lat.toFixed(4)},${lng.toFixed(4)}:${businessType}`;
  const cached = cache.get<Place[]>(cacheKey);
  if (cached) return cached;

  try {
    const competitorTypes = COMPETITOR_TYPES[businessType]?.join(', ') ?? businessType;
    const demandTypes = DEMAND_ANCHOR_TYPES.join(', ');

    const prompt = `List all notable places within 1km of this location. Include:
1. Competitors: ${competitorTypes}
2. Demand anchors: ${demandTypes}

For each place, provide a JSON array with objects having these exact fields:
- "name": string (business/place name)
- "address": string (street address)
- "lat": number (latitude)
- "lng": number (longitude)  
- "type": string (e.g. "pharmacy", "bus station", "cafe")
- "distance_m": number (estimated distance in meters from the center point)
- "description": string (one-line description)

Return ONLY the JSON array, no other text.`;

    const raw = await generateWithMapsGrounding(prompt, lat, lng);

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed: Array<{
      name: string;
      address: string;
      lat: number;
      lng: number;
      type: string;
      distance_m?: number;
      description?: string;
    }> = JSON.parse(jsonMatch[0]);

    const places: Place[] = parsed.map((p) => ({
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      type: p.type,
      category: categorizePlace(p.type, businessType),
      distance_m: p.distance_m,
      description: p.description,
    }));

    cache.set(cacheKey, places, CACHE_TTL_MS);
    return places;
  } catch {
    return [];
  }
}
