/**
 * Supabase-klient — forbindelsen mellem vores frontend og databasen.
 *
 * Supabase er en "Backend as a Service" (BaaS): den giver os en PostgreSQL-database,
 * bruger-authentication og realtids-opdateringer uden at vi selv skal bygge en server.
 *
 * Vi opretter ÉN klient-instans her og genbruger den i hele appen.
 * Klienten bruger to miljøvariabler:
 *   - VITE_SUPABASE_URL: adressen til vores Supabase-projekt
 *   - VITE_SUPABASE_ANON_KEY: en offentlig nøgle der identificerer vores app
 *
 * Anon-nøglen er IKKE hemmelig — den er beregnet til at ligge i frontend-kode.
 * Sikkerheden kommer fra RLS (Row Level Security) i databasen, som bestemmer
 * hvad hver bruger må se og ændre baseret på deres login-session.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL og anon key mangler. Kopiér .env.example til .env og udfyld værdierne.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
