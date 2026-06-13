import { v4 as uuidv4 } from 'uuid';
import type { Recommendation, AgentRun } from '@/lib/types';
import type { BusinessType } from '@/lib/types/business';
import { getConfidenceBand } from '@/lib/rules/common';

export function createAgentRun(
  businessId: string,
  runType: 'weekly' | 'day_ahead' | 'intraday',
  triggerType: 'manual' | 'scheduled' | 'signal_change' | 'demo_simulation' = 'manual',
): AgentRun {
  return {
    id: uuidv4(),
    business_id: businessId,
    run_type: runType,
    trigger_type: triggerType,
    planning_start: new Date().toISOString(),
    planning_end: '',
    status: 'running',
    overall_opportunity_score: 0,
    overall_risk_score: 0,
    summary: '',
    created_at: new Date().toISOString(),
    completed_at: '',
  };
}

export function completeAgentRun(
  run: AgentRun,
  opportunityScore: number,
  riskScore: number,
  summary: string,
): AgentRun {
  return {
    ...run,
    status: 'completed',
    overall_opportunity_score: opportunityScore,
    overall_risk_score: riskScore,
    summary,
    planning_end: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };
}

interface RawRecommendation {
  title: string;
  action: string;
  why: string;
  recommendation_type: string;
  priority: string;
  confidence: number;
  effort: string;
  time_window: string;
  source_signals: string[];
  expected_impact: {
    revenue: string;
    stockout_risk_reduction: string;
    customer_experience: string;
  };
}

export function buildRecommendation(
  raw: RawRecommendation,
  runId: string,
  businessId: string,
  vertical: BusinessType,
  runType: 'weekly' | 'day_ahead' | 'intraday',
  date: string,
  dayOffset: number,
): Recommendation {
  const confidenceBand = getConfidenceBand(dayOffset);
  const bandMultiplier = confidenceBand === 'high' ? 1 : confidenceBand === 'medium' ? 0.85 : 0.7;
  const adjustedConfidence = Math.min(1, raw.confidence * bandMultiplier);

  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    run_id: runId,
    business_id: businessId,
    created_by_run_type: runType,
    date,
    time_window: raw.time_window || 'all_day',
    vertical,
    recommendation_type: raw.recommendation_type as Recommendation['recommendation_type'],
    priority: raw.priority as Recommendation['priority'],
    confidence: Math.round(adjustedConfidence * 100) / 100,
    status: 'suggested',
    title: raw.title,
    action: raw.action,
    why: raw.why,
    source_signals: raw.source_signals,
    expected_impact: raw.expected_impact as Recommendation['expected_impact'],
    effort: raw.effort as Recommendation['effort'],
    owner: 'store_manager',
    valid_from: `${date}T${raw.time_window?.split('-')[0] || '08:00'}:00`,
    valid_until: `${date}T${raw.time_window?.split('-')[1] || '22:00'}:00`,
    last_validated_at: now,
    superseded_by: null,
    update_reason: null,
    created_at: now,
    updated_at: now,
  };
}

export function updateRecommendationStatus(
  rec: Recommendation,
  newStatus: Recommendation['status'],
  reason?: string,
): Recommendation {
  return {
    ...rec,
    status: newStatus,
    update_reason: reason || rec.update_reason,
    updated_at: new Date().toISOString(),
  };
}

export function supersedRecommendation(
  oldRec: Recommendation,
  newRec: Recommendation,
  reason: string,
): { old: Recommendation; new: Recommendation } {
  return {
    old: {
      ...oldRec,
      status: 'updated',
      superseded_by: newRec.id,
      update_reason: reason,
      updated_at: new Date().toISOString(),
    },
    new: newRec,
  };
}
