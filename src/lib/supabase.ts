import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL og anon key mangler. Kopiér .env.example til .env og udfyld værdierne.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
