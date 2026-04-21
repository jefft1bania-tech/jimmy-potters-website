import { NextRequest, NextResponse } from 'next/server';
import { getResend } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const KEYSER_EMAIL = 'jeff.t.bania@gmail.com';
const FROM = process.env.WHOLESALE_EMAIL_FROM || 'onboarding@resend.dev';

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 });
  }

  const audio = form.get('audio');
  const token = (form.get('token') as string | null)?.trim() || '';
  const subject = (form.get('subject') as string | null)?.trim() || '';
  const from = (form.get('from') as string | null)?.trim() || 'jimmy';
  const durationRaw = (form.get('duration') as string | null)?.trim() || '';

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: 'Missing audio' }, { status: 400 });
  }
  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Audio too large (max 25MB)' }, { status: 413 });
  }

  const originalName = (audio as File).name;
  const filename =
    originalName && originalName !== 'blob' ? originalName : 'voice-note.webm';
  const contentType = audio.type || 'audio/webm';
  const audioBuffer = Buffer.from(await audio.arrayBuffer());
  const sizeKb = Math.round(audioBuffer.byteLength / 1024);

  const resend = getResend();
  if (!resend) {
    console.error('[voice/share] RESEND_API_KEY missing — cannot deliver voice note');
    return NextResponse.json(
      { error: 'Email service not configured (RESEND_API_KEY missing)' },
      { status: 500 },
    );
  }

  const duration = durationRaw || 'unknown';
  const timestamp = new Date().toISOString();
  const senderLabel = from === 'jimmy' ? 'Jimmy' : from;
  const emailSubject = `[Share-a-Story] Voice note from ${senderLabel} (${duration}s)`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#2a2a2a;max-width:640px;">
      <h2 style="color:#6b4f3a;border-bottom:2px solid #C9A96E;padding-bottom:8px;">
        Share-a-Story — new voice note
      </h2>
      <p style="margin:16px 0 8px 0;color:#555;">
        <strong>From:</strong> ${escapeHtml(from)}<br/>
        <strong>Received:</strong> ${escapeHtml(timestamp)}<br/>
        <strong>Duration:</strong> ${escapeHtml(duration)}s<br/>
        <strong>Size:</strong> ${sizeKb} KB<br/>
        ${subject ? `<strong>Replying to:</strong> ${escapeHtml(subject)}<br/>` : ''}
        <strong>Token:</strong> <code>${escapeHtml(token)}</code>
      </p>
      <p style="margin:20px 0;padding:16px 20px;background:#F7F3EE;border-left:4px solid #92653A;color:#1C1917;">
        Audio attached as <code>${escapeHtml(filename)}</code>. Open the attachment to listen.
      </p>
    </div>
  `;

  const text = [
    'Share-a-Story — new voice note',
    '',
    `From: ${from}`,
    `Received: ${timestamp}`,
    `Duration: ${duration}s`,
    `Size: ${sizeKb} KB`,
    subject ? `Replying to: ${subject}` : '',
    `Token: ${token}`,
    '',
    `Audio attached as ${filename}.`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: KEYSER_EMAIL,
      subject: emailSubject,
      html,
      text,
      attachments: [
        {
          filename,
          content: audioBuffer,
          contentType,
        },
      ],
    });
    if (result.error) {
      console.error('[voice/share] Resend error:', result.error);
      return NextResponse.json({ error: 'Email delivery failed' }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: result.data?.id, sizeKb });
  } catch (err) {
    console.error('[voice/share] Resend exception:', err);
    return NextResponse.json({ error: 'Email delivery failed' }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/voice/share', method: 'POST' });
}
