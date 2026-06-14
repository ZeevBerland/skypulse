import { NextResponse } from 'next/server';
import { getBusinessById } from '@/lib/db';
import { getNearbyPlaces } from '@/lib/services/places';

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('business_id');

  if (!businessId) {
    return NextResponse.json({ error: 'business_id is required' }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  try {
    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    const places = await getNearbyPlaces(
      business.lat,
      business.lng,
      business.business_type,
      business.id,
      false,
      business.name,
    );

    console.log(`[Places API] Returning ${places.length} places for "${business.name}" (${business.id})`);
    return NextResponse.json(places, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('[Places API]', error);
    return NextResponse.json([], { status: 200, headers: NO_CACHE_HEADERS });
  }
}
