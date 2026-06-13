export function buildCampaignCopyPrompt(
  businessName: string,
  businessType: string,
  recommendationTitle: string,
  recommendationAction: string,
  recommendationWhy: string,
  channel: 'whatsapp' | 'instagram' | 'shelf_sign' | 'staff_script',
): string {
  const channelGuidelines: Record<string, string> = {
    whatsapp: `WhatsApp message:
- Max 160 characters
- Friendly, personal tone
- Include a clear call-to-action
- Use 1-2 relevant emojis maximum
- No links (just text)`,
    instagram: `Instagram story text:
- Max 100 characters (overlay text)
- Eye-catching, short
- Include a hook or question
- Suggest a simple visual concept`,
    shelf_sign: `Shelf sign / in-store signage:
- Max 50 characters headline
- Max 100 characters subtext
- Clear, readable at distance
- Include price or offer if relevant`,
    staff_script: `Staff talking point:
- 2-3 sentences max
- Conversational tone
- Key benefit for the customer
- Suggest when to use (e.g., "when customers ask about...")`,
  };

  return `Generate ${channel} campaign copy for a local ${businessType}.

Business: ${businessName}
Recommendation: ${recommendationTitle}
Action: ${recommendationAction}
Why: ${recommendationWhy}

${channelGuidelines[channel]}

Rules:
- Keep it local and relevant
- Action-oriented language
- No unsupported medical claims
- No exaggerated urgency
- Appropriate for the business type

Return ONLY the copy text, nothing else.`;
}
