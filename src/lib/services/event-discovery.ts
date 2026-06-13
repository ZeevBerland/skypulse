import { v4 as uuidv4 } from 'uuid';
import { generateWithSearchGrounding } from '@/lib/services/gemini';
import { buildEventDiscoveryPrompt } from '@/lib/prompts/event-discovery';
import { saveEvents, getEventsByBusinessAndDateRange } from '@/lib/db';
import type { Business } from '@/lib/types/business';
import type { Event } from '@/lib/types/events';

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

const EVENT_DISCOVERY_TIMEOUT_MS = 30_000;

/**
 * Discover events near a business for a date range.
 * Checks DB cache first; if empty, calls Gemini Search Grounding and persists results.
 * Times out after 30s to avoid blocking agent routes.
 */
export async function discoverEvents(
  business: Business,
  startDate: string,
  endDate: string,
): Promise<Event[]> {
  const cached = await getEventsByBusinessAndDateRange(business.id, startDate, endDate);
  if (cached.length > 0) return cached;

  try {
    const prompt = buildEventDiscoveryPrompt(
      business.address,
      business.lat,
      business.lng,
      startDate,
      endDate,
    );

    const rawText = await Promise.race([
      generateWithSearchGrounding(prompt),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Event discovery timed out')), EVENT_DISCOVERY_TIMEOUT_MS)
      ),
    ]);

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
      run_id: '',
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
      console.error('[Event Discovery] Failed to persist:', err);
    });

    return events;
  } catch (err) {
    console.error('[Event Discovery] Failed:', err);
    return [];
  }
}

/**
 * Build a text summary of events suitable for inclusion in agent prompts.
 */
export function buildEventsContextSummary(events: Event[]): string {
  if (events.length === 0) return '';
  return events.map(e =>
    `- ${e.name} at ${e.venue} on ${e.date} (${e.start_time}–${e.end_time}), ` +
    `attendance: ${e.estimated_attendance}, ` +
    `distance: ${e.distance_km}km, ` +
    `relevance: ${e.business_relevance}`
  ).join('\n');
}
