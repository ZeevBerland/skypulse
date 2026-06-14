import { NextResponse } from 'next/server';
import { getBusinesses, upsertBusiness, deleteBusiness } from '@/lib/db';
import { demoBusinessIds } from '@/lib/mock/businesses';

export async function GET() {
  try {
    const businesses = await getBusinesses();
    return NextResponse.json({ businesses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Businesses GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, business_type, address, lat, lng, timezone, opening_hours_json } = body;

    if (!name || !business_type || !address) {
      return NextResponse.json(
        { error: 'name, business_type, and address are required' },
        { status: 400 },
      );
    }

    const business = await upsertBusiness({
      name,
      business_type,
      address,
      lat: lat || 0,
      lng: lng || 0,
      timezone: timezone || 'Asia/Jerusalem',
      opening_hours_json: opening_hours_json || {},
    });

    return NextResponse.json({ business });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Businesses POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (demoBusinessIds.includes(id)) {
      return NextResponse.json({ error: 'Cannot delete demo profiles' }, { status: 403 });
    }

    await deleteBusiness(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Businesses DELETE]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
