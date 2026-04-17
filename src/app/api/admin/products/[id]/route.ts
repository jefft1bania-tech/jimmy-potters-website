import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRODUCTS_PATH = path.join(process.cwd(), 'data', 'products.json');

interface PatchBody {
  price?: number; // dollars
  status?: 'available' | 'sold' | 'reserved' | 'pending-review';
  name?: string;
  description?: string;
}

function isLocalDev(req: NextRequest) {
  // Admin routes only work on localhost. Vercel filesystem is read-only
  // anyway, but this is an explicit guard so the endpoint can't be hit in
  // production even if someone finds the URL.
  const host = req.headers.get('host') || '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isLocalDev(req)) {
    return NextResponse.json({ error: 'Admin API is local-only' }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const raw = await fs.readFile(PRODUCTS_PATH, 'utf-8');
  const products = JSON.parse(raw) as Array<Record<string, unknown>>;

  const idx = products.findIndex((p) => p.id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  if (typeof body.price === 'number' && body.price >= 0) {
    products[idx].price = Math.round(body.price * 100);
  }
  if (body.status) {
    products[idx].status = body.status;
  }
  if (typeof body.name === 'string' && body.name.trim()) {
    products[idx].name = body.name.trim();
  }
  if (typeof body.description === 'string') {
    products[idx].description = body.description;
  }

  await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2) + '\n', 'utf-8');

  return NextResponse.json({ ok: true, product: products[idx] });
}
