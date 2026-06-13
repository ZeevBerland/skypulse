import type { WeatherForecast } from './weather';
import type { AirQualityForecast } from './air-quality';

export interface NormalizedDaySignals {
  date: string;
  heat_score: number;
  cold_score: number;
  rain_risk: number;
  wind_score: number;
  uv_score: number;
  air_quality_score: number;
  dust_score: number;
  visibility_score: number;
  temp_max: number;
  temp_min: number;
  feels_like_max: number;
  precipitation_probability_max: number;
  precipitation_sum: number;
  wind_max: number;
  uv_max: number;
  weather_code: number;
  sunrise: string;
  sunset: string;
}

export interface HourlySignalBlock {
  start_hour: string;
  end_hour: string;
  avg_temp: number;
  avg_feels_like: number;
  max_precipitation_prob: number;
  total_precipitation: number;
  max_wind: number;
  avg_uv: number;
  avg_cloud_cover: number;
  weather_codes: number[];
  is_day: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, minThreshold: number, maxThreshold: number): number {
  if (value <= minThreshold) return 0;
  if (value >= maxThreshold) return 1;
  return (value - minThreshold) / (maxThreshold - minThreshold);
}

export function normalizeDailyWeather(
  weather: WeatherForecast,
  airQuality: AirQualityForecast | null,
  dayIndex: number,
): NormalizedDaySignals {
  const daily = weather.daily;
  const date = daily.time[dayIndex];
  const tempMax = daily.temperature_2m_max[dayIndex];
  const tempMin = daily.temperature_2m_min[dayIndex];
  const feelsLikeMax = daily.apparent_temperature_max[dayIndex];
  const precipProb = daily.precipitation_probability_max[dayIndex];
  const precipSum = daily.precipitation_sum[dayIndex];
  const windMax = daily.wind_speed_10m_max[dayIndex];
  const uvMax = daily.uv_index_max[dayIndex];
  const weatherCode = daily.weather_code[dayIndex];

  const heat_score = clamp(normalize(feelsLikeMax, 28, 42), 0, 1);
  const cold_score = clamp(normalize(10 - tempMin, 0, 15), 0, 1);
  const rain_risk = clamp(precipProb / 100, 0, 1);
  const wind_score = clamp(normalize(windMax, 20, 60), 0, 1);
  const uv_score = clamp(normalize(uvMax, 5, 11), 0, 1);

  let air_quality_score = 0;
  let dust_score = 0;
  if (airQuality) {
    const dayStart = dayIndex * 24;
    const dayEnd = Math.min(dayStart + 24, airQuality.hourly.european_aqi.length);
    const dayAqi = airQuality.hourly.european_aqi.slice(dayStart, dayEnd);
    const dayDust = airQuality.hourly.dust.slice(dayStart, dayEnd);
    const dayPm10 = airQuality.hourly.pm10.slice(dayStart, dayEnd);

    const maxAqi = Math.max(...dayAqi.filter(v => v != null));
    const maxDust = Math.max(...dayDust.filter(v => v != null));
    const maxPm10 = Math.max(...dayPm10.filter(v => v != null));

    air_quality_score = clamp(normalize(maxAqi, 50, 150), 0, 1);
    dust_score = clamp(
      Math.max(normalize(maxDust, 20, 100), normalize(maxPm10, 40, 100)),
      0,
      1,
    );
  }

  const visibility_score = 1;

  return {
    date,
    heat_score,
    cold_score,
    rain_risk,
    wind_score,
    uv_score,
    air_quality_score,
    dust_score,
    visibility_score,
    temp_max: tempMax,
    temp_min: tempMin,
    feels_like_max: feelsLikeMax,
    precipitation_probability_max: precipProb,
    precipitation_sum: precipSum,
    wind_max: windMax,
    uv_max: uvMax,
    weather_code: weatherCode,
    sunrise: daily.sunrise[dayIndex],
    sunset: daily.sunset[dayIndex],
  };
}

export function buildHourlyBlocks(
  weather: WeatherForecast,
  date: string,
  blockSizeHours: number = 3,
): HourlySignalBlock[] {
  const hourly = weather.hourly;
  const blocks: HourlySignalBlock[] = [];

  const dayHourIndices: number[] = [];
  for (let i = 0; i < hourly.time.length; i++) {
    if (hourly.time[i].startsWith(date)) {
      dayHourIndices.push(i);
    }
  }

  for (let b = 0; b < dayHourIndices.length; b += blockSizeHours) {
    const blockIndices = dayHourIndices.slice(b, b + blockSizeHours);
    if (blockIndices.length === 0) continue;

    const startIdx = blockIndices[0];
    const endIdx = blockIndices[blockIndices.length - 1];

    const temps = blockIndices.map(i => hourly.temperature_2m[i]);
    const feelsLike = blockIndices.map(i => hourly.apparent_temperature[i]);
    const precipProb = blockIndices.map(i => hourly.precipitation_probability[i]);
    const precip = blockIndices.map(i => hourly.precipitation[i]);
    const wind = blockIndices.map(i => hourly.wind_speed_10m[i]);
    const uv = blockIndices.map(i => hourly.uv_index[i]);
    const cloud = blockIndices.map(i => hourly.cloud_cover[i]);
    const codes = blockIndices.map(i => hourly.weather_code[i]);
    const isDay = blockIndices.some(i => hourly.is_day[i] === 1);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    blocks.push({
      start_hour: hourly.time[startIdx],
      end_hour: hourly.time[endIdx],
      avg_temp: Math.round(avg(temps) * 10) / 10,
      avg_feels_like: Math.round(avg(feelsLike) * 10) / 10,
      max_precipitation_prob: Math.max(...precipProb),
      total_precipitation: Math.round(precip.reduce((a, b) => a + b, 0) * 10) / 10,
      max_wind: Math.max(...wind),
      avg_uv: Math.round(avg(uv) * 10) / 10,
      avg_cloud_cover: Math.round(avg(cloud)),
      weather_codes: codes,
      is_day: isDay,
    });
  }

  return blocks;
}

export function buildSignalContextSummary(signals: NormalizedDaySignals): string {
  const lines: string[] = [
    `Date: ${signals.date}`,
    `Temperature: ${signals.temp_min}°C - ${signals.temp_max}°C (feels like up to ${signals.feels_like_max}°C)`,
    `Heat Score: ${signals.heat_score.toFixed(2)} | Cold Score: ${signals.cold_score.toFixed(2)}`,
    `Rain Risk: ${signals.rain_risk.toFixed(2)} (max prob: ${signals.precipitation_probability_max}%, total: ${signals.precipitation_sum}mm)`,
    `Wind Score: ${signals.wind_score.toFixed(2)} (max: ${signals.wind_max} km/h)`,
    `UV Score: ${signals.uv_score.toFixed(2)} (max index: ${signals.uv_max})`,
    `Air Quality Score: ${signals.air_quality_score.toFixed(2)} | Dust Score: ${signals.dust_score.toFixed(2)}`,
    `Sunrise: ${signals.sunrise} | Sunset: ${signals.sunset}`,
  ];
  return lines.join('\n');
}
