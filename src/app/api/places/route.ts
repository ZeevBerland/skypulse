import { NextResponse } from 'next/server';
import { getBusinessById } from '@/lib/db';
import { getNearbyPlaces } from '@/lib/services/places';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('business_id');

  if (!businessId) {
    return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
  }

  try {
    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const places = await getNearbyPlaces(
      business.lat,
      business.lng,
      business.business_type,
      business.id,
    );

    return NextResponse.json(places);
  } catch (error) {
    console.error('[Places API]', error);
    return NextResponse.json([], { status: 200 });
  }
}
