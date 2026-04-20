import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Body = {
  is_bulk?: boolean;
  customer_type?: 'wholesale' | 'faire' | 'direct_bulk' | 'school_program';
  tier_discount_pct?: number;
  volume_unit_cost_cents?: number;
  notes?: string;
};

const CUSTOMER_TYPES = ['wholesale', 'faire', 'direct_bulk', 'school_program'] as const;

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad(400, 'Invalid JSON');
  }

  if (typeof body.is_bulk !== 'boolean') return bad(400, 'is_bulk boolean is required');

  if (body.is_bulk) {
    if (!body.customer_type || !(CUSTOMER_TYPES as readonly string[]).includes(body.customer_type)) {
      return bad(400, `customer_type must be one of ${CUSTOMER_TYPES.join(', ')} when is_bulk=true`);
    }
  }
  if (body.tier_discount_pct !== undefined) {
    if (typeof body.tier_discount_pct !== 'number' || body.tier_discount_pct < 0 || body.tier_discount_pct > 100) {
      return bad(400, 'tier_discount_pct must be between 0 and 100');
    }
  }
  if (body.volume_unit_cost_cents !== undefined) {
    if (!Number.isInteger(body.volume_unit_cost_cents) || body.volume_unit_cost_cents < 0) {
      return bad(400, 'volume_unit_cost_cents must be a non-negative integer');
    }
  }

  const supabase = createSupabaseAdminClient();
  const admin = supabase as unknown as { from: (t: string) => any };

  const { data: order, error: lookupErr } = await admin
    .from('orders')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();
  if (lookupErr) return bad(500, `lookup failed: ${lookupErr.message}`);
  if (!order) return bad(404, 'Order not found');

  const { error: flagErr } = await admin
    .from('orders')
    .update({ is_bulk: body.is_bulk })
    .eq('id', params.id);
  if (flagErr) return bad(500, `orders update failed: ${flagErr.message}`);

  if (body.is_bulk) {
    const pricingRow: Record<string, unknown> = {
      order_id: params.id,
      customer_type: body.customer_type,
    };
    if (body.tier_discount_pct !== undefined)     pricingRow.tier_discount_pct = body.tier_discount_pct;
    if (body.volume_unit_cost_cents !== undefined) pricingRow.volume_unit_cost_cents = body.volume_unit_cost_cents;
    if (body.notes !== undefined)                  pricingRow.notes = body.notes ?? null;

    const { error: upsertErr } = await admin
      .from('bulk_order_pricing')
      .upsert(pricingRow, { onConflict: 'order_id' });
    if (upsertErr) return bad(500, `bulk_order_pricing upsert failed: ${upsertErr.message}`);
  }

  return NextResponse.json({ ok: true, is_bulk: body.is_bulk });
}
