export function buildEventDiscoveryPrompt(
  locationName: string,
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): string {
  return `Find public events happening near ${locationName} (coordinates: ${lat}, ${lng}) between ${startDate} and ${endDate}.

Include: concerts, festivals, sports events, community events, market days, cultural events, venue schedules, city events.

Return ONLY a JSON array of events. Each event must have:
{
  "name": "Event name",
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "venue": "Venue name",
  "distance_km": number or null,
  "estimated_attendance": "low" | "medium" | "high" | "unknown",
  "confidence": 0.0 to 1.0,
  "business_relevance": "Brief description of how this affects nearby businesses"
}

Rules:
- Only include events supported by grounded sources
- If attendance is unknown, use "unknown" - do NOT invent numbers
- Confidence should reflect how certain you are the event is happening
- Include the source URL from grounding metadata when available
- Focus on events within 2km radius that would affect local business foot traffic`;
}

export function buildEventUpdatePrompt(
  eventName: string,
  eventDate: string,
  eventVenue: string,
  originalStartTime: string,
  originalEndTime: string,
): string {
  return `Check if the following event has changed, been postponed, or been cancelled:

Event: ${eventName}
Date: ${eventDate}
Venue: ${eventVenue}
Original time: ${originalStartTime} - ${originalEndTime}

Return ONLY a JSON object:
{
  "event_changed": true | false,
  "change_type": "postponed" | "cancelled" | "time_changed" | "venue_changed" | "no_change",
  "old_value": "original detail",
  "new_value": "updated detail",
  "confidence": 0.0 to 1.0,
  "source_url": "grounding source URL",
  "business_impact": "Brief description of how this change affects nearby businesses"
}

If you cannot find updated information, return event_changed: false with confidence reflecting your certainty.`;
}
