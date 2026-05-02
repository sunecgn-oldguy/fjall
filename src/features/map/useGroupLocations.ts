/**
 * useGroupLocations — hook der håndterer live positionsdeling i en gruppe.
 *
 * Denne hook er kernen i appens samarbejdsfunktion. Den gør tre ting:
 *
 * 1. SENDER brugerens egen GPS-position til Supabase (throttled til hvert 5. sekund
 *    for at spare batteri og database-kald)
 *
 * 2. MODTAGER andre gruppemedlemmers positioner via to mekanismer:
 *    - Supabase Realtime: en WebSocket-forbindelse der pusher ændringer i realtid
 *    - Polling hvert 30 sek: backup hvis Realtime-forbindelsen fejler
 *
 * 3. RYDDER OP ved unmount: sletter egen position fra databasen og afmelder kanalen
 *
 * "Throttling" betyder at begrænse hvor ofte en handling udføres.
 * GPS'en opdaterer muligvis hvert sekund, men vi sender kun til databasen
 * hvert 5. sekund for at undgå unødvendige netværkskald.
 *
 * "Stale" positioner (ældre end 5 minutter) filtreres automatisk væk,
 * da brugeren formentlig har lukket appen.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { GeoPosition } from "./useGeolocation";
import type { Location } from "../../types/database";

/** Minimum tid mellem database-opdateringer (millisekunder) */
const THROTTLE_MS = 5_000;

/** Positioner ældre end dette betragtes som forældede */
const STALE_MS = 5 * 60 * 1_000; // 5 minutter

/** Location beriget med brugerens visningsnavn */
interface MemberLocation extends Location {
  display_name: string;
}

interface UseGroupLocationsReturn {
  members: MemberLocation[];  // Andre gruppemedlemmers positioner
  onlineCount: number;        // Antal online medlemmer
}

export function useGroupLocations(
  groupId: string | null,
  userId: string | null,
  position: GeoPosition | null,
): UseGroupLocationsReturn {
  const [members, setMembers] = useState<MemberLocation[]>([]);
  const lastSentRef = useRef(0);  // Tidsstempel for sidste database-opdatering
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

  // === EFFEKT 1: Send egen position til databasen (throttled) ===
  useEffect(() => {
    if (!groupId || !userId || !position) return;

    // Throttle: spring over hvis det er mindre end 5 sek siden sidst
    const now = Date.now();
    if (now - lastSentRef.current < THROTTLE_MS) return;
    lastSentRef.current = now;

    // "upsert" = INSERT hvis rækken ikke findes, UPDATE hvis den gør.
    // Da PK er (user_id, group_id), overskriver dette altid den gamle position.
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

  // === EFFEKT 2: Hent andres positioner + lyt på ændringer ===
  useEffect(() => {
    if (!groupId || !userId) {
      setMembers([]);
      return;
    }

    // "cancelled" flag forhindrer at vi opdaterer state efter cleanup.
    // Uden dette kan der ske "state update on unmounted component" advarsler.
    let cancelled = false;

    /** Hent alle aktuelle positioner for gruppen fra databasen */
    async function fetchExisting() {
      const { data } = await supabase
        .from("locations")
        .select("*")
        .eq("group_id", groupId);

      if (cancelled || !data) return;

      // Filtrer stale positioner og egen position
      const staleThreshold = new Date(Date.now() - STALE_MS).toISOString();
      const fresh = data.filter(
        (loc: Location) =>
          loc.user_id !== userId && loc.updated_at > staleThreshold,
      );

      // Berig med visningsnavne (kræver ét ekstra opslag per bruger)
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

    // Polling-fallback: hent positioner hvert 30. sekund.
    // Supabase Realtime er normalt nok, men i ustabilt netværk kan
    // WebSocket-forbindelsen droppe — polling sikrer at data stadig opdateres.
    const pollInterval = setInterval(fetchExisting, 30_000);

    // Supabase Realtime subscription: lyt på ændringer i locations-tabellen.
    // "postgres_changes" er en Supabase-feature der sender database-ændringer
    // direkte til klienten via WebSocket, så vi slipper for at polle.
    const channel = supabase
      .channel(`locations:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",  // Lyt på alle events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "locations",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (cancelled) return;

          // Hvis nogen forlod gruppen, fjern dem fra listen
          if (payload.eventType === "DELETE") {
            const old = payload.old as Partial<Location>;
            setMembers((prev) =>
              prev.filter((m) => m.user_id !== old.user_id),
            );
            return;
          }

          const loc = payload.new as Location;

          // Ignorer egen position og stale data
          if (loc.user_id === userId) return;
          const staleThreshold = new Date(
            Date.now() - STALE_MS,
          ).toISOString();
          if (loc.updated_at < staleThreshold) return;

          const displayName = await fetchDisplayName(loc.user_id);

          // Opdatér eller tilføj medlemmet i listen
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

    // Cleanup ved unmount eller gruppeskift
    return () => {
      cancelled = true;
      clearInterval(pollInterval);

      // Afmeld Realtime-kanalen
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Slet egen position fra databasen — signalerer at brugeren er offline
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
