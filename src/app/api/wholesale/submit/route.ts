import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { insertWholesaleApplication } from '@/lib/wholesale-applications-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WholesaleItemPayload {
  id: string;
  slug: string;
  name: string;
  productNumber: number;
  price: number;
  quantity: number;
  subtotal: number;
}

interface WholesalePayload {
  buyerType?: 'business' | 'individual';
  company: { name: string; address: string } | null;
  contact: { name: string; email: string; phone: string };
  shippingAddress?: string;
  notes?: string;
  items: WholesaleItemPayload[];
  itemCount: number;
  total: number;
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

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildEmail(p: WholesalePayload) {
  const isBusiness = p.buyerType !== 'individual' && !!p.company;
  const heading = isBusiness ? 'New Wholesale Request' : 'New Bulk Order Request (Individual)';

  const itemsHtml = p.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">#${i.productNumber} ${escapeHtml(
          i.name
        )}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(
          i.price
        )}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;"><strong>${formatPrice(
          i.subtotal
        )}</strong></td>
      </tr>`
    )
    .join('');

  const businessBlock = isBusiness && p.company
    ? `<h3 style="margin-top:24px;color:#1C1917;">Business</h3>
       <p style="line-height:1.6;">
         <strong>Company:</strong> ${escapeHtml(p.company.name)}<br/>
         <strong>Address:</strong> ${escapeHtml(p.company.address)}
       </p>`
    : `<h3 style="margin-top:24px;color:#1C1917;">Buyer</h3>
       <p style="line-height:1.6;">
         <strong>Type:</strong> Individual (guest)<br/>
         <strong>Shipping:</strong> ${escapeHtml(p.shippingAddress || '(not provided)')}
       </p>`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#222;">
      <h2 style="color:#1C1917;border-bottom:2px solid #C9A96E;padding-bottom:8px;">
        ${heading}
      </h2>

      ${businessBlock}

      <h3 style="margin-top:24px;color:#1C1917;">Contact</h3>
      <p style="line-height:1.6;">
        <strong>Name:</strong> ${escapeHtml(p.contact.name)}<br/>
        <strong>Email:</strong> <a href="mailto:${escapeHtml(p.contact.email)}">${escapeHtml(
          p.contact.email
        )}</a><br/>
        <strong>Phone:</strong> ${escapeHtml(p.contact.phone)}
      </p>

      ${
        p.notes
          ? `<h3 style="margin-top:24px;color:#1C1917;">Notes</h3>
             <p style="line-height:1.6;white-space:pre-wrap;">${escapeHtml(p.notes)}</p>`
          : ''
      }

      <h3 style="margin-top:24px;color:#1C1917;">Requested Items (${p.itemCount})</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f1ea;">
            <th style="padding:8px 12px;text-align:left;">Product</th>
            <th style="padding:8px 12px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;text-align:right;">Unit</th>
            <th style="padding:8px 12px;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:12px;text-align:right;font-weight:bold;">Retail Value:</td>
            <td style="padding:12px;text-align:right;font-weight:bold;">${formatPrice(p.total)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin-top:24px;font-size:12px;color:#888;">
        Wholesale pricing is TBD &mdash; quote this customer based on volume and custom requirements.
      </p>
    </div>
  `;

  const buyerLines = isBusiness && p.company
    ? ['BUSINESS', `Company: ${p.company.name}`, `Address: ${p.company.address}`]
    : ['BUYER', 'Type: Individual (guest)', `Shipping: ${p.shippingAddress || '(not provided)'}`];

  const text = [
    isBusiness ? 'NEW WHOLESALE REQUEST' : 'NEW BULK ORDER REQUEST (INDIVIDUAL)',
    '',
    ...buyerLines,
    '',
    'CONTACT',
    `Name:  ${p.contact.name}`,
    `Email: ${p.contact.email}`,
    `Phone: ${p.contact.phone}`,
    '',
    p.notes ? `NOTES\n${p.notes}\n` : '',
    `ITEMS (${p.itemCount})`,
    ...p.items.map(
      (i) =>
        `  #${i.productNumber} ${i.name}  x${i.quantity}  ${formatPrice(i.price)}  = ${formatPrice(i.subtotal)}`
    ),
    '',
    `Retail Value: ${formatPrice(p.total)}`,
  ].join('\n');

  return { html, text };
}

