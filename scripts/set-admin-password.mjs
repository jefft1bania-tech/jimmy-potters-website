// Set or reset a Supabase Auth user's password using the service-role admin API.
//
// Usage:
//   node scripts/set-admin-password.mjs <email>             # generate a strong random password
//   node scripts/set-admin-password.mjs <email> <password>  # use the supplied password
//
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from one of:
//   process.env (preferred)         e.g. via `vercel env pull` to a temp file you source
//   ./.env.local                    fallback for local dev
//   ./.env.tmp (if it exists)       picked up first so a temp `vercel env pull` wins
//
// Pairs with promote-admin.mjs which handles role; this only touches password.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile(file) {
  const p = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(p)) return false;
  for (const line of fs.readFileSync(p, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k]) continue;
    let v = raw.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (v.length > 0) process.env[k] = v;
  }
  return true;
}

// .env.tmp first so a `vercel env pull .env.tmp` wins over a blanked .env.local
loadEnvFile('.env.tmp');
loadEnvFile('.env.local');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Local .env.local has the key blanked by design — pull it from Vercel:');
  console.error('  vercel env pull --environment=production .env.tmp --yes');
  console.error('then re-run this script and delete .env.tmp afterward.');
  process.exit(1);
}

const args = process.argv.slice(2);
const email = args[0];
const suppliedPassword = args[1];

if (!email || email.startsWith('--')) {
  console.error('Usage:');
  console.error('  node scripts/set-admin-password.mjs <email>');
  console.error('  node scripts/set-admin-password.mjs <email> <password>');
  process.exit(1);
}

function generatePassword(length = 24) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

const password = suppliedPassword ?? generatePassword(20);

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findAuthUserByEmail(target) {
  const lower = target.toLowerCase();
  let page = 1;
  // listUsers caps perPage at 1000 — the JP user base is tiny so one page is plenty,
  // but loop defensively in case it grows.
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error('listUsers failed:', error.message);
      process.exit(2);
    }
    const hit = data.users.find((u) => (u.email ?? '').toLowerCase() === lower);
    if (hit) return hit;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

let authUser = await findAuthUserByEmail(email);
let created = false;
if (!authUser) {
  // Create the auth user. handle_new_user() trigger from migration 0006 will
  // auto-insert a profiles row with role='admin' for Jeff's whitelisted emails.
  const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Jeff Bania' },
  });
  if (createErr) {
    console.error('Auth user create failed:', createErr.message);
    process.exit(2);
  }
  authUser = createData.user;
  created = true;
} else {
  const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, {
    password,
    email_confirm: true,
  });
  if (updateErr) {
    console.error('Password update failed:', updateErr.message);
    process.exit(2);
  }
}

// Belt-and-suspenders: if the email is in the admin whitelist, ensure the
// profiles row has role='admin' even if migration 0006's handle_new_user()
// trigger isn't applied to this DB yet.
const ADMIN_WHITELIST = new Set(['jeff.t1.bania@gmail.com', 'jeffbania@gmail.com']);
let profile = null;
{
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', authUser.id)
    .maybeSingle();
  if (error) {
    console.error('Profile lookup failed:', error.message);
  }
  profile = data;
}

if (ADMIN_WHITELIST.has(email.toLowerCase()) && profile && profile.role !== 'admin') {
  const { error: roleErr } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', authUser.id);
  if (roleErr) {
    console.error('Role promotion failed:', roleErr.message);
  } else {
    profile = { ...profile, role: 'admin' };
  }
}

console.log('');
console.log(`  ${created ? 'Auth user CREATED for:' : 'Password updated for: '}`, email);
console.log('  Auth user id:        ', authUser.id);
console.log('  Profile role:        ', profile?.role ?? '(no profile row — sign in once to seed)');
console.log('  New password:        ', password);
console.log('');
console.log('  Sign in at https://www.jimmypotters.com/login');
console.log('  Then visit /admin/wholesale to review applications.');
console.log('');
