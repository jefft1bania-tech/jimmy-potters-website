// Promote a Supabase auth user to profiles.role = 'admin' (or list existing admins).
//
// Usage:
//   node scripts/promote-admin.mjs --list
//   node scripts/promote-admin.mjs <email>
//   node scripts/promote-admin.mjs <email> --demote   # flips back to 'customer'
//
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local (no dotenv dep in this project — parse manually)
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf-8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, k, rawVal] = m;
    if (process.env[k]) continue;
    let v = rawVal.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check .env.local.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const args = process.argv.slice(2);

async function listAdmins() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, newsletter_opt_in')
    .eq('role', 'admin')
    .order('email', { ascending: true });
  if (error) {
    console.error('Query failed:', error.message);
    process.exit(2);
  }
  console.log(`\nCurrent admins and wholesale accounts (${data.length}):\n`);
  for (const row of data) {
    console.log(`  [${row.role.padEnd(10)}] ${row.email.padEnd(40)} ${row.name ?? ''} (${row.id})`);
  }
  console.log('');
}

async function setRole(email, role) {
  // First check the profile exists
  const { data: profile, error: findErr } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('email', email)
    .maybeSingle();

  if (findErr) {
    console.error('Lookup failed:', findErr.message);
    process.exit(2);
  }

  if (!profile) {
    console.error(`No profile found for ${email}. User must sign up at /login first, then run this script.`);
    process.exit(3);
  }

  if (profile.role === role) {
    console.log(`Already ${role}: ${email}`);
    return;
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profile.id);

  if (updateErr) {
    console.error('Update failed:', updateErr.message);
    process.exit(2);
  }

  console.log(`OK — ${email}: ${profile.role} → ${role}`);
}

if (args[0] === '--list') {
  await listAdmins();
  process.exit(0);
}

const email = args[0];
const demote = args.includes('--demote');

if (!email || email.startsWith('--')) {
  console.error('Usage:');
  console.error('  node scripts/promote-admin.mjs --list');
  console.error('  node scripts/promote-admin.mjs <email>');
  console.error('  node scripts/promote-admin.mjs <email> --demote');
  process.exit(1);
}

await setRole(email, demote ? 'customer' : 'admin');
