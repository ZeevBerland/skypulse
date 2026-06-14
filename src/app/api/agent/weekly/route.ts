import { NextResponse } from 'next/server';
import { getBusinessById, getCompetitorUpdates, saveAgentRun, saveRecommendations, savePlanCache, getPlanCache, getEventsByBusinessAndDateRange } from '@/lib/db';
import { discoverEvents, buildEventsContextSummary } from '@/lib/services/event-discovery';
import { buildCompetitorContextSummary } from '@/lib/services/competitor-intel';
import { getWeatherForecast } from '@/lib/services/weather';
import { getAirQuality } from '@/lib/services/air-quality';
import { normalizeDailyWeather, buildSignalContextSummary } from '@/lib/services/signal-normalizer';
import { generateStructured } from '@/lib/services/gemini';
import { buildWeeklyRecommendationPrompt } from '@/lib/prompts/recommendation-explain';
import { createAgentRun, completeAgentRun, buildRecommendation } from '@/lib/services/recommendation';
import { PHARMACY_PLAYBOOK } from '@/lib/rules/pharmacy';
import { CONVENIENCE_STORE_PLAYBOOK } from '@/lib/rules/convenience';
import { CAFE_PLAYBOOK } from '@/lib/rules/cafe';
import { signalCache } from '@/lib/signal-cache';
import type { BusinessType, Recommendation } from '@/lib/types';

const MOCK_BUSINESS_CONTEXT = `Mock business context for demo:
- Average daily customers: 150-300
- Average basket size: $15-45
- Current inventory levels: normal
- Staff available: 3-5 per shift
- Supplier lead time: 2 days for most items`;

function getPlaybook(type: BusinessType): string {
  switch (type) {
    case 'pharmacy': return PHARMACY_PLAYBOOK;
    case 'convenience_store': return CONVENIENCE_STORE_PLAYBOOK;
    case 'cafe': return CAFE_PLAYBOOK;
  }
}

interface DayPlan {
  date: string;
  day_label: string;
  opportunity_score: number;
  risk_score: number;
  summary: string;
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
}

interface WeeklyResponse {
  days: DayPlan[];
  weekly_summary: string;
  highest_opportunity_day: string;
  highest_risk_day: string;
  watchlist: string[];
}

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('business_id');
  if (!businessId) {
    return NextResponse.json({ error: 'business_id is required' }, { status: 400, headers: NO_CACHE_HEADERS });
  }
  try {
    const cached = await getPlanCache(businessId, 'weekly');
    if (!cached) {
      return NextResponse.json(null, { headers: NO_CACHE_HEADERS });
    }
    const plan = cached as Record<string, unknown>;
    if (!plan.events || (Array.isArray(plan.events) && plan.events.length === 0)) {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];
      const dbEvents = await getEventsByBusinessAndDateRange(businessId, startDate, endDate);
      if (dbEvents.length > 0) {
        plan.events = dbEvents;
      }
    }
    return NextResponse.json(plan, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('[Weekly GET]', error);
    return NextResponse.json(null, { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id } = body;

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    const business = await getBusinessById(business_id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];

    const eventsPromise = discoverEvents(business, startDate, endDate).catch((e) => {
      console.warn('[Weekly Agent] Event discovery failed, continuing without events:', e instanceof Error ? e.message : e);
      return [] as Awaited<ReturnType<typeof discoverEvents>>;
    });

    const [weather, airQuality, competitorUpdates] = await Promise.all([
      getWeatherForecast(business.lat, business.lng, 7),
      getAirQuality(business.lat, business.lng),
      getCompetitorUpdates(business.id, 15).catch(() => []),
    ]);

    const events = await Promise.race([
      eventsPromise,
      new Promise<Awaited<ReturnType<typeof discoverEvents>>>((resolve) =>
        setTimeout(() => { console.log('[Weekly Agent] Events not ready in 5s, proceeding without'); resolve([]); }, 5000)
      ),
    ]);

    if (!weather) {
      return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 502 });
    }

    const dailySignals = Array.from({ length: 7 }, (_, i) =>
      normalizeDailyWeather(weather, airQuality, i)
    );

    dailySignals.forEach(signals => {
      signalCache.set(`${business.id}:${signals.date}`, signals);
    });

    let signalContext = dailySignals
      .map(s => buildSignalContextSummary(s))
      .join('\n\n---\n\n');

    const eventsContext = buildEventsContextSummary(events);
    if (eventsContext) {
      signalContext += `\n\n---\n\n## Nearby Events\n${eventsContext}`;
    }

    const competitorContext = buildCompetitorContextSummary(competitorUpdates);
    if (competitorContext) {
      signalContext += `\n\n---\n\n## Competitor Activity\n${competitorContext}`;
    }

    const playbook = getPlaybook(business.business_type);

    const prompt = buildWeeklyRecommendationPrompt(
      business.name,
      business.business_type,
      playbook,
      signalContext,
      MOCK_BUSINESS_CONTEXT,
    );

    const result = await generateStructured<WeeklyResponse>(prompt);

    const run = createAgentRun(business.id, 'weekly', 'manual');

    const recommendations: Recommendation[] = [];
    const processedDays = result.days.map(day => {
      const dayRecs: Recommendation[] = [];
      for (const rawRec of day.recommendations) {
        const dayOffset = dailySignals.findIndex(s => s.date === day.date);
        const rec = buildRecommendation(
          rawRec,
          run.id,
          business.id,
          business.business_type,
          'weekly',
          day.date,
          dayOffset >= 0 ? dayOffset : 0,
        );
        dayRecs.push(rec);
        recommendations.push(rec);
      }
      return {
        date: day.date,
        day_label: day.day_label,
        opportunity_score: day.opportunity_score,
        risk_score: day.risk_score,
        summary: day.summary,
        recommendations: dayRecs,
      };
    });

    const avgOpportunity = result.days.reduce((sum, d) => sum + d.opportunity_score, 0) / result.days.length;
    const avgRisk = result.days.reduce((sum, d) => sum + d.risk_score, 0) / result.days.length;

    const completedRun = completeAgentRun(
      run,
      Math.round(avgOpportunity),
      Math.round(avgRisk),
      result.weekly_summary,
    );

    await saveAgentRun(completedRun);
    await saveRecommendations(recommendations);

    const responseData = {
      run: completedRun,
      recommendations,
      weekly_summary: {
        text: result.weekly_summary,
        highest_opportunity_day: result.highest_opportunity_day,
        highest_risk_day: result.highest_risk_day,
        watchlist: result.watchlist || [],
      },
      days: processedDays,
      events,
    };

    await savePlanCache(business.id, 'weekly', responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Weekly Agent]', message);
    if (error instanceof Error && error.stack) {
      console.error('[Weekly Agent] Stack:', error.stack);
    } else {
      console.error('[Weekly Agent] Raw error:', error);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
