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
