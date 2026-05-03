/**
 * useRoutePoints — hook der henter alle rutepunkter for en given tur.
 *
 * Punkterne grupperes per bruger (user_id) og sorteres efter recorded_at,
 * så de kan tegnes som polylines på kortet.
 *
 * Hooken poller hvert 30. sekund for at vise opdaterede ruter fra andre
 * deltagere. Realtime bruges IKKE her — polling er tilstrækkeligt da
 * rutepunkter kun optages hvert 3. minut.
 *
 * Returnerer: Map<userId, LatLng[]> hvor LatLng er { lat, lng }.
 */
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { RoutePoint } from "../../types/database";

/** Polling-interval (millisekunder) */
const POLL_INTERVAL_MS = 30_000; // 30 sekunder

export interface LatLng {
  lat: number;
  lng: number;
}

interface UseRoutePointsReturn {
  routePoints: Map<string, LatLng[]>;
}

export function useRoutePoints(tripId: string | null): UseRoutePointsReturn {
  const [routePoints, setRoutePoints] = useState<Map<string, LatLng[]>>(
    new Map(),
  );

  useEffect(() => {
    if (!tripId) {
      setRoutePoints(new Map());
      return;
    }

    let cancelled = false;

    /** Hent alle rutepunkter og gruppér per bruger */
    async function fetchRoutePoints() {
      const { data, error } = await supabase
        .from("route_points")
        .select("*")
        .eq("trip_id", tripId)
        .order("recorded_at", { ascending: true });

      if (cancelled || error || !data) return;

      // Gruppér punkter per bruger
      const grouped = new Map<string, LatLng[]>();
      for (const point of data as RoutePoint[]) {
        const existing = grouped.get(point.user_id) ?? [];
        existing.push({ lat: point.latitude, lng: point.longitude });
        grouped.set(point.user_id, existing);
      }

      setRoutePoints(grouped);
    }

    fetchRoutePoints();

    // Poll hvert 30. sekund for at opdatere ruter
    const pollInterval = setInterval(fetchRoutePoints, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [tripId]);

  return { routePoints };
}
