// scripts/probe.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pass = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => console.log(`  ❌ ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);
const head = (msg) => console.log(`\n=== ${msg} ===`);

async function probe() {
  // ── 1. DB TABLES ──────────────────────────────────────────────
  head('1. DATABASE TABLES');
  const tables = ['users', 'categories', 'products', 'reviews', 'promotions'];
  for (const t of tables) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    if (error) fail(`${t}: ${error.message}`);
    else pass(`${t}: OK (${count} rows)`);
  }

  // ── 2. PRODUCTS QUERY (what frontend calls) ───────────────────
  head('2. PRODUCTS FETCH (public API simulation)');
  const { data: products, error: pe } = await sb
    .from('products')
    .select('*, categories!products_category_id_fkey(id, name, slug, icon)')
    .neq('status', 'out_of_stock')
    .order('created_at', { ascending: false })
    .limit(20);
  if (pe) fail(`Products query: ${pe.message}`);
  else pass(`Products query: OK — ${products.length} products found`);

  if (products.length === 0) {
    fail('NO PRODUCTS IN DB — this is why frontend shows nothing. Run: npm run seed, then add products via admin.');
  }

  // ── 3. CATEGORIES QUERY ───────────────────────────────────────
  head('3. CATEGORIES FETCH');
  const { data: cats, error: ce } = await sb
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (ce) fail(`Categories query: ${ce.message}`);
  else pass(`Categories query: OK — ${cats.length} categories found`);

  if (cats.length === 0) {
    fail('NO CATEGORIES IN DB — run: npm run seed');
  }

  // ── 4. ADMIN USER CHECK ───────────────────────────────────────
  head('4. ADMIN USER');
  const { data: admin, error: ae } = await sb
    .from('users')
    .select('id, username, email, role, is_verified')
    .eq('role', 'admin')
    .limit(1)
    .single();
  if (ae) fail(`Admin user: ${ae.message} — run: npm run seed`);
  else pass(`Admin user: OK — ${admin.username} (${admin.email})`);

  // ── 5. CLOUDINARY CONNECTION ──────────────────────────────────
  head('5. CLOUDINARY CONNECTION');
  try {
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') pass(`Cloudinary: Connected (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`);
    else fail(`Cloudinary: Unexpected response — ${JSON.stringify(result)}`);
  } catch (err) {
    fail(`Cloudinary: ${err.message}`);
  }

  // ── 6. CLOUDINARY CONFIG CHECK ────────────────────────────────
  head('6. CLOUDINARY CONFIG');
  const vars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  for (const v of vars) {
    if (process.env[v]) pass(`${v}: set`);
    else fail(`${v}: MISSING in .env`);
  }

  // ── 7. PRODUCT MODEL JOIN CHECK ───────────────────────────────
  head('7. PRODUCT → CATEGORY JOIN');
  const { data: joinTest, error: je } = await sb
    .from('products')
    .select('id, name, categories!products_category_id_fkey(id, name, slug)')
    .limit(1);
  if (je) fail(`Join query: ${je.message}`);
  else if (joinTest.length === 0) info('No products to test join — add products first');
  else pass(`Join query: OK — category join works`);

  // ── 8. ENV VARS CHECK ─────────────────────────────────────────
  head('8. CRITICAL ENV VARS');
  const envVars = [
    'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET',
    'JWT_REFRESH_SECRET', 'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
    'FRONTEND_URL', 'ALLOWED_ORIGINS',
  ];
  for (const v of envVars) {
    if (process.env[v]) pass(`${v}: set`);
    else fail(`${v}: MISSING`);
  }

  // ── 9. PERFORMANCE: INDEX CHECK ───────────────────────────────
  head('9. PERFORMANCE — INDEX VERIFICATION');
  const { data: indexes, error: ie } = await sb.rpc('get_indexes').catch(() => ({ data: null, error: { message: 'RPC not available' } }));
  if (ie) {
    info('Index check via RPC not available — verifying via direct query speed test');
    const start = Date.now();
    await sb.from('products').select('id').eq('status', 'in_stock').eq('featured', true).limit(8);
    const ms = Date.now() - start;
    if (ms < 500) pass(`Featured products query: ${ms}ms (fast)`);
    else fail(`Featured products query: ${ms}ms (slow — indexes may be missing)`);
  }

  console.log('\n========================================');
  console.log('Probe complete. Fix all ❌ items above.');
  console.log('========================================\n');
  process.exit(0);
}

probe().catch(err => { console.error('Probe crashed:', err.message); process.exit(1); });
