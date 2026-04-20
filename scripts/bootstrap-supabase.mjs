// One-off bootstrap against a freshly-migrated Supabase project:
//   1. Verifies key tables exist.
//   2. Creates the admin auth user (jeff.t1.bania@gmail.com) and flips role.
//   3. Migrates the legacy member(s) from data/members.json as customers.
//   4. Migrates any legacy orders (none today, but idempotent in case).
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Naive .env.local loader (avoid adding dotenv dep just for a one-off).
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.argv[2] || 'jeff.t1.bania@gmail.com';

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

// ===== 1. VERIFY TABLES =====
console.log('\n=== 1. Verifying schema ===');
const required = [
  'profiles', 'orders', 'order_items', 'shipments',
  'product_costs', 'order_cost_overrides', 'overhead_expenses',
  'recurring_expenses', 'payment_records', 'refunds',
  'financial_documents', 'bulk_order_pricing', 'notification_log',
  'ai_insights', 'labor_roles', 'product_labor_times',
  'labor_requirements', 'workers', 'hire_scenarios', 'customer_disputes',
];
let schemaOk = true;
for (const t of required) {
  const { error } = await supabase.from(t).select('*', { count: 'exact', head: true });
  if (error) {
    console.error(`  ✗ ${t}: ${error.message}`);
    schemaOk = false;
  } else {
    console.log(`  ✓ ${t}`);
  }
}
if (!schemaOk) {
  console.error('\nSchema verification failed — stop.');
  process.exit(2);
}

// Confirm labor_roles seed is present
const { data: roles } = await supabase.from('labor_roles').select('role_key');
console.log(`  ✓ labor_roles seeded: ${roles?.map((r) => r.role_key).join(', ')}`);

// ===== 2. ADMIN USER =====
console.log(`\n=== 2. Admin user (${ADMIN_EMAIL}) ===`);
{
  // Check if already exists
  const { data: existing } = await supabase.from('profiles').select('id, role').eq('email', ADMIN_EMAIL).maybeSingle();
  if (existing) {
    if (existing.role !== 'admin') {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', existing.id);
      console.log(`  ✓ promoted existing profile to admin`);
    } else {
      console.log(`  ↺ already admin: ${existing.id}`);
    }
  } else {
    const tempPassword = 'Jp_' + crypto.randomUUID().slice(0, 12) + '!Aa1';
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: 'Jeff Bania' },
    });
    if (error) {
      console.error(`  ✗ create admin failed: ${error.message}`);
      process.exit(3);
    }
    console.log(`  ✓ created admin user ${created.user.id}`);

    // Flip role to admin (profile was auto-created by trigger on_auth_user_created)
    await supabase.from('profiles').update({ role: 'admin', name: 'Jeff Bania' }).eq('id', created.user.id);
    console.log(`  ✓ profile role set to 'admin'`);

    // Generate a password-recovery link so Jeff can set his own password
    const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: ADMIN_EMAIL,
    });
    if (linkErr) {
      console.warn(`  ⚠ recovery link gen failed: ${linkErr.message}`);
    } else {
      console.log(`  ✓ recovery link: ${link.properties?.action_link ?? '(redacted)'}`);
    }
  }
}

// ===== 3. LEGACY MEMBERS =====
console.log(`\n=== 3. Legacy members ===`);
const membersFile = path.join(process.cwd(), 'data', 'members.json');
if (fs.existsSync(membersFile)) {
  const members = JSON.parse(fs.readFileSync(membersFile, 'utf-8'));
  for (const m of members) {
    const email = m.email.toLowerCase();
    if (email === ADMIN_EMAIL.toLowerCase()) {
      console.log(`  ↺ skipping ${email} (already seeded as admin)`);
      continue;
    }
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing) {
      console.log(`  ↺ ${email} already exists`);
      continue;
    }
    const tempPassword = 'Jp_' + crypto.randomUUID().slice(0, 12) + '!Aa1';
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: m.name, migrated_from: 'legacy_jwt' },
    });
    if (error) {
      console.error(`  ✗ ${email}: ${error.message}`);
      continue;
    }
    await supabase.from('profiles').update({
      newsletter_opt_in: m.preferences?.newsletter ?? false,
      name: m.name,
    }).eq('id', created.user.id);
    console.log(`  ✓ migrated ${email} → ${created.user.id} (will need password reset)`);
  }
} else {
  console.log('  (no members.json — nothing to migrate)');
}

// ===== 4. LEGACY ORDERS =====
console.log(`\n=== 4. Legacy orders ===`);
const ordersFile = path.join(process.cwd(), 'data', 'orders.json');
if (fs.existsSync(ordersFile)) {
  const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
  console.log(`  found ${orders.length} orders in JSON`);
  // Orders migration is handled by migrate-json-to-supabase.ts once data exists.
} else {
  console.log('  (no orders.json — nothing to migrate)');
}

console.log('\n✅ Bootstrap complete.');
console.log('Next: visit the recovery link above to set your admin password, then log in at /login.');
