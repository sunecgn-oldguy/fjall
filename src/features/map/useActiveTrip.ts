/**
 * useActiveTrip — hook der håndterer den aktive tur i en gruppe.
 *
 * En "tur" (trip) repræsenterer en seyðadriv-session — den startes af ét
 * gruppemedlem og deles med hele gruppen. Mens turen er aktiv, optager
 * alle deltagere deres GPS-ruter.
 *
 * Hooken bruger Supabase Realtime til at lytte på trips-tabellen, så alle
 * gruppemedlemmer ser tur-status i realtid (start/stop).
 *
 * Returnerer:
 * - activeTrip: den aktive tur (ended_at IS NULL), eller null
 * - startTrip(name): start en ny tur med valgfrit navn
 * - endTrip(): afslut den aktive tur (kun den der startede kan afslutte)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Trip } from "../../types/database";

interface UseActiveTripReturn {
  activeTrip: Trip | null;
  startTrip: (name: string) => Promise<boolean>;
  endTrip: () => Promise<boolean>;
}

export function useActiveTrip(
  groupId: string | null,
  userId: string | null,
): UseActiveTripReturn {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Hent den aktive tur + lyt på ændringer via Realtime
  useEffect(() => {
    if (!groupId || !userId) {
      setActiveTrip(null);
      return;
    }

    let cancelled = false;

    /** Hent den aktive tur (ended_at IS NULL) for gruppen */
    async function fetchActiveTrip() {
      const { data } = await supabase
        .from("trips")
        .select("*")
        .eq("group_id", groupId)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1);

      if (!cancelled) {
        setActiveTrip(data && data.length > 0 ? (data[0] as Trip) : null);
      }
    }

    fetchActiveTrip();

    // Realtime subscription: lyt på INSERT, UPDATE og DELETE på trips
    const channel = supabase
      .channel(`trips:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trips",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (cancelled) return;

          if (payload.eventType === "DELETE") {
            setActiveTrip((prev) => {
              const old = payload.old as Partial<Trip>;
              return prev?.id === old.id ? null : prev;
            });
            return;
          }

          const trip = payload.new as Trip;

          if (payload.eventType === "INSERT") {
            // Ny tur startet — hvis den er aktiv, sæt den
            if (!trip.ended_at) {
              setActiveTrip(trip);
            }
          } else if (payload.eventType === "UPDATE") {
            // Tur opdateret — enten afsluttet eller ændret
            if (trip.ended_at) {
              // Turen er afsluttet
              setActiveTrip((prev) => (prev?.id === trip.id ? null : prev));
            } else {
              setActiveTrip(trip);
            }
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, userId]);

  /** Start en ny tur i gruppen */
  const startTrip = useCallback(
    async (name: string): Promise<boolean> => {
      if (!groupId || !userId) return false;

      const { error } = await supabase.from("trips").insert({
        group_id: groupId,
        started_by: userId,
        name: name.trim(),
      });

      if (error) {
        console.error("Fejl ved start af tur:", error.message);
        return false;
      }
      return true;
    },
    [groupId, userId],
  );

  /** Afslut den aktive tur (sæt ended_at) */
  const endTrip = useCallback(async (): Promise<boolean> => {
    if (!activeTrip) return false;

    const { error } = await supabase
      .from("trips")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", activeTrip.id);

    if (error) {
      console.error("Fejl ved afslutning af tur:", error.message);
      return false;
    }
    return true;
  }, [activeTrip]);

  return { activeTrip, startTrip, endTrip };
}
