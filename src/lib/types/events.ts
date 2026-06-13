export type EstimatedAttendance = 'low' | 'medium' | 'high' | 'unknown';

export interface Event {
  id: string;
  run_id: string;
  business_id: string;
  name: string;
  venue: string;
  date: string;
  start_time: string;
  end_time: string;
  distance_km: number;
  estimated_attendance: EstimatedAttendance;
  confidence: number;
  business_relevance: string;
  source_url: string;
  raw_json: unknown;
  created_at: string;
  updated_at: string;
}

export type EventChangeType =
  | 'postponed'
  | 'cancelled'
  | 'time_changed'
  | 'venue_changed'
  | 'no_change';

export interface EventChange {
  event_changed: boolean;
  change_type: EventChangeType;
  old_value: string;
  new_value: string;
  confidence: number;
  source_url: string;
  business_impact: string;
}
