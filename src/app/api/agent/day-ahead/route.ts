import { NextResponse } from 'next/server';
import { getBusinessById, getCompetitorUpdates, saveAgentRun, saveRecommendations, savePlanCache, getPlanCache, getRecommendationsByDate } from '@/lib/db';
import { discoverEvents, buildEventsContextSummary } from '@/lib/services/event-discovery';
import { buildCompetitorContextSummary } from '@/lib/services/competitor-intel';
import { getWeatherForecast } from '@/lib/services/weather';
import { getAirQuality } from '@/lib/services/air-quality';
import { buildHourlyBlocks, normalizeDailyWeather } from '@/lib/services/signal-normalizer';
import { generateStructured } from '@/lib/services/gemini';
import { buildDayAheadRecommendationPrompt } from '@/lib/prompts/recommendation-explain';
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

interface TimeBlock {
  start: string;
  end: string;
  label: string;
  weather_summary: string;
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

interface DayAheadResponse {
  date: string;
  opportunity_score: number;
  risk_score: number;
  time_blocks: TimeBlock[];
  campaign_send_time: string | null;
  campaign_message_suggestion: string | null;
  daily_summary: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('business_id');
  if (!businessId) {
    return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
  }
  try {
    const cached = await getPlanCache(businessId, 'day_ahead');
    if (!cached) {
      return NextResponse.json(null);
    }
    return NextResponse.json(cached);
  } catch (error) {
    console.error('[Day-Ahead GET]', error);
    return NextResponse.json(null);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, date } = body;

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    const business = await getBusinessById(business_id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const targetDate = date || getTomorrowDate();

    const [weather, airQuality, events, competitorUpdates] = await Promise.all([
      getWeatherForecast(business.lat, business.lng, 7),
      getAirQuality(business.lat, business.lng),
      discoverEvents(business, targetDate, targetDate),
      getCompetitorUpdates(business.id, 10).catch(() => []),
    ]);

    if (!weather) {
      return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 502 });
    }

    const hourlyBlocks = buildHourlyBlocks(weather, targetDate, 3);

    const dayIndex = weather.daily.time.indexOf(targetDate);
    if (dayIndex >= 0) {
      const signals = normalizeDailyWeather(weather, airQuality, dayIndex);
      signalCache.set(`${business.id}:${targetDate}`, signals);
    }

    const hourlyContext = hourlyBlocks.map(block =>
      `[${block.start_hour} - ${block.end_hour}] Temp: ${block.avg_temp}°C (feels ${block.avg_feels_like}°C), ` +
      `Rain: ${block.max_precipitation_prob}% prob, Wind: ${block.max_wind} km/h, UV: ${block.avg_uv}, ` +
      `Cloud: ${block.avg_cloud_cover}%`
    ).join('\n');

    let fullContext = hourlyContext;
    const eventsContext = buildEventsContextSummary(events);
    if (eventsContext) {
      fullContext += `\n\n## Nearby Events\n${eventsContext}`;
    }

    const competitorContext = buildCompetitorContextSummary(competitorUpdates);
    if (competitorContext) {
      fullContext += `\n\n## Competitor Activity\n${competitorContext}`;
    }

    const existingRecs = await getRecommendationsByDate(business.id, targetDate);
    const existingRecsContext = existingRecs.length > 0
      ? existingRecs.map(r => `- [${r.priority}] ${r.title}: ${r.action}`).join('\n')
      : 'No existing weekly recommendations for this date.';

    const playbook = getPlaybook(business.business_type);

    const prompt = buildDayAheadRecommendationPrompt(
      business.name,
      business.business_type,
      playbook,
      fullContext,
      existingRecsContext,
      MOCK_BUSINESS_CONTEXT,
    );

    const result = await generateStructured<DayAheadResponse>(prompt);

    const run = createAgentRun(business.id, 'day_ahead', 'manual');

    const recommendations: Recommendation[] = [];
    const transformedBlocks = result.time_blocks.map(block => {
      const blockRecs = block.recommendations.map(rawRec => {
        const rec = buildRecommendation(
          rawRec,
          run.id,
          business.id,
          business.business_type,
          'day_ahead',
          targetDate,
          1,
        );
        recommendations.push(rec);
        return rec;
      });
      const overlappingEvent = events.find(e => {
        const eStart = e.start_time.slice(0, 5);
        const eEnd = e.end_time.slice(0, 5);
        return eStart < block.end && eEnd > block.start;
      });

      return {
        start: block.start,
        end: block.end,
        weather: parseWeatherSummary(block.weather_summary),
        recommendations: blockRecs,
        isCampaignWindow: result.campaign_send_time
          ? block.start <= result.campaign_send_time && block.end >= result.campaign_send_time
          : false,
        isEventWindow: !!overlappingEvent,
        eventName: overlappingEvent?.name,
      };
    });

    const completedRun = completeAgentRun(
      run,
      result.opportunity_score,
      result.risk_score,
      result.daily_summary,
    );

    await Promise.all([
      saveAgentRun(completedRun),
      saveRecommendations(recommendations),
    ]);

    const responseData = {
      run: completedRun,
      recommendations,
      time_blocks: transformedBlocks,
      daily_summary: {
        date: targetDate,
        opportunity_score: result.opportunity_score,
        risk_score: result.risk_score,
        summary: result.daily_summary,
      },
      events,
    };

    await savePlanCache(business.id, 'day_ahead', responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Day-Ahead Agent]', message);
    if (error instanceof Error && error.stack) {
      console.error('[Day-Ahead Agent] Stack:', error.stack);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function parseWeatherSummary(summary: string): { temp: number; icon: string; description: string; rain: boolean; uv: number } {
  const tempMatch = summary.match(/(\d+\.?\d*)\s*°C/);
  const temp = tempMatch ? Math.round(parseFloat(tempMatch[1])) : 25;
  const rain = /rain|shower|drizzle/i.test(summary);
  const wind = /wind/i.test(summary);
  const uvMatch = summary.match(/UV\s*[:\s]*(\d+\.?\d*)/i);
  const uv = uvMatch ? Math.round(parseFloat(uvMatch[1])) : 0;

  let icon = 'cloud';
  if (rain) icon = 'rain';
  else if (/sun|clear|sunny/i.test(summary)) icon = 'sun';
  else if (wind) icon = 'wind';

  return { temp, icon, description: summary, rain, uv };
}
