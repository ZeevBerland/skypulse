export type BusinessType = 'pharmacy' | 'convenience_store' | 'cafe';

export interface OpeningHours {
  [day: string]: { open: string; close: string } | null;
}

export interface Business {
  id: string;
  name: string;
  business_type: BusinessType;
  address: string;
  lat: number;
  lng: number;
  timezone: string;
  opening_hours_json: OpeningHours;
  created_at: string;
  updated_at: string;
}

export interface BusinessCategory {
  id: string;
  business_id: string;
  category_name: string;
  margin_level: 'low' | 'medium' | 'high';
  weather_sensitivity: 'low' | 'medium' | 'high';
  event_sensitivity: 'low' | 'medium' | 'high';
  air_quality_sensitivity: 'low' | 'medium' | 'high';
  created_at: string;
}
