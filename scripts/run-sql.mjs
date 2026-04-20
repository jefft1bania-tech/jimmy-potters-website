// One-off SQL runner against Supabase via the session pooler (IPv4-compatible).
// Usage: SUPABASE_DB_URL=... node scripts/run-sql.mjs <file.sql>
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const url = process.env.SUPABASE_DB_URL;
const file = process.argv[2];

if (!url || !file) {
  console.error('Usage: SUPABASE_DB_URL=... node scripts/run-sql.mjs <file.sql>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(file), 'utf-8');

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log(`Connected. Running ${file} (${sql.length} bytes)...`);

try {
  await client.query(sql);
  console.log('OK — migration applied.');
} catch (err) {
  console.error('FAILED:', err.message);
  if (err.position) console.error(`At byte ${err.position}`);
  process.exit(2);
} finally {
  await client.end();
}
