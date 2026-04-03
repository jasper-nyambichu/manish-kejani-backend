// scripts/testDb.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const tables = ['users', 'categories', 'products', 'reviews', 'promotions'];

async function test() {
  console.log('\n=== Supabase Connection Test ===');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('================================\n');

  let allPassed = true;

  for (const table of tables) {
    const { error } = await sb.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ ${table}: FAIL — ${error.message}`);
      allPassed = false;
    } else {
      console.log(`✅ ${table}: OK`);
    }
  }

  console.log('\n================================');
  console.log(allPassed ? '✅ ALL TABLES OK — DB is connected and functional!' : '❌ Some tables failed — run the schema.sql in Supabase SQL Editor');
  console.log('================================\n');
  process.exit(allPassed ? 0 : 1);
}

test().catch(err => {
  console.log('CONNECTION ERROR:', err.message);
  process.exit(1);
});
