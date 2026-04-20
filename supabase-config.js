import { createClient } from '@supabase/supabase-js';

// Import environment variables. These will be automatically swapped by Vite/Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
