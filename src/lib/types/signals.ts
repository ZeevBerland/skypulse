export interface WeatherHourly {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation_probability: number;
  precipitation: number;
  rain: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
  uv_index: number;
}

export interface WeatherDaily {
  time: string;
  weather_code: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  apparent_temperature_max: number;
  apparent_temperature_min: number;
  sunrise: string;
  sunset: string;
  uv_index_max: number;
  precipitation_sum: number;
  rain_sum: number;
  precipitation_hours: number;
  precipitation_probability_max: number;
  wind_speed_10m_max: number;
  wind_gusts_10m_max: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
}

export interface AirQualityData {
  latitude: number;
  longitude: number;
  hourly: AirQualityHourly[];
}

export interface AirQualityHourly {
  time: string;
  pm2_5: number;
  pm10: number;
  us_aqi: number;
  uv_index: number;
  dust: number;
}

export type SignalType =
  | 'weather'
  | 'air_quality'
  | 'places'
  | 'events'
  | 'mock_mobility'
  | 'mock_inventory';

export interface SignalSnapshot {
  id: string;
  business_id: string;
  run_id: string;
  signal_type: SignalType;
  raw_json: unknown;
  normalized_json: unknown;
  source: string;
  created_at: string;
}

/** Each field is a 0–1 normalized score */
export interface NormalizedSignal {
  heat_score: number;
  cold_score: number;
  rain_risk: number;
  wind_score: number;
  uv_score: number;
  air_quality_score: number;
  dust_score: number;
}

export interface DailySignalContext {
  date: string;
  business_id: string;
  weather: NormalizedSignal;
  air_quality: NormalizedSignal;
  events: { name: string; relevance: number }[];
  places: { name: string; type: string; distance_meters: number }[];
  overall_opportunity_score: number;
  overall_risk_score: number;
}

export type ChangeSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SignalChange {
  id: string;
  business_id: string;
  run_id: string;
  signal_type: SignalType;
  previous_value_json: unknown;
  new_value_json: unknown;
  change_severity: ChangeSeverity;
  requires_action: boolean;
  detected_at: string;
  created_at: string;
}
