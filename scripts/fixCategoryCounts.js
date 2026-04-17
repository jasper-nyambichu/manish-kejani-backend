// scripts/fixCategoryCounts.js
// Run once: node scripts/fixCategoryCounts.js
import 'dotenv/config';
import supabase from '../src/config/db.js';

const fix = async () => {
  console.log('Recalculating category product counts...');

  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, name');

  if (catErr) { console.error(catErr.message); process.exit(1); }

  for (const cat of categories) {
    const { count, error: cntErr } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', cat.id)
      .neq('status', 'out_of_stock');

    if (cntErr) { console.warn(`  ✗ ${cat.name}: ${cntErr.message}`); continue; }

    const { error: updErr } = await supabase
      .from('categories')
      .update({ product_count: count ?? 0 })
      .eq('id', cat.id);

    if (updErr) { console.warn(`  ✗ ${cat.name}: ${updErr.message}`); continue; }

    console.log(`  ✓ ${cat.name}: ${count} products`);
  }

  console.log('Done.');
  process.exit(0);
};

fix();
