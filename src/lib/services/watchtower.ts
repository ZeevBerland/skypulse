import type { NormalizedDaySignals } from './signal-normalizer';

export type ChangeSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DetectedChange {
  signal_type: string;
  field: string;
  previous_value: number | string;
  new_value: number | string;
  severity: ChangeSeverity;
  description: string;
  requires_action: boolean;
}

interface ThresholdConfig {
  field: keyof NormalizedDaySignals;
  label: string;
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

const CHANGE_THRESHOLDS: ThresholdConfig[] = [
  {
    field: 'rain_risk',
    label: 'Rain probability',
    thresholds: { low: 0.1, medium: 0.25, high: 0.4, critical: 0.6 },
  },
  {
    field: 'heat_score',
    label: 'Heat intensity',
    thresholds: { low: 0.1, medium: 0.2, high: 0.3, critical: 0.5 },
  },
  {
    field: 'wind_score',
    label: 'Wind conditions',
    thresholds: { low: 0.15, medium: 0.25, high: 0.4, critical: 0.5 },
  },
  {
    field: 'air_quality_score',
    label: 'Air quality',
    thresholds: { low: 0.1, medium: 0.2, high: 0.35, critical: 0.5 },
  },
  {
    field: 'uv_score',
    label: 'UV index',
    thresholds: { low: 0.15, medium: 0.25, high: 0.35, critical: 0.5 },
  },
];

function classifySeverity(delta: number, thresholds: ThresholdConfig['thresholds']): ChangeSeverity {
  const absDelta = Math.abs(delta);
  if (absDelta >= thresholds.critical) return 'critical';
  if (absDelta >= thresholds.high) return 'high';
  if (absDelta >= thresholds.medium) return 'medium';
  if (absDelta >= thresholds.low) return 'low';
  return 'low';
}

export function detectChanges(
  previous: NormalizedDaySignals,
  current: NormalizedDaySignals,
): DetectedChange[] {
  const changes: DetectedChange[] = [];

  for (const config of CHANGE_THRESHOLDS) {
    const prevVal = previous[config.field] as number;
    const curVal = current[config.field] as number;
    const delta = curVal - prevVal;
    const absDelta = Math.abs(delta);

    if (absDelta < config.thresholds.low) continue;

    const severity = classifySeverity(delta, config.thresholds);
    const direction = delta > 0 ? 'increased' : 'decreased';

    changes.push({
      signal_type: 'weather',
      field: config.field,
      previous_value: Math.round(prevVal * 100) / 100,
      new_value: Math.round(curVal * 100) / 100,
      severity,
      description: `${config.label} ${direction} from ${(prevVal * 100).toFixed(0)}% to ${(curVal * 100).toFixed(0)}%`,
      requires_action: severity === 'high' || severity === 'critical',
    });
  }

  return changes;
}

export function getMostSevereChange(changes: DetectedChange[]): ChangeSeverity {
  const severityOrder: ChangeSeverity[] = ['low', 'medium', 'high', 'critical'];
  let maxIdx = 0;
  for (const change of changes) {
    const idx = severityOrder.indexOf(change.severity);
    if (idx > maxIdx) maxIdx = idx;
  }
  return severityOrder[maxIdx];
}

export function shouldUpdateRecommendations(changes: DetectedChange[]): boolean {
  return changes.some(c => c.requires_action);
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  business_type: string;
  signalOverrides: Partial<NormalizedDaySignals>;
}

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'pharmacy_event_postponed',
    name: 'Event Postponed (Pharmacy)',
    description: 'A nearby evening event is postponed — sudden heat spike forces schedule change, affecting foot traffic.',
    business_type: 'pharmacy',
    signalOverrides: {
      heat_score: 0.85,
      uv_score: 0.7,
      feels_like_max: 40,
    },
  },
  {
    id: 'convenience_rain_spike',
    name: 'Rain Probability Spike (Convenience Store)',
    description: 'Rain probability increases from 25% to 75% for the evening window.',
    business_type: 'convenience_store',
    signalOverrides: {
      rain_risk: 0.75,
      precipitation_probability_max: 75,
    },
  },
  {
    id: 'cafe_wind_increase',
    name: 'Wind Increase (Cafe)',
    description: 'Wind speed increases significantly, affecting outdoor seating.',
    business_type: 'cafe',
    signalOverrides: {
      wind_score: 0.8,
      wind_max: 50,
    },
  },
];

export function applySimulation(
  baseSignals: NormalizedDaySignals,
  scenario: SimulationScenario,
): NormalizedDaySignals {
  return {
    ...baseSignals,
    ...scenario.signalOverrides,
  };
}
