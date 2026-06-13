export function buildWeeklyBriefPrompt(
  businessName: string,
  businessType: string,
  weeklyPlanSummary: string,
  recommendations: string,
  signalHighlights: string,
): string {
  return `Generate a weekly manager brief for a local ${businessType}.

## Business
${businessName}

## Weekly Plan Summary
${weeklyPlanSummary}

## Recommendations
${recommendations}

## Signal Highlights
${signalHighlights}

## Brief Format
Write a clean, professional brief in markdown format with these sections:

# Weekly Brief - ${businessName}

## This Week at a Glance
(2-3 sentence overview)

## Top Opportunities
(Numbered list, max 3)

## Top Risks
(Numbered list, max 3)

## Action Checklist
(Checkbox items - most important actions for the week)

## Day-by-Day Highlights
(One line per day: day name + main action/note)

## Watchlist
(Items to monitor for changes this week)

Keep it concise. A busy manager should be able to read this in 2 minutes.
Do not invent facts not present in the data provided.`;
}

export function buildTomorrowBriefPrompt(
  businessName: string,
  businessType: string,
  dayAheadPlan: string,
  recommendations: string,
): string {
  return `Generate a tomorrow action brief for a local ${businessType}.

## Business
${businessName}

## Tomorrow's Plan
${dayAheadPlan}

## Recommendations
${recommendations}

## Brief Format
Write a clean, professional brief in markdown:

# Tomorrow's Plan - ${businessName}

## Summary
(2-3 sentences about tomorrow)

## Timeline
(Time-blocked actions formatted as a clear schedule)

## Key Actions
(Numbered priority actions)

## Campaign
(Campaign copy if any campaign is recommended, otherwise skip)

## Staff Notes
(Talking points for staff, if relevant)

Keep it action-focused. Every item should answer "what to do and when."`;
}
