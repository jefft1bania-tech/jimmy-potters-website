// Append a product to data/products.json with auto-assigned productNumber = max(existing) + 1.
//
// Usage:
//   node scripts/add-product.mjs --file path/to/new-product.json
//   cat new-product.json | node scripts/add-product.mjs --stdin
//
// The input JSON must NOT include productNumber — this script assigns it. If the input includes
// productNumber, it is overwritten (with a warning) to keep the catalog gap-free. id, slug, and
// all other fields pass through untouched.
//
// After running, commit + push + deploy:
//   git add data/products.json && git commit -m "..." && git push && vercel --prod --yes

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '..', 'data', 'products.json');

function usage(code = 1) {
  console.error('Usage:');
  console.error('  node scripts/add-product.mjs --file <path-to-product.json>');
  console.error('  node scripts/add-product.mjs --stdin   (reads JSON from stdin)');
  process.exit(code);
}

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    if (key === 'stdin') { out.stdin = true; continue; }
    out[key] = argv[i + 1];
    i += 1;
  }
  return out;
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let buf = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { buf += chunk; });
    process.stdin.on('end', () => resolve(buf));
    process.stdin.on('error', reject);
  });
}

const flags = parseFlags(process.argv.slice(2));

let inputRaw;
if (flags.file) {
  inputRaw = fs.readFileSync(path.resolve(flags.file), 'utf-8');
} else if (flags.stdin) {
  inputRaw = await readStdin();
} else {
  usage();
}

let incoming;
try {
  incoming = JSON.parse(inputRaw);
} catch (e) {
  console.error(`Invalid JSON: ${e.message}`);
  process.exit(2);
}

if (Array.isArray(incoming)) {
  console.error('Input must be a single product object, not an array. Run once per product.');
  process.exit(2);
}

if (!incoming.id || !incoming.slug || !incoming.name) {
  console.error('Input must include at least: id, slug, name.');
  process.exit(2);
}

const products = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

if (products.some((p) => p.id === incoming.id)) {
  console.error(`Duplicate id: ${incoming.id} already exists in catalog. Aborting.`);
  process.exit(3);
}
if (products.some((p) => p.slug === incoming.slug)) {
  console.error(`Duplicate slug: ${incoming.slug} already exists in catalog. Aborting.`);
  process.exit(3);
}

const maxNum = products.reduce((m, p) => Math.max(m, p.productNumber ?? 0), 0);
const nextNum = maxNum + 1;

if (incoming.productNumber !== undefined && incoming.productNumber !== nextNum) {
  console.warn(
    `WARN: incoming productNumber=${incoming.productNumber} ignored. Auto-assigning ${nextNum} to keep catalog contiguous.`
  );
}

const final = { ...incoming, productNumber: nextNum };
products.push(final);

fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2) + '\n', 'utf-8');

console.log('');
console.log(`  Appended: ${final.name}`);
console.log(`  id:            ${final.id}`);
console.log(`  slug:          ${final.slug}`);
console.log(`  productNumber: ${final.productNumber}  (auto-assigned)`);
console.log(`  status:        ${final.status ?? '(unset)'}`);
console.log('');
console.log('  data/products.json updated. To ship:');
console.log('    git add data/products.json');
console.log(`    git commit -m "Add product #${final.productNumber} ${final.slug}"`);
console.log('    git push origin main');
console.log('    vercel --prod --yes');
console.log('');
