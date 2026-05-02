import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { GeoPosition } from "./useGeolocation";
import type { Location } from "../../types/database";

/** Hvor ofte vi sender position til databasen (ms) */
const THROTTLE_MS = 5_000;

/** Positioner ældre end dette betragtes som "stale" og filtreres væk */
const STALE_MS = 5 * 60 * 1_000;

interface MemberLocation extends Location {
  display_name: string;
}

interface UseGroupLocationsReturn {
  members: MemberLocation[];
  onlineCount: number;
}

/**
 * Hook der håndterer live positionsdeling i en gruppe:
 * - Sender brugerens position til Supabase (throttled upsert)
 * - Abonnerer på Realtime-ændringer fra andre gruppemedlemmer
 * - Filtrerer stale positioner (ældre end 5 min)
 * - Rydder op ved unmount (sletter egen position, afmelder kanal)
 */
export function useGroupLocations(
  groupId: string | null,
  userId: string | null,
  position: GeoPosition | null,
): UseGroupLocationsReturn {
  const [members, setMembers] = useState<MemberLocation[]>([]);
  const lastSentRef = useRef(0);
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

  // Send brugerens position til databasen (throttled)
  useEffect(() => {
    if (!groupId || !userId || !position) return;

    const now = Date.now();
    if (now - lastSentRef.current < THROTTLE_MS) return;
    lastSentRef.current = now;

    supabase
      .from("locations")
      .upsert({
        user_id: userId,
        group_id: groupId,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        heading: position.heading,
        speed: position.speed,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error("Location upsert fejl:", error.message);
      });
  }, [groupId, userId, position]);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    if (!groupId || !userId) {
      setMembers([]);
      return;
    }

    let cancelled = false;

    // Hent eksisterende positioner for gruppen
    async function fetchExisting() {
      const { data } = await supabase
        .from("locations")
        .select("*")
        .eq("group_id", groupId);

      if (cancelled || !data) return;

      const staleThreshold = new Date(Date.now() - STALE_MS).toISOString();
      const fresh = data.filter(
        (loc: Location) =>
          loc.user_id !== userId && loc.updated_at > staleThreshold,
      );

      // Hent display_names for alle medlemmer
      const withNames = await Promise.all(
        fresh.map(async (loc: Location) => ({
          ...loc,
          display_name: await fetchDisplayName(loc.user_id),
        })),
      );

      if (!cancelled) {
        setMembers(withNames);
      }
    }

    fetchExisting();

    // Polling-fallback: hent positioner hvert 30 sek
    // Sikrer opdatering selvom Realtime-subscription fejler
    const pollInterval = setInterval(fetchExisting, 30_000);

    // Realtime subscription
    const channel = supabase
      .channel(`locations:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "locations",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (cancelled) return;

          if (payload.eventType === "DELETE") {
            const old = payload.old as Partial<Location>;
            setMembers((prev) =>
              prev.filter((m) => m.user_id !== old.user_id),
            );
            return;
          }

          const loc = payload.new as Location;

          // Ignorer egen position
          if (loc.user_id === userId) return;

          // Ignorer stale
          const staleThreshold = new Date(
            Date.now() - STALE_MS,
          ).toISOString();
          if (loc.updated_at < staleThreshold) return;

          const displayName = await fetchDisplayName(loc.user_id);

          setMembers((prev) => {
            const existing = prev.findIndex(
              (m) => m.user_id === loc.user_id,
            );
            const updated: MemberLocation = {
              ...loc,
              display_name: displayName,
            };
            if (existing >= 0) {
              const next = [...prev];
              next[existing] = updated;
              return next;
            }
            return [...prev, updated];
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      clearInterval(pollInterval);

      // Afmeld Realtime-kanal
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Slet egen position fra databasen
      supabase
        .from("locations")
        .delete()
        .eq("user_id", userId)
        .eq("group_id", groupId!)
        .then();
    };
  }, [groupId, userId, fetchDisplayName]);

  return {
    members,
    onlineCount: members.length,
  };
}
