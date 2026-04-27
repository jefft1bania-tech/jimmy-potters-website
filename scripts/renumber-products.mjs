// One-shot renumber: contiguous productNumber, available SKUs first (1..N), then pending-review (N+1..M).
//
// Usage: node scripts/renumber-products.mjs
//
// Convention:
//   - productNumber reflects insertion order, contiguous, no gaps.
//   - Available SKUs come first (1..N), then pending-review (N+1..M).
//   - Within each status group, preserve current relative order (sorted by existing productNumber asc).
//   - id and slug are NEVER touched (URL-stable).
//
// Run once when status groups change in bulk; routine adds should use scripts/add-product.mjs which
// auto-assigns the next contiguous productNumber.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '..', 'data', 'products.json');

const raw = fs.readFileSync(DATA_PATH, 'utf-8');
const products = JSON.parse(raw);

// Sort within each status group by current productNumber (preserves existing relative order).
const byNum = (a, b) => (a.productNumber ?? 9999) - (b.productNumber ?? 9999);
const available = products.filter((p) => p.status !== 'pending-review').sort(byNum);
const pending = products.filter((p) => p.status === 'pending-review').sort(byNum);

let n = 1;
const renumbered = [];
for (const p of available) {
  renumbered.push({ ...p, productNumber: n });
  n += 1;
}
for (const p of pending) {
  renumbered.push({ ...p, productNumber: n });
  n += 1;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(renumbered, null, 2) + '\n', 'utf-8');

console.log('');
console.log('  Renumbered:');
console.log('  #   Status            Slug                                          Name');
console.log('  --  ----------------  --------------------------------------------  --------------------------------');
for (const p of renumbered) {
  const num = String(p.productNumber).padStart(2);
  const status = String(p.status ?? '').padEnd(16);
  const slug = String(p.slug ?? '').padEnd(44);
  console.log(`  ${num}  ${status}  ${slug}  ${p.name ?? ''}`);
}
console.log('');
console.log(`  ${available.length} available + ${pending.length} pending-review = ${renumbered.length} total`);
console.log('');