export async function POST(req: NextRequest) {
  let payload: WholesalePayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validation
  const errors: string[] = [];
  const isBusinessBuyer = payload?.buyerType !== 'individual';
  if (isBusinessBuyer) {
    if (!payload?.company?.name?.trim()) errors.push('Company name is required');
    if (!payload?.company?.address?.trim()) errors.push('Company address is required');
  } else if (!payload?.shippingAddress?.trim()) {
    errors.push('Shipping address is required');
  }
  if (!payload?.contact?.name?.trim()) errors.push('Contact name is required');
  if (!payload?.contact?.email?.trim() || !isValidEmail(payload.contact.email)) {
    errors.push('Valid email is required');
  }
  if (!payload?.contact?.phone?.trim()) errors.push('Phone number is required');
  if (!Array.isArray(payload?.items) || payload.items.length === 0) {
    errors.push('Cart must contain at least one item');
  }
  if (errors.length) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
  }

  // Persist the application first — the DB is the source of truth, email
  // is just a courtesy notification. If the insert fails we bail without
  // sending email so Jeff doesn't see an inquiry he can't find in /admin.
  let applicationId: string;
  try {
    const application = await insertWholesaleApplication({
      buyerType: isBusinessBuyer ? 'business' : 'individual',
      company: isBusinessBuyer && payload.company
        ? { name: payload.company.name.trim(), address: payload.company.address.trim() }
        : null,
      contact: {
        name: payload.contact.name.trim(),
        email: payload.contact.email.trim(),
        phone: payload.contact.phone.trim(),
      },
      shippingAddress: !isBusinessBuyer ? (payload.shippingAddress?.trim() ?? null) : null,
      cartItems: payload.items,
      cartItemCount: payload.itemCount,
      cartRetailTotalCents: payload.total,
      notes: payload.notes?.trim() || null,
    });
    applicationId = application.id;
  } catch (err) {
    console.error('[wholesale/submit] DB insert failed:', err);
    return NextResponse.json(
      { error: 'Could not record your application. Please try again in a moment.' },
      { status: 500 },
    );
  }

  const { html, text } = buildEmail(payload);
  const buyerLabel = isBusinessBuyer && payload.company
    ? payload.company.name
    : `${payload.contact.name} (individual)`;
  const subject = `${isBusinessBuyer ? 'Wholesale' : 'Bulk Order'} Request — ${buyerLabel} (${payload.itemCount} items)`;
  const to = process.env.WHOLESALE_EMAIL_TO || 'jeff.t1.bania@gmail.com';
  const from = process.env.WHOLESALE_EMAIL_FROM || 'onboarding@resend.dev';
  const apiKey = process.env.RESEND_API_KEY;

  // Email is best-effort now that the DB has the record. If Resend isn't
  // configured or delivery fails we still return success — the application
  // is already in /admin/wholesale for review.
  if (!apiKey) {
    console.warn('[wholesale/submit] RESEND_API_KEY not set — application saved, email skipped.');
    return NextResponse.json({ ok: true, applicationId, delivered: false });
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      replyTo: payload.contact.email,
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error('[wholesale/submit] Resend error (non-fatal):', result.error);
      return NextResponse.json({ ok: true, applicationId, delivered: false });
    }

    return NextResponse.json({ ok: true, applicationId, delivered: true, id: result.data?.id });
  } catch (err) {
    console.error('[wholesale/submit] Email exception (non-fatal):', err);
    return NextResponse.json({ ok: true, applicationId, delivered: false });
  }
}
