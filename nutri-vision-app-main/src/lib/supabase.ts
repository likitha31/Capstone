
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Using hardcoded values instead of environment variables
const SUPABASE_URL = "https://ebbathihrmqstboibxzw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYmF0aGlocm1xc3Rib2lieHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NzI0OTQsImV4cCI6MjA2MDI0ODQ5NH0.NI_h7DaIU_3oC5n-e1domvAk33AQmOgugP9cwnXTo4Y";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage
    }
  }
);
