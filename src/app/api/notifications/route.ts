import { NextResponse } from 'next/server';
import { getNotifications, markAllNotificationsRead } from '@/lib/db';

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    const notifications = await getNotifications();
    return NextResponse.json({ notifications }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('[Notifications GET]', error);
    return NextResponse.json({ notifications: [] }, { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === 'mark_all_read') {
      await markAllNotificationsRead();
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
