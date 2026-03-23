import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findMemberById, updateMemberPreferences, stripPrivate } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  const token = req.cookies.get('jp_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  try {
    const { preferences } = await req.json();

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences' }, { status: 400 });
    }

    const updated = updateMemberPreferences(payload.id, {
      newsletter: Boolean(preferences.newsletter),
      newProducts: Boolean(preferences.newProducts),
      classSchedule: Boolean(preferences.classSchedule),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ member: stripPrivate(updated) });
  } catch {
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
