import { NextResponse } from 'next/server';
import { getBusinessById, getCompetitorUpdates } from '@/lib/db';
import { scanCompetitors } from '@/lib/services/competitor-intel';

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('business_id');

  if (!businessId) {
    return NextResponse.json({ error: 'business_id is required' }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  try {
    const updates = await getCompetitorUpdates(businessId, 30);
    return NextResponse.json(updates, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('[Competitors GET]', error);
    return NextResponse.json([], { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id } = body;

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    const business = await getBusinessById(business_id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const updates = await scanCompetitors(business);
    return NextResponse.json(updates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Competitors POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
