import { NextResponse } from 'next/server';
import { getNotifications, markAllNotificationsRead } from '@/lib/db';

export async function GET() {
  try {
    const notifications = await getNotifications();
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('[Notifications GET]', error);
    return NextResponse.json({ notifications: [] });
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
