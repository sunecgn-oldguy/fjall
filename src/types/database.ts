/**
 * TypeScript-typer for alle tabeller i Supabase-databasen.
 *
 * Disse interfaces afspejler præcist kolonnerne i vores PostgreSQL-tabeller.
 * Ved at definere typerne her, får vi autokomplettering og fejlbeskeder
 * i editoren hvis vi prøver at bruge et felt der ikke findes.
 *
 * Eksempel: Hvis man skriver `group.naem` i stedet for `group.name`,
 * fanger TypeScript fejlen INDEN koden kører.
 */

/** Brugerprofil — udvider Supabase auth.users med et visningsnavn.
 *  Oprettes automatisk af en database-trigger når en ny bruger registrerer sig. */
export interface Profile {
  id: string;            // Samme UUID som i auth.users
  display_name: string;  // Navnet brugeren ser i appen
  created_at: string;    // ISO-tidsstempel for oprettelse
}

/** En gruppe (seyðadriv-hold) som brugere kan joine */
export interface Group {
  id: string;           // Unik UUID genereret af databasen
  name: string;         // Gruppens navn, f.eks. "Seyðadriv Vestmanna"
  join_code: string;    // 6-cifret kode til at dele mundtligt (bruges ikke i UI længere)
  created_by: string;   // UUID på brugeren der oprettede gruppen
  created_at: string;
}

/** Medlemskab — forbinder en bruger med en gruppe (mange-til-mange relation) */
export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "admin" | "member";  // Admin = opretteren, member = alle andre
  joined_at: string;
}

/** Live GPS-position for en bruger i en gruppe.
 *  Composite primary key (user_id, group_id) sikrer at hver bruger
 *  kun har ÉN aktiv position per gruppe — nye positioner overskriver den gamle. */
export interface Location {
  user_id: string;
  group_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;   // GPS-nøjagtighed i meter (lavere = bedre)
  heading: number | null;    // Retning i grader (0 = nord, 90 = øst)
  speed: number | null;      // Hastighed i meter/sekund
  updated_at: string;
}

/** Fåre-observation — markerer hvor får er set på kortet.
 *  Udløber automatisk efter 2 timer (expires_at) da fårene flytter sig. */
export interface SheepSighting {
  id: string;
  group_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  count: number;              // Antal observerede får
  direction: number | null;   // Kompasretning fårene bevæger sig (0-359 grader)
  note: string;               // Frivillig note, f.eks. "ved åen"
  status: "active" | "resolved";  // "resolved" = nogen har håndteret observationen
  created_at: string;
  expires_at: string;         // Tidspunkt hvor observationen automatisk forsvinder
}

/** Ordre/ávísing — "gå hertil"-kommando sendt til et gruppemedlem.
 *  Har en livscyklus: pending → accepted → completed (eller cancelled). */
export interface Order {
  id: string;
  group_id: string;
  created_by: string;          // Hvem der oprettede ordren
  assigned_to: string | null;  // Hvem ordren er tildelt (null = alle i gruppen)
  latitude: number;
  longitude: number;
  message: string;             // F.eks. "Gå til nordsiden af fjeldet"
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
}

/** Chatbesked i en gruppe — simple tekstbeskeder mellem gruppemedlemmer */
export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

/** En seyðadriv-tur startet af én bruger i én gruppe.
 *  ended_at er null mens turen er aktiv — sættes når turen afsluttes. */
export interface Trip {
  id: string;
  group_id: string;
  started_by: string;
  started_at: string;
  ended_at: string | null;
  name: string;
}

/** GPS-position optaget under en tur.
 *  Alle gruppemedlemmer kan se hinandens rutepunkter. */
export interface RoutePoint {
  id: string;
  trip_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}
