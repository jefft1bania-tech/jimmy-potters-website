// Flip a product's status in data/products.json — fast alternative to hand-editing JSON.
//
// Usage:
//   node scripts/set-product-status.mjs --list
//   node scripts/set-product-status.mjs --slot 11 --status available
//   node scripts/set-product-status.mjs --slug hurricane-planter --status sold
//   node scripts/set-product-status.mjs --id hurricane-planter-jimmy-011 --status reserved
//
// Status must be one of: available | sold | reserved | pending-review
//
// After running, commit data/products.json + push + deploy:
//   git add data/products.json && git commit -m "..." && git push && vercel --prod --yes

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '..', 'data', 'products.json');
const VALID_STATUSES = ['available', 'sold', 'reserved', 'pending-review'];

function usage(code = 1) {
  console.error('Usage:');
  console.error('  node scripts/set-product-status.mjs --list');
  console.error('  node scripts/set-product-status.mjs --slot <N>  --status <status>');
  console.error('  node scripts/set-product-status.mjs --slug <s>  --status <status>');
  console.error('  node scripts/set-product-status.mjs --id <id>   --status <status>');
  console.error(`\nValid statuses: ${VALID_STATUSES.join(' | ')}`);
  process.exit(code);
}

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    if (key === 'list') { out.list = true; continue; }
    out[key] = argv[i + 1];
    i += 1;
  }
  return out;
}

const flags = parseFlags(process.argv.slice(2));

const raw = fs.readFileSync(DATA_PATH, 'utf-8');
const products = JSON.parse(raw);

if (flags.list) {
  const w = String(Math.max(...products.map((p) => (p.name ?? '').length))).length + 8;
  console.log('');
  console.log('  #  Status            Slug                      Name');
  console.log('  -  ----------------  ------------------------  --------------------------------');
  for (const p of products.sort((a, b) => (a.productNumber ?? 999) - (b.productNumber ?? 999))) {
    const num = String(p.productNumber ?? '?').padStart(2);
    const status = String(p.status ?? '').padEnd(16);
    const slug = String(p.slug ?? '').padEnd(24);
    console.log(`  ${num}  ${status}  ${slug}  ${p.name ?? ''}`);
  }
  console.log('');
  process.exit(0);
}

const status = flags.status;
if (!status || !VALID_STATUSES.includes(status)) {
  console.error(`Invalid or missing --status. Got: ${status}`);
  usage();
}

let target;
let matchKind;
if (flags.slot !== undefined) {
  const n = Number(flags.slot);
  target = products.find((p) => p.productNumber === n);
  matchKind = `productNumber=${n}`;
} else if (flags.slug) {
  target = products.find((p) => p.slug === flags.slug);
  matchKind = `slug=${flags.slug}`;
} else if (flags.id) {
  target = products.find((p) => p.id === flags.id);
  matchKind = `id=${flags.id}`;
} else {
  console.error('Specify exactly one of --slot, --slug, or --id.');
  usage();
}

if (!target) {
  console.error(`No product found matching ${matchKind}`);
  process.exit(3);
}

const prev = target.status;
if (prev === status) {
  console.log(`No change — ${target.name} (slot ${target.productNumber}) is already '${status}'`);
  process.exit(0);
}

target.status = status;

// Pretty-print to match existing formatting style (2-space indent, trailing newline).
fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2) + '\n', 'utf-8');

console.log('');
console.log(`  ${target.name} (slot ${target.productNumber}, slug ${target.slug})`);
console.log(`  status: ${prev} -> ${status}`);
console.log('');
console.log('  data/products.json updated. To ship:');
console.log('    git add data/products.json');
console.log(`    git commit -m "Product slot ${target.productNumber}: status ${prev} -> ${status}"`);
console.log('    git push origin main');
console.log('    vercel --prod --yes');
console.log('');
