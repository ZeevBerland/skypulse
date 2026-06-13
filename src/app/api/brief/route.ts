import { NextResponse } from 'next/server';
import { getBusinessById } from '@/lib/db';
import { getGeminiModel } from '@/lib/services/gemini';
import { buildWeeklyBriefPrompt, buildTomorrowBriefPrompt } from '@/lib/prompts/manager-brief';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, type, recommendations, signal_summary } = body;

    if (!business_id || !type || !recommendations) {
      return NextResponse.json(
        { error: 'business_id, type, and recommendations are required' },
        { status: 400 },
      );
    }

    if (type !== 'weekly' && type !== 'tomorrow') {
      return NextResponse.json(
        { error: 'type must be "weekly" or "tomorrow"' },
        { status: 400 },
      );
    }

    const business = await getBusinessById(business_id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const recsText = Array.isArray(recommendations)
      ? recommendations.map((r: { priority?: string; title?: string; action?: string; date?: string }) =>
          `- [${r.priority || 'medium'}] ${r.title || 'Untitled'}: ${r.action || ''} (${r.date || ''})`
        ).join('\n')
      : String(recommendations);

    let prompt: string;

    if (type === 'weekly') {
      prompt = buildWeeklyBriefPrompt(
        business.name,
        business.business_type,
        signal_summary || 'No weekly summary provided.',
        recsText,
        signal_summary || 'No signal highlights available.',
      );
    } else {
      prompt = buildTomorrowBriefPrompt(
        business.name,
        business.business_type,
        signal_summary || 'No day-ahead plan provided.',
        recsText,
      );
    }

    const { ai, model } = getGeminiModel();
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const brief = result.text ?? '';

    return NextResponse.json({ brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Brief API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
