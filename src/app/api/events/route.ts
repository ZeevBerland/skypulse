import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getBusinessById, saveEvents, getEventsByBusinessAndDateRange } from '@/lib/db';
import { generateWithSearchGrounding } from '@/lib/services/gemini';
import { buildEventDiscoveryPrompt } from '@/lib/prompts/event-discovery';
import type { Event } from '@/lib/types';

interface RawEvent {
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  distance_km: number | null;
  estimated_attendance: 'low' | 'medium' | 'high' | 'unknown';
  confidence: number;
  business_relevance: string;
  source_url?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!businessId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'business_id, start_date, and end_date are required' },
        { status: 400 },
      );
    }

    const events = await getEventsByBusinessAndDateRange(businessId, startDate, endDate);
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Events GET]', message);
    return NextResponse.json({ events: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, start_date, end_date, run_id } = body;

    if (!business_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'business_id, start_date, and end_date are required' },
        { status: 400 },
      );
    }

    const business = await getBusinessById(business_id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const prompt = buildEventDiscoveryPrompt(
      business.address,
      business.lat,
      business.lng,
      start_date,
      end_date,
    );

    const rawText = await generateWithSearchGrounding(prompt);

    let rawEvents: RawEvent[] = [];
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      rawEvents = JSON.parse(cleaned);
    } catch {
      const arrayMatch = rawText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        rawEvents = JSON.parse(arrayMatch[0]);
      }
    }

    const events: Event[] = rawEvents.map(raw => ({
      id: uuidv4(),
      run_id: run_id || '',
      business_id: business.id,
      name: raw.name,
      venue: raw.venue,
      date: raw.date,
      start_time: raw.start_time,
      end_time: raw.end_time,
      distance_km: raw.distance_km ?? 0,
      estimated_attendance: raw.estimated_attendance,
      confidence: raw.confidence,
      business_relevance: raw.business_relevance,
      source_url: raw.source_url || '',
      raw_json: raw,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    await saveEvents(events).catch(err => {
      console.error('[Events] Failed to persist events:', err);
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Events API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
