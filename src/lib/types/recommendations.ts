import type { BusinessType } from './business';

export type RunType = 'weekly' | 'day_ahead' | 'intraday';

export type RecommendationType =
  | 'inventory'
  | 'staffing'
  | 'marketing'
  | 'layout'
  | 'hours'
  | 'alert';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type RecommendationStatus =
  | 'suggested'
  | 'accepted'
  | 'active'
  | 'updated'
  | 'cancelled'
  | 'completed'
  | 'ignored';

export type TriggerType =
  | 'manual'
  | 'scheduled'
  | 'signal_change'
  | 'demo_simulation';

export type AgentRunStatus = 'running' | 'completed' | 'failed';

export interface ExpectedImpact {
  revenue: string;
  stockout_risk_reduction: string;
  customer_experience: string;
}

export interface Recommendation {
  id: string;
  run_id: string;
  business_id: string;
  created_by_run_type: RunType;
  date: string;
  time_window: string;
  vertical: BusinessType;
  recommendation_type: RecommendationType;
  priority: Priority;
  confidence: number;
  status: RecommendationStatus;
  title: string;
  action: string;
  why: string;
  source_signals: string[];
  expected_impact: ExpectedImpact;
  effort: 'low' | 'medium' | 'high';
  owner: string;
  valid_from: string;
  valid_until: string;
  last_validated_at: string;
  superseded_by: string | null;
  update_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  business_id: string;
  run_type: RunType;
  trigger_type: TriggerType;
  planning_start: string;
  planning_end: string;
  status: AgentRunStatus;
  overall_opportunity_score: number;
  overall_risk_score: number;
  summary: string;
  created_at: string;
  completed_at: string;
}
