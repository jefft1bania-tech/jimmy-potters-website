// One-shot: create a Stripe Product + $75 Price for every entry in data/products.json,
// then write the new price IDs back into the JSON. Idempotency: products are matched by
// metadata.product_id == JSON id; if one exists we reuse it and just add a new $75 price.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import Stripe from 'stripe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const jsonPath = path.join(root, 'data', 'products.json');

// Load env (production pulled file takes precedence)
const envFile = fs.existsSync(path.join(root, '.env.production.local'))
  ? '.env.production.local'
  : '.env.local';
const envText = fs.readFileSync(path.join(root, envFile), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=("?)(.*?)\2\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[3].replace(/\\n$/, '');
}

const key = (process.env.STRIPE_SECRET_KEY || '').trim();
if (!key) { console.error('Missing STRIPE_SECRET_KEY'); process.exit(1); }
console.log(`Using Stripe key prefix: ${key.slice(0, 8)}...`);
const stripe = new Stripe(key);

const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log(`Loaded ${products.length} products from JSON.`);

const PRICE_CENTS = 7500;

for (const p of products) {
  // 1. Find or create Stripe Product matched by metadata.product_id
  let stripeProduct;
  const existing = await stripe.products.search({
    query: `metadata['product_id']:'${p.id}'`,
    limit: 1,
  });
  if (existing.data.length > 0) {
    stripeProduct = existing.data[0];
    if (stripeProduct.name !== p.name) {
      stripeProduct = await stripe.products.update(stripeProduct.id, { name: p.name });
    }
    console.log(`[reuse] ${p.id} -> ${stripeProduct.id}`);
  } else {
    stripeProduct = await stripe.products.create({
      name: p.name,
      metadata: { product_id: p.id, slug: p.slug },
    });
    console.log(`[create] ${p.id} -> ${stripeProduct.id}`);
  }

  // 2. Create new $75 price (Stripe prices are immutable — we make a fresh one)
  const price = await stripe.prices.create({
    product: stripeProduct.id,
    currency: 'usd',
    unit_amount: PRICE_CENTS,
    metadata: { product_id: p.id, sync_run: '2026-04-25-go-live-75' },
  });
  console.log(`  price: ${price.id} ($${PRICE_CENTS / 100})`);

  p.stripePriceId = price.id;
}

fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2) + '\n', 'utf8');
console.log(`\nWrote ${products.length} updated stripePriceId values to products.json`);
