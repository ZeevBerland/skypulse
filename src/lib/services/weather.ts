import { cache } from '@/lib/services/cache';

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 60 * 60 * 1000;

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

interface CurrentWeather {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  precipitation: number;
  rain: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
  is_day: number;
}

interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  precipitation: number[];
  rain: number[];
  weather_code: number[];
  cloud_cover: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  visibility: number[];
  uv_index: number[];
  is_day: number[];
}

interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  weather_code: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
  wind_speed_10m_max: number[];
}

const HOURLY_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'rain',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_gusts_10m',
  'visibility',
  'uv_index',
  'is_day',
].join(',');

const DAILY_PARAMS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'weather_code',
  'sunrise',
  'sunset',
  'uv_index_max',
  'wind_speed_10m_max',
].join(',');

const CURRENT_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'rain',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_gusts_10m',
  'is_day',
].join(',');

export async function getWeatherForecast(
  lat: number,
  lng: number,
  forecastDays: number = 7,
): Promise<WeatherForecast | null> {
  const cacheKey = `weather:${lat.toFixed(4)},${lng.toFixed(4)}:${forecastDays}`;
  const cached = cache.get<WeatherForecast>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(FORECAST_API);
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lng.toString());
    url.searchParams.set('hourly', HOURLY_PARAMS);
    url.searchParams.set('daily', DAILY_PARAMS);
    url.searchParams.set('current', CURRENT_PARAMS);
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', forecastDays.toString());

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data: WeatherForecast = await res.json();
    cache.set(cacheKey, data, CACHE_TTL_MS);
    return data;
  } catch {
    return null;
  }
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export function getWeatherDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Unknown';
}
