import { NextResponse } from 'next/server';
import { getBusinessById, saveAgentRun, saveRecommendations, saveAlerts, saveNotification, savePlanCache, getPlanCache } from '@/lib/db';
import { getWeatherForecast } from '@/lib/services/weather';
import { getAirQuality } from '@/lib/services/air-quality';
import { normalizeDailyWeather, buildSignalContextSummary, type NormalizedDaySignals } from '@/lib/services/signal-normalizer';
import { generateStructured } from '@/lib/services/gemini';
import {
  detectChanges,
  getMostSevereChange,
  shouldUpdateRecommendations,
  SIMULATION_SCENARIOS,
  applySimulation,
} from '@/lib/services/watchtower';
import { createAgentRun, completeAgentRun, buildRecommendation } from '@/lib/services/recommendation';
import { createNotification, createAlertFromChange } from '@/lib/services/notification';
import { PHARMACY_PLAYBOOK } from '@/lib/rules/pharmacy';
import { CONVENIENCE_STORE_PLAYBOOK } from '@/lib/rules/convenience';
import { CAFE_PLAYBOOK } from '@/lib/rules/cafe';
import { RECOMMENDATION_SCHEMA_PROMPT } from '@/lib/rules/common';
import { signalCache } from '@/lib/signal-cache';
import type { BusinessType, Recommendation, Alert } from '@/lib/types';
import type { DetectedChange } from '@/lib/services/watchtower';

const SIGNAL_CACHE_KEY = 'signal_snapshot';

async function loadPreviousSignals(businessId: string, memoryKey: string): Promise<NormalizedDaySignals | null> {
  const memCached = signalCache.get(memoryKey);
  if (memCached) return memCached;

  const dbCached = await getPlanCache(businessId, SIGNAL_CACHE_KEY).catch(() => null);
  return (dbCached as NormalizedDaySignals) ?? null;
}

async function persistSignals(businessId: string, memoryKey: string, signals: NormalizedDaySignals): Promise<void> {
  signalCache.set(memoryKey, signals);
  await savePlanCache(businessId, SIGNAL_CACHE_KEY, signals).catch(() => {});
}

function getPlaybook(type: BusinessType): string {
  switch (type) {
    case 'pharmacy': return PHARMACY_PLAYBOOK;
    case 'convenience_store': return CONVENIENCE_STORE_PLAYBOOK;
    case 'cafe': return CAFE_PLAYBOOK;
  }
}

interface IntradayRecommendationResponse {
  recommendations: Array<{
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
  }>;
  summary: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, simulate } = body;

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    const business = await getBusinessById(business_id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const scenario = simulate
      ? SIMULATION_SCENARIOS.find(s => s.id === simulate)
      : null;

    const [weather, airQuality] = await Promise.all([
      getWeatherForecast(business.lat, business.lng, 2),
      getAirQuality(business.lat, business.lng),
    ]);

    if (!weather) {
      return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 502 });
    }

    const today = weather.daily.time[0];
    let currentSignals = normalizeDailyWeather(weather, airQuality, 0);

    if (scenario) {
      currentSignals = applySimulation(currentSignals, scenario);
    }

    const previousKey = `${business.id}:${today}`;
    const previousSignals = await loadPreviousSignals(business.id, previousKey) || currentSignals;

    await persistSignals(business.id, previousKey, currentSignals);

    const changes: DetectedChange[] = detectChanges(previousSignals, currentSignals);
    const alerts: Alert[] = [];
    const updatedRecommendations: Recommendation[] = [];

    if (shouldUpdateRecommendations(changes)) {
      getMostSevereChange(changes);

      const changeSummary = changes
        .filter(c => c.requires_action)
        .map(c => `- ${c.description} (severity: ${c.severity})`)
        .join('\n');

      const signalContext = buildSignalContextSummary(currentSignals);
      const playbook = getPlaybook(business.business_type);

      const prompt = `You are SkyPulse, an AI operations advisor. Signal changes have been detected that require updated recommendations.

## Business
${business.name} (${business.business_type})

${playbook}

## Detected Changes
${changeSummary}

## Current Signals
${signalContext}

## Instructions
Generate 1-3 urgent recommendations that respond to the detected changes. These should be immediately actionable.

Return a JSON object:
{
  "recommendations": [
    ${RECOMMENDATION_SCHEMA_PROMPT}
  ],
  "summary": "Brief explanation of what changed and why these actions are needed"
}`;

      const run = createAgentRun(
        business.id,
        'intraday',
        scenario ? 'demo_simulation' : 'signal_change',
      );

      const result = await generateStructured<IntradayRecommendationResponse>(prompt);

      for (const rawRec of result.recommendations) {
        const rec = buildRecommendation(
          rawRec,
          run.id,
          business.id,
          business.business_type,
          'intraday',
          today,
          0,
        );
        updatedRecommendations.push(rec);
      }

      const completedRun = completeAgentRun(run, 0, 0, result.summary);

      await saveAgentRun(completedRun);
      await saveRecommendations(updatedRecommendations);

      for (const change of changes.filter(c => c.severity === 'high' || c.severity === 'critical')) {
        const alert = createAlertFromChange(
          business.id,
          updatedRecommendations[0]?.id || null,
          change.severity as Alert['severity'],
          `Signal Change: ${change.field}`,
          change.description,
        );
        alerts.push(alert);

        const notification = createNotification(
          'urgent_alert',
          `⚠️ ${change.description}`,
          `New recommendations generated for ${business.name}`,
          change.severity === 'critical' ? 'error' : 'warning',
        );

        await saveNotification(notification).catch(() => {});
      }

      if (alerts.length > 0) {
        await saveAlerts(alerts).catch(() => {});
      }
    }

    return NextResponse.json({
      changes,
      updated_recommendations: updatedRecommendations,
      alerts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Intraday Agent]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
