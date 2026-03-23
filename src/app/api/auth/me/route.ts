import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findMemberById, stripPrivate } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('jp_token')?.value;

  if (!token) {
    return NextResponse.json({ member: null });
  }

  const payload = verifyToken(token);
  if (!payload) {
    const response = NextResponse.json({ member: null });
    response.cookies.delete('jp_token');
    return response;
  }

  const member = findMemberById(payload.id);
  if (!member) {
    const response = NextResponse.json({ member: null });
    response.cookies.delete('jp_token');
    return response;
  }

  return NextResponse.json({ member: stripPrivate(member) });
}

// Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('jp_token');
  return response;
}
