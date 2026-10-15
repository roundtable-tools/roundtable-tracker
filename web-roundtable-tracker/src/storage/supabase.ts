import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Not imported yet: kept for the planned live player view (#70).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;
