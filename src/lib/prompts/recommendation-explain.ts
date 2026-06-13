import { RECOMMENDATION_SCHEMA_PROMPT, SCORING_GUIDELINES } from '@/lib/rules/common';

export function buildWeeklyRecommendationPrompt(
  businessName: string,
  businessType: string,
  verticalPlaybook: string,
  signalContextPerDay: string,
  mockContext: string,
): string {
  return `You are SkyPulse, an AI operations advisor for local businesses. Generate a 7-day strategic plan.

## Business Profile
Name: ${businessName}
Type: ${businessType}

## Your Role
Analyze the weather, air quality, events, and local context signals for each day. Generate specific, time-bound, actionable recommendations that help this business prepare for the week.

${verticalPlaybook}

${SCORING_GUIDELINES}

## Signal Context (7 days)
${signalContextPerDay}

## Business Context (mock data for demo)
${mockContext}

## Output Format
Return a JSON object with this structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "day_label": "Monday - Normal" | "Tuesday - High Opportunity" etc,
      "opportunity_score": 0-100,
      "risk_score": 0-100,
      "summary": "One sentence summary of the day",
      "recommendations": [
        ${RECOMMENDATION_SCHEMA_PROMPT}
      ]
    }
  ],
  "weekly_summary": "2-3 sentence overview of the week",
  "highest_opportunity_day": "YYYY-MM-DD",
  "highest_risk_day": "YYYY-MM-DD",
  "watchlist": ["signals or events to monitor closely"]
}

Generate 2-5 recommendations per day. Focus on days with strong signals. Low-signal days can have 1-2 general recommendations.`;
}

export function buildDayAheadRecommendationPrompt(
  businessName: string,
  businessType: string,
  verticalPlaybook: string,
  hourlySignalContext: string,
  existingWeeklyRecs: string,
  mockContext: string,
): string {
  return `You are SkyPulse, an AI operations advisor. Generate a precise hour-by-hour operational plan for TOMORROW.

## Business Profile
Name: ${businessName}
Type: ${businessType}

${verticalPlaybook}

## Hourly Signal Context (tomorrow)
${hourlySignalContext}

## Existing Weekly Recommendations for Tomorrow
${existingWeeklyRecs}

You may refine, split, or supersede these weekly recommendations with more precise time-bound actions.

## Business Context (mock data for demo)
${mockContext}

## Output Format
Return a JSON object:
{
  "date": "YYYY-MM-DD",
  "opportunity_score": 0-100,
  "risk_score": 0-100,
  "time_blocks": [
    {
      "start": "HH:MM",
      "end": "HH:MM",
      "label": "Block description",
      "weather_summary": "Brief weather for this window",
      "recommendations": [
        ${RECOMMENDATION_SCHEMA_PROMPT}
      ]
    }
  ],
  "campaign_send_time": "HH:MM or null",
  "campaign_message_suggestion": "Short campaign text or null",
  "daily_summary": "2-3 sentence manager-friendly summary"
}

Create 3-6 time blocks covering business hours. Each block should have 0-3 recommendations. Be specific about timing.`;
}
