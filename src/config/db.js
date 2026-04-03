// src/config/db.js
import { createClient } from '@supabase/supabase-js';
import { logger } from '../shared/utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    db:   { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { 'x-application-name': 'manish-kejani-backend' },
      fetch: (url, options = {}) => fetch(url, { ...options, keepalive: true }),
    },
  }
);

export const connectDB = async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw new Error(error.message);
    logger.info('PostgreSQL (Supabase) connected successfully');
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
};

export default supabase;
