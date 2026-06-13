export const CONFIDENCE_BANDS = {
  high: { days: [0, 1], label: 'High', description: 'Tomorrow or today. Hourly forecast available, strong signal match.' },
  medium: { days: [2, 3, 4], label: 'Medium', description: 'Days 3-5. Daily forecast, partially verified events.' },
  low: { days: [5, 6], label: 'Low', description: 'Days 6-7. Weak signals, unverified events, conflicting data.' },
} as const;

export function getConfidenceBand(dayOffset: number): 'high' | 'medium' | 'low' {
  if (dayOffset <= 1) return 'high';
  if (dayOffset <= 4) return 'medium';
  return 'low';
}

export const SCORING_GUIDELINES = `
## Scoring Guidelines

### Daily Opportunity Score (0-100)
Sum of weighted components:
- Weather Demand Score (0-25): Higher when weather drives product demand (heat -> hydration, rain -> umbrellas)
- Air Quality Relevance Score (0-15): Higher when AQ conditions drive health-product demand
- Event Proximity Score (0-20): Higher when nearby events drive foot traffic
- Place Context Score (0-10): Based on competitor density and demand anchors
- Competitor Timing Score (0-15): Higher when competitors close early or are unavailable
- Vertical Sensitivity Score (0-15): How sensitive this business type is to today's conditions

### Daily Risk Score (0-100)
Sum of weighted components:
- Weather Disruption Score (0-25): Severe weather reducing foot traffic
- Air Quality Risk Score (0-15): Health advisory level conditions
- Stockout Risk Score (0-20): Demand spike without inventory preparation
- Staffing Risk Score (0-15): Understaffed during high-demand windows
- Event Uncertainty Score (0-10): Unverified or potentially changing events
- Forecast Uncertainty Score (0-15): Low confidence in weather data

### Recommendation Priority
priority = (business_impact × confidence × urgency) / effort
- critical: Immediate action needed, high revenue impact
- high: Action within hours, significant impact
- medium: Action within a day, moderate impact
- low: Nice to have, low urgency
`;

export const RECOMMENDATION_SCHEMA_PROMPT = `
Each recommendation MUST follow this exact JSON structure:
{
  "title": "Short actionable title (max 60 chars)",
  "action": "Specific, concrete action to take with timing",
  "why": "Brief explanation linking signals to business impact",
  "recommendation_type": "inventory | staffing | marketing | layout | hours | alert",
  "priority": "low | medium | high | critical",
  "confidence": 0.0 to 1.0,
  "effort": "low | medium | high",
  "time_window": "HH:MM-HH:MM or 'all_day'",
  "source_signals": ["signal_name_1", "signal_name_2"],
  "expected_impact": {
    "revenue": "low | medium | medium-high | high",
    "stockout_risk_reduction": "low | medium | high",
    "customer_experience": "low | medium | high"
  }
}

Rules:
- Every action MUST be specific and time-bound
- Every action MUST be linked to at least one source signal
- Do NOT invent data not present in the signals
- Do NOT make unsupported medical claims
- Keep explanations factual and concise
`;
