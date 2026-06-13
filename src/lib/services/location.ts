import { cache } from '@/lib/services/cache';

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

export async function geocode(
  query: string,
): Promise<{ lat: number; lng: number; name: string; country: string } | null> {
  const cacheKey = `geocode:${query.toLowerCase().trim()}`;
  const cached = cache.get<{ lat: number; lng: number; name: string; country: string }>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(GEOCODING_API);
    url.searchParams.set('name', query);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data: GeocodingResponse = await res.json();
    if (!data.results?.length) return null;

    const top = data.results[0];
    const result = {
      lat: top.latitude,
      lng: top.longitude,
      name: top.name,
      country: top.country,
    };

    cache.set(cacheKey, result, CACHE_TTL_MS);
    return result;
  } catch {
    return null;
  }
}

export async function searchLocations(
  query: string,
): Promise<Array<{ lat: number; lng: number; name: string; country: string; admin1?: string }>> {
  const cacheKey = `locations:${query.toLowerCase().trim()}`;
  const cached = cache.get<Array<{ lat: number; lng: number; name: string; country: string; admin1?: string }>>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(GEOCODING_API);
    url.searchParams.set('name', query);
    url.searchParams.set('count', '10');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data: GeocodingResponse = await res.json();
    if (!data.results?.length) return [];

    const results = data.results.map((r) => ({
      lat: r.latitude,
      lng: r.longitude,
      name: r.name,
      country: r.country,
      admin1: r.admin1,
    }));

    cache.set(cacheKey, results, CACHE_TTL_MS);
    return results;
  } catch {
    return [];
  }
}
