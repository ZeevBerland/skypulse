import { NextResponse } from 'next/server';
import { getRecommendations, getRecommendationById, updateRecommendation, getAgentRuns } from '@/lib/db';

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');

    if (!businessId) {
      return NextResponse.json({ error: 'business_id query param is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const [recommendations, agentRuns] = await Promise.all([
      getRecommendations(businessId),
      getAgentRuns(businessId),
    ]);
    const latestWeeklyRun = agentRuns.find(r => r.run_type === 'weekly') ?? null;
    return NextResponse.json({ recommendations, run: latestWeeklyRun }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Recommendations GET]', message);
    return NextResponse.json({ error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, reason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 },
      );
    }

    const validStatuses = ['suggested', 'accepted', 'active', 'updated', 'cancelled', 'completed', 'ignored'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    const existing = await getRecommendationById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const updated = await updateRecommendation(id, {
      status,
      update_reason: reason || existing.update_reason,
    });

    return NextResponse.json({ recommendation: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Recommendations PATCH]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
