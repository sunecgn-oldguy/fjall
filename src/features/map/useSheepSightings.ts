import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { SheepSighting } from "../../types/database";

/** Observation med display_name fra profiles-tabellen */
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

/**
 * Hook der håndterer fåre-observationer for en gruppe:
 * - Henter eksisterende aktive observationer
 * - Abonnerer på Realtime-ændringer
 * - Eksponerer addSighting() og resolveSighting()
 * - Filtrerer udløbne observationer automatisk
 */
export function useSheepSightings(
  groupId: string | null,
): UseSheepSightingsReturn {
  const [sightings, setSightings] = useState<SightingWithName[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Hent display_name fra profiles-tabel
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

  // Filtrer udløbne observationer (klient-side)
  const filterExpired = useCallback((list: SightingWithName[]) => {
    const now = new Date().toISOString();
    return list.filter((s) => s.status === "active" && s.expires_at > now);
  }, []);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    if (!groupId) {
      setSightings([]);
      return;
    }

    let cancelled = false;

    async function fetchExisting() {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("sheep_sightings")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "active")
        .gt("expires_at", now);

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

    // Realtime subscription
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

          // Fjern resolved/udløbne
          if (
            sighting.status === "resolved" ||
            sighting.expires_at < new Date().toISOString()
          ) {
            setSightings((prev) => prev.filter((s) => s.id !== sighting.id));
            return;
          }

          const displayName = await fetchDisplayName(sighting.user_id);

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

    // Periodisk oprydning af udløbne observationer (hvert 30. sekund)
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

  // Tilføj en ny observation
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

  // Markér en observation som resolved
  const resolveSighting = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("sheep_sightings")
      .update({ status: "resolved" })
      .eq("id", id);
    return !error;
  }, []);

  return { sightings, addSighting, resolveSighting };
}
