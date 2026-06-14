import { generateWithSearchGrounding } from '@/lib/services/gemini';
import { getNearbyPlaces } from '@/lib/services/places';
import { saveCompetitorUpdates, getCompetitorUpdates } from '@/lib/db';
import type { Business } from '@/lib/types/business';
import type { Place } from '@/lib/types/places';
import type { CompetitorUpdate, CompetitorUpdateType } from '@/lib/types/competitors';

const SCAN_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const SCAN_TIMEOUT_MS = 60_000;

interface RawCompetitorUpdate {
  update_type: CompetitorUpdateType;
  title: string;
  summary: string;
  source_url?: string;
  relevance_score: number;
  ai_suggestion: string;
}

function buildCompetitorScanPrompt(
  competitor: Place,
  business: Business,
): string {
  return `You are a competitive intelligence analyst for a local ${business.business_type} called "${business.name}" located at ${business.address}.

Research the competitor "${competitor.name}" (${competitor.type}) located at ${competitor.address || 'nearby'}, approximately ${competitor.distance_m || '?'}m away.

Find any recent activity about this competitor:
- Current promotions, sales, or special offers
- Customer review trends (positive or negative patterns)
- New products or services
- Price changes
- Store changes (renovations, new hours, closures)
- News mentions or social media activity

Return ONLY a JSON array of updates found. Each update:
{
  "update_type": "promotion" | "review_trend" | "new_product" | "price_change" | "store_change" | "news" | "social_media" | "other",
  "title": "Short headline",
  "summary": "2-3 sentence description of the finding",
  "source_url": "URL from grounding source if available",
  "relevance_score": 0.0 to 1.0 (how relevant this is to ${business.name}),
  "ai_suggestion": "Specific actionable suggestion for ${business.name} to respond"
}

Rules:
- Only include findings supported by grounded sources
- If no updates found, return an empty array []
- Focus on actionable intelligence, not generic info
- Suggestions should be specific to a ${business.business_type}`;
}

async function scanSingleCompetitor(
  competitor: Place,
  business: Business,
): Promise<CompetitorUpdate[]> {
  const prompt = buildCompetitorScanPrompt(competitor, business);

  const rawText = await Promise.race([
    generateWithSearchGrounding(prompt),
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Competitor scan timed out')), SCAN_TIMEOUT_MS)
    ),
  ]);

  let rawUpdates: RawCompetitorUpdate[] = [];
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    rawUpdates = JSON.parse(cleaned);
  } catch {
    const arrayMatch = rawText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      rawUpdates = JSON.parse(arrayMatch[0]);
    }
  }

  if (!Array.isArray(rawUpdates)) return [];

  return rawUpdates.map(raw => ({
    id: crypto.randomUUID(),
    business_id: business.id,
    competitor_name: competitor.name,
    competitor_address: competitor.address,
    update_type: raw.update_type,
    title: raw.title,
    summary: raw.summary,
    source_url: raw.source_url,
    relevance_score: raw.relevance_score ?? 0.5,
    ai_suggestion: raw.ai_suggestion,
    raw_json: raw,
    discovered_at: new Date().toISOString(),
  }));
}

/**
 * Scan all competitors near a business for intelligence updates.
 * Returns cached results if a recent scan exists within the cooldown window.
 */
export async function scanCompetitors(business: Business): Promise<CompetitorUpdate[]> {
  const existing = await getCompetitorUpdates(business.id, 20);
  if (existing.length > 0) {
    const latestTime = new Date(existing[0].discovered_at).getTime();
    if (Date.now() - latestTime < SCAN_COOLDOWN_MS) {
      return existing;
    }
  }

  let places = await getNearbyPlaces(business.lat, business.lng, business.business_type, business.id);

  if (places.length === 0) {
    console.log('[Competitor Intel] Cache empty, retrying with fresh Gemini call...');
    places = await getNearbyPlaces(business.lat, business.lng, business.business_type, business.id, true);
  }

  console.log(`[Competitor Intel] Found ${places.length} nearby places, types:`, places.map(p => `${p.name} (${p.type} → ${p.category})`));
  const competitors = places.filter(p => p.category === 'competitor').slice(0, 5);

  if (competitors.length === 0) {
    console.log('[Competitor Intel] No competitors identified among nearby places');
    return existing;
  }

  const results = await Promise.allSettled(
    competitors.map(c => scanSingleCompetitor(c, business))
  );

  const allUpdates: CompetitorUpdate[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      allUpdates.push(...result.value);
    } else {
      console.error(`[Competitor Intel] Failed to scan ${competitors[i].name}:`, result.reason);
    }
  }

  if (allUpdates.length > 0) {
    await saveCompetitorUpdates(allUpdates).catch(err => {
      console.error('[Competitor Intel] Failed to persist:', err);
    });
  }

  return allUpdates.length > 0 ? allUpdates : existing;
}

/**
 * Build a text summary of competitor updates for inclusion in agent prompts.
 */
export function buildCompetitorContextSummary(updates: CompetitorUpdate[]): string {
  if (updates.length === 0) return '';

  const grouped = new Map<string, CompetitorUpdate[]>();
  for (const u of updates) {
    const existing = grouped.get(u.competitor_name) ?? [];
    existing.push(u);
    grouped.set(u.competitor_name, existing);
  }

  const lines: string[] = [];
  for (const [name, items] of grouped) {
    lines.push(`### ${name}`);
    for (const item of items.slice(0, 3)) {
      lines.push(`- [${item.update_type}] ${item.title}: ${item.summary}`);
      if (item.ai_suggestion) {
        lines.push(`  → Suggested response: ${item.ai_suggestion}`);
      }
    }
  }

  return lines.join('\n');
}
