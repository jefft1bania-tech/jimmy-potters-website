import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { insertWholesaleApplication } from '@/lib/wholesale-applications-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ApplyPayload {
  companyName?: string;
  companyAddress?: string;
  companyWebsite?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  expectedAnnualVolumeCents?: number | null;
  notes?: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  let payload: ApplyPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const errors: string[] = [];
  if (!payload?.companyName?.trim()) errors.push('Company or shop name is required');
  if (!payload?.contactName?.trim()) errors.push('Contact name is required');
  if (!payload?.contactEmail?.trim() || !isValidEmail(payload.contactEmail)) {
    errors.push('Valid email is required');
  }
  if (!payload?.contactPhone?.trim()) errors.push('Phone number is required');
  if (errors.length) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
  }

  let applicationId: string;
  try {
    const application = await insertWholesaleApplication({
      buyerType: 'business',
      company: {
        name: payload.companyName!.trim(),
        address: payload.companyAddress?.trim() || '',
        website: payload.companyWebsite?.trim() || undefined,
      },
      contact: {
        name: payload.contactName.trim(),
        email: payload.contactEmail.trim(),
        phone: payload.contactPhone.trim(),
      },
      shippingAddress: null,
      expectedAnnualVolumeCents: payload.expectedAnnualVolumeCents ?? null,
      cartItems: [],
      cartItemCount: 0,
      cartRetailTotalCents: 0,
      notes: payload.notes?.trim() || null,
    });
    applicationId = application.id;
  } catch (err) {
    console.error('[wholesale/apply] DB insert failed:', err);
    return NextResponse.json(
      { error: 'Could not record your application. Please try again in a moment.' },
      { status: 500 },
    );
  }

  const to = process.env.WHOLESALE_EMAIL_TO || 'jeff.t1.bania@gmail.com';
  const from = process.env.WHOLESALE_EMAIL_FROM || 'onboarding@resend.dev';
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true, applicationId, delivered: false });
  }

  const volumeLine = payload.expectedAnnualVolumeCents
    ? `<p><strong>Expected annual volume:</strong> ~$${(payload.expectedAnnualVolumeCents / 100).toLocaleString()}</p>`
    : '';
  const websiteLine = payload.companyWebsite?.trim()
    ? `<p><strong>Website:</strong> ${escapeHtml(payload.companyWebsite.trim())}</p>`
    : '';
  const notesBlock = payload.notes?.trim()
    ? `<h3 style="margin-top:20px;color:#1C1917;">Notes from applicant</h3>
       <p style="line-height:1.6;white-space:pre-wrap;">${escapeHtml(payload.notes.trim())}</p>`
    : '';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#222;">
      <h2 style="color:#1C1917;border-bottom:2px solid #C9A96E;padding-bottom:8px;">
        New Wholesale Account Application
      </h2>
      <h3 style="margin-top:20px;color:#1C1917;">Business</h3>
      <p style="line-height:1.6;">
        <strong>Shop / Company:</strong> ${escapeHtml(payload.companyName!.trim())}<br/>
        ${payload.companyAddress ? `<strong>Address:</strong> ${escapeHtml(payload.companyAddress.trim())}<br/>` : ''}
      </p>
      ${websiteLine}
      ${volumeLine}
      <h3 style="margin-top:20px;color:#1C1917;">Contact</h3>
      <p style="line-height:1.6;">
        <strong>Name:</strong> ${escapeHtml(payload.contactName.trim())}<br/>
        <strong>Email:</strong> <a href="mailto:${escapeHtml(payload.contactEmail.trim())}">${escapeHtml(payload.contactEmail.trim())}</a><br/>
        <strong>Phone:</strong> ${escapeHtml(payload.contactPhone.trim())}
      </p>
      ${notesBlock}
      <p style="margin-top:24px;font-size:12px;color:#888;">
        Review + approve at <a href="https://website-three-omega-62.vercel.app/admin/wholesale">/admin/wholesale</a>.
      </p>
    </div>
  `;

  const subject = `Wholesale Application — ${payload.companyName!.trim()}`;
  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      replyTo: payload.contactEmail.trim(),
      subject,
      html,
    });
    if (result.error) {
      console.error('[wholesale/apply] Resend error (non-fatal):', result.error);
      return NextResponse.json({ ok: true, applicationId, delivered: false });
    }
    return NextResponse.json({ ok: true, applicationId, delivered: true, id: result.data?.id });
  } catch (err) {
    console.error('[wholesale/apply] Email exception (non-fatal):', err);
    return NextResponse.json({ ok: true, applicationId, delivered: false });
  }
}
