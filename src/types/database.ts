/** Brugerprofil — udvider Supabase auth.users med display_name */
export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

/** En gruppe (seyðadriv-hold) */
export interface Group {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  created_at: string;
}

/** Medlemskab i en gruppe */
export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
}

/** Live GPS-position for en bruger i en gruppe */
export interface Location {
  user_id: string;
  group_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  updated_at: string;
}

/** Fåre-observation — markerer hvor får er set */
export interface SheepSighting {
  id: string;
  group_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  count: number;
  direction: number | null;
  note: string;
  status: "active" | "resolved";
  created_at: string;
  expires_at: string;
}

/** Ordre/ávísing — "gå hertil"-kommando til gruppemedlem */
export interface Order {
  id: string;
  group_id: string;
  created_by: string;
  assigned_to: string | null;
  latitude: number;
  longitude: number;
  message: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
}

/** Chatbesked i en gruppe */
export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  text: string;
  created_at: string;
}
