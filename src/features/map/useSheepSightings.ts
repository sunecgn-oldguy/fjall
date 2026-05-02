/**
 * useSheepSightings — hook der håndterer fåre-observationer for en gruppe.
 *
 * Fåre-observationer er midlertidige markeringer på kortet (udløber efter 2 timer)
 * der viser hvor nogen har set får. Alle gruppemedlemmer kan:
 * - Se aktive observationer på kortet
 * - Oprette nye observationer (med antal, retning og note)
 * - Markere en observation som "resolved" (håndteret)
 *
 * Hooken følger samme mønster som useGroupLocations:
 * 1. Hent eksisterende data fra databasen
 * 2. Abonnér på Realtime-ændringer
 * 3. Ryd op ved unmount
 *
 * Derudover kører en timer hvert 30. sekund der fjerner udløbne observationer
 * fra UI'et (databasen håndterer IKKE automatisk sletning — det er klient-side).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { SheepSighting } from "../../types/database";

/** Observation beriget med opretterens visningsnavn */
export interface SightingWithName extends SheepSighting {
  display_name: string;
}

interface UseSheepSightingsReturn {
  sightings: SightingWithName[];
  addSighting: (sighting: {
    group_id: string;
    user_id: string;
    latitude: number;
    longitude: number;
    count: number;
    direction: number | null;
    note: string;
  }) => Promise<boolean>;
  resolveSighting: (id: string) => Promise<boolean>;
}

export function useSheepSightings(
  groupId: string | null,
): UseSheepSightingsReturn {
  const [sightings, setSightings] = useState<SightingWithName[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /** Hent et brugers visningsnavn fra profiles-tabellen */
  const fetchDisplayName = useCallback(
    async (uid: string): Promise<string> => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", uid)
        .single();
      return data?.display_name ?? "Ókendur";
    },
    [],
  );

  /** Fjern observationer der er udløbet eller resolved fra et array */
  const filterExpired = useCallback((list: SightingWithName[]) => {
    const now = new Date().toISOString();
    return list.filter((s) => s.status === "active" && s.expires_at > now);
  }, []);

  // Hent eksisterende + abonnér på ændringer
  useEffect(() => {
    if (!groupId) {
      setSightings([]);
      return;
    }

    let cancelled = false;

    async function fetchExisting() {
      const now = new Date().toISOString();
      // Hent kun aktive observationer der ikke er udløbet
      const { data } = await supabase
        .from("sheep_sightings")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "active")
        .gt("expires_at", now);  // gt = "greater than" (udløber i fremtiden)

      if (cancelled || !data) return;

      const withNames = await Promise.all(
        data.map(async (s: SheepSighting) => ({
          ...s,
          display_name: await fetchDisplayName(s.user_id),
        })),
      );

      if (!cancelled) {
        setSightings(withNames);
      }
    }

    fetchExisting();

    // Realtime: lyt på ændringer i sheep_sightings for denne gruppe
    const channel = supabase
      .channel(`sightings:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sheep_sightings",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (cancelled) return;

          if (payload.eventType === "DELETE") {
            const old = payload.old as Partial<SheepSighting>;
            setSightings((prev) => prev.filter((s) => s.id !== old.id));
            return;
          }

          const sighting = payload.new as SheepSighting;

          // Fjern resolved/udløbne fra listen
          if (
            sighting.status === "resolved" ||
            sighting.expires_at < new Date().toISOString()
          ) {
            setSightings((prev) => prev.filter((s) => s.id !== sighting.id));
            return;
          }

          const displayName = await fetchDisplayName(sighting.user_id);

          // Opdatér eksisterende eller tilføj ny
          setSightings((prev) => {
            const idx = prev.findIndex((s) => s.id === sighting.id);
            const updated: SightingWithName = {
              ...sighting,
              display_name: displayName,
            };
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            }
            return [...prev, updated];
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    // Periodisk oprydning: fjern udløbne observationer fra UI hvert 30. sekund.
    // Databasen sletter dem IKKE automatisk — dette er en klient-side convenience.
    const cleanupInterval = setInterval(() => {
      setSightings((prev) => filterExpired(prev));
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(cleanupInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, fetchDisplayName, filterExpired]);

  /** Opret en ny fåre-observation i databasen. Returnerer true ved succes. */
  const addSighting = useCallback(
    async (sighting: {
      group_id: string;
      user_id: string;
      latitude: number;
      longitude: number;
      count: number;
      direction: number | null;
      note: string;
    }): Promise<boolean> => {
      const { error } = await supabase
        .from("sheep_sightings")
        .insert(sighting);
      return !error;
    },
    [],
  );

  /** Markér en observation som "resolved" (fårene er håndteret). */
  const resolveSighting = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("sheep_sightings")
      .update({ status: "resolved" })
      .eq("id", id);
    return !error;
  }, []);

  return { sightings, addSighting, resolveSighting };
}
