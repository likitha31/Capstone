// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ebbathihrmqstboibxzw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYmF0aGlocm1xc3Rib2lieHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NzI0OTQsImV4cCI6MjA2MDI0ODQ5NH0.NI_h7DaIU_3oC5n-e1domvAk33AQmOgugP9cwnXTo4Y";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);