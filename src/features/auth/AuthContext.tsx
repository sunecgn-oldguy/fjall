/**
 * AuthContext — global authentication-tilstand for hele appen.
 *
 * React Context er en måde at dele data på tværs af komponenter uden at
 * sende props ned gennem hvert niveau (kaldet "prop drilling").
 *
 * Denne fil gør tre ting:
 * 1. Opretter en Context der holder den aktuelle bruger
 * 2. Eksporterer AuthProvider som wrapper hele appen (se main.tsx)
 * 3. Eksporterer useAuth() som en hook enhver komponent kan kalde
 *
 * Login-metoder:
 * - quickStart(navn): Anonym login — opretter bruger UDEN email/password (nyt flow)
 * - signIn(email, password): Klassisk email-login (for eksisterende brugere)
 * - signUp(email, password, navn): Opret konto med email (bevaret for fremtidig brug)
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

/** Beskriver hvad AuthContext indeholder — TypeScript sikrer at alle felter er med */
interface AuthState {
  user: User | null;           // null = ikke logget ind
  loading: boolean;            // true mens vi tjekker om brugeren allerede er logget ind
  quickStart: (displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * AuthProvider — skal wrappe hele appen så alle komponenter har adgang til auth-tilstand.
 * Bruges i main.tsx: <AuthProvider><App /></AuthProvider>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ved app-start: tjek om brugeren allerede har en gyldig session
    // (Supabase gemmer session i localStorage, så den overlever browser-luk)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Lyt efter ændringer i login-tilstand (login, logout, token-refresh)
    // Dette sikrer at UI altid afspejler den rigtige tilstand
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup: stop med at lytte når komponenten unmountes
    return () => subscription.unsubscribe();
  }, []);

  /**
   * quickStart — det nye, simple login-flow.
   * Bruger Supabase "Anonymous Auth" som opretter en rigtig bruger med et
   * unikt auth.uid(), men UDEN at kræve email eller password.
   * RLS (databasesikkerhed) virker stadig fordi brugeren har et gyldigt ID.
   */
  async function quickStart(displayName: string) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return { error: error.message };
    if (!data.user) return { error: "Ongin brúkari varð stovnaður." };

    // Database-triggeren (handle_new_user) opretter automatisk en profilrække
    // med navnet "Brúkari". Her overskriver vi med det rigtige navn.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", data.user.id);

    if (profileError) return { error: profileError.message };
    return { error: null };
  }

  /** Klassisk email/password login — for brugere der allerede har en konto */
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  /** Opret ny konto med email — bevaret for fremtidig brug */
  async function signUp(
    email: string,
    password: string,
    displayName: string,
  ) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { error: error?.message ?? null };
  }

  /** Log ud og slet session fra localStorage */
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, quickStart, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — hook som komponenter bruger til at tilgå login-tilstand.
 *
 * Eksempel:
 *   const { user, signOut } = useAuth();
 *   if (user) { ... brugeren er logget ind ... }
 *
 * Kaster en fejl hvis den bruges udenfor AuthProvider (det er en programmeringsfejl).
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth skal bruges inden i en AuthProvider");
  }
  return context;
}
