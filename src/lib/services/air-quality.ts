import { cache } from '@/lib/services/cache';

const AIR_QUALITY_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const CACHE_TTL_MS = 60 * 60 * 1000;

export interface AirQualityForecast {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    pm2_5: number[];
    pm10: number[];
    nitrogen_dioxide: number[];
    ozone: number[];
    sulphur_dioxide: number[];
    carbon_monoxide: number[];
    dust: number[];
    uv_index: number[];
    european_aqi: number[];
  };
}

const HOURLY_PARAMS = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
  'dust',
  'uv_index',
  'european_aqi',
].join(',');

export async function getAirQuality(
  lat: number,
  lng: number,
): Promise<AirQualityForecast | null> {
  const cacheKey = `airquality:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cache.get<AirQualityForecast>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(AIR_QUALITY_API);
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lng.toString());
    url.searchParams.set('hourly', HOURLY_PARAMS);
    url.searchParams.set('timezone', 'auto');

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data: AirQualityForecast = await res.json();
    cache.set(cacheKey, data, CACHE_TTL_MS);
    return data;
  } catch {
    return null;
  }
}
