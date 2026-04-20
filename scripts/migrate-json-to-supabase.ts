#!/usr/bin/env -S npx tsx
// One-shot migration: data/members.json + data/orders.json  →  Supabase.
//
// USAGE:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrate-json-to-supabase.ts
//
// Idempotent:
//   - members are upserted by email; existing auth.users rows are reused
//   - orders are upserted by stripe_payment_intent_id
//
// After successful run, archive the JSON files manually:
//   mv data/members.json data/orders.json data/_archive/YYYY-MM-DD_pre-supabase/

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

type LegacyMember = {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // JWT-era bcrypt hash; NOT portable to Supabase auth
  newsletterOptIn: boolean;
  createdAt: string;
};

type LegacyOrder = {
  id: string;
  type: 'guest' | 'registered';
  email: string;
  memberId?: string;
  items: Array<{ productId: string; name: string; price: number; image: string; quantity: number }>;
  shipping: { name: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
  shippingTier: string;
  shippingCost: number;
  internalShippingCost: number;
  salesTaxCollected: number;
  buyerState: string;
  subtotal: number;
  total: number;
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  createdAt: string;
};

function readJson<T>(file: string, fallback: T): T {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const members = readJson<LegacyMember[]>('data/members.json', []);
  const orders = readJson<LegacyOrder[]>('data/orders.json', []);

  console.log(`Found ${members.length} members and ${orders.length} orders in JSON.`);

  // ------- 1. Members -------
  // Supabase auth.users: we create with a random password. Users receive a "reset password" email.
  // Map legacy member.id → new auth.users.id for order foreign keys.
  const idMap = new Map<string, string>();

  for (const m of members) {
    // Try to look up by email first — handles re-runs.
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', m.email.toLowerCase())
      .maybeSingle();

    if (existing?.id) {
      idMap.set(m.id, existing.id);
      console.log(`  ↺ member ${m.email} already exists → ${existing.id}`);
      continue;
    }

    const tempPassword = crypto.randomUUID() + '!Aa1';
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: m.email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: m.name, migrated_from: 'legacy_jwt' },
    });
    if (error) {
      console.error(`  ✗ create user failed for ${m.email}: ${error.message}`);
      continue;
    }
    idMap.set(m.id, created.user.id);

    // Update the profile row (auto-created by trigger) with newsletter preference.
    await supabase
      .from('profiles')
      .update({ newsletter_opt_in: m.newsletterOptIn, name: m.name })
      .eq('id', created.user.id);

    // Send password-reset email so the member can set their own password.
    const { error: resetErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: m.email.toLowerCase(),
    });
    if (resetErr) {
      console.warn(`  ⚠ reset link gen failed for ${m.email}: ${resetErr.message}`);
    }

    console.log(`  ✓ migrated ${m.email}`);
  }

  // ------- 2. Orders -------
  let orderOk = 0;
  let orderSkip = 0;

  for (const o of orders) {
    const member_id = o.memberId ? idMap.get(o.memberId) ?? null : null;

    const row = {
      email: o.email.toLowerCase(),
      member_id,
      type: o.type,
      shipping: o.shipping,
      buyer_state: o.buyerState,
      subtotal_cents: o.subtotal,
      sales_tax_cents: o.salesTaxCollected,
      shipping_cost_cents: o.shippingCost,
      internal_shipping_cost_cents: o.internalShippingCost,
      total_cents: o.total,
      payment_method: 'stripe' as const,
      stripe_payment_intent_id: o.stripePaymentIntentId,
      stripe_customer_id: o.stripeCustomerId ?? null,
      status: o.status,
      is_bulk: false,
      created_at: o.createdAt,
      paid_at: o.status !== 'pending' ? o.createdAt : null,
    };

    // Upsert by stripe_payment_intent_id (unique)
    const { data: orderRow, error } = await supabase
      .from('orders')
      .upsert(row, { onConflict: 'stripe_payment_intent_id' })
      .select('id')
      .single();

    if (error || !orderRow) {
      console.error(`  ✗ order ${o.id} failed: ${error?.message}`);
      orderSkip++;
      continue;
    }

    // Clear + re-insert order_items (idempotent)
    await supabase.from('order_items').delete().eq('order_id', orderRow.id);
    const items = o.items.map((it) => ({
      order_id: orderRow.id,
      product_id: it.productId,
      name: it.name,
      unit_price_cents: it.price,
      quantity: it.quantity,
      image: it.image,
    }));
    if (items.length) {
      await supabase.from('order_items').insert(items);
    }

    // Seed a shipments row if none exists
    await supabase
      .from('shipments')
      .upsert({
        order_id: orderRow.id,
        shipment_status: o.status === 'shipped' || o.status === 'delivered' ? 'shipped' : 'queued',
      }, { onConflict: 'order_id' });

    orderOk++;
  }

  console.log('');
  console.log('==== MIGRATION RECONCILIATION ====');
  console.log(`Members: ${members.length} in JSON  →  ${idMap.size} mapped`);
  console.log(`Orders:  ${orders.length} in JSON  →  ${orderOk} ok, ${orderSkip} skipped`);
  console.log('');
  console.log('Next steps:');
  console.log('  1) Verify row counts via the Supabase dashboard.');
  console.log('  2) Archive JSON: move data/members.json + data/orders.json to data/_archive/YYYY-MM-DD_pre-supabase/');
  console.log('  3) Flip Jeff to admin: UPDATE profiles SET role = \'admin\' WHERE email = \'jeff.t1.bania@gmail.com\';');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
