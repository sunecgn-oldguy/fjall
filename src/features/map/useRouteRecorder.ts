/**
 * useRouteRecorder — hook der optager brugerens GPS-position under en aktiv tur.
 *
 * Når en tur er aktiv (tripId er sat), starter hooken en timer der hvert
 * 3. minut gemmer brugerens aktuelle GPS-position som et route_point i databasen.
 *
 * For at undgå duplikater (f.eks. når brugeren står stille) sammenlignes
 * den nye position med den sidst gemte — kun hvis positionen har ændret sig
 * mere end 10 meter, gemmes et nyt punkt.
 *
 * Cleanup: timeren stoppes ved unmount eller når turen afsluttes.
 */
import { useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import type { GeoPosition } from "./useGeolocation";

/** Interval mellem rutepunktsoptagelser (millisekunder) */
const RECORD_INTERVAL_MS = 3 * 60 * 1_000; // 3 minutter

/** Minimum afstand i meter mellem to punkter for at gemme et nyt */
const MIN_DISTANCE_METERS = 10;

/**
 * Beregn afstand mellem to GPS-koordinater i meter (Haversine-formel).
 * Haversine er en matematisk formel der beregner afstanden mellem to
 * punkter på en kugle (Jorden) ud fra deres bredde- og længdegrader.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000; // Jordens radius i meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useRouteRecorder(
  tripId: string | null,
  userId: string | null,
  position: GeoPosition | null,
): void {
  // Gem den seneste position i en ref, så timeren altid har den nyeste
  const positionRef = useRef(position);
  positionRef.current = position;

  // Husk den sidst gemte position for duplikatfiltrering
  const lastRecordedRef = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );

  useEffect(() => {
    if (!tripId || !userId) {
      lastRecordedRef.current = null;
      return;
    }

    /** Gem et rutepunkt i databasen hvis positionen har ændret sig */
    async function recordPoint() {
      const pos = positionRef.current;
      if (!pos) return;

      // Tjek om positionen har ændret sig nok
      if (lastRecordedRef.current) {
        const distance = haversineDistance(
          lastRecordedRef.current.latitude,
          lastRecordedRef.current.longitude,
          pos.latitude,
          pos.longitude,
        );
        if (distance < MIN_DISTANCE_METERS) return;
      }

      const { error } = await supabase.from("route_points").insert({
        trip_id: tripId,
        user_id: userId,
        latitude: pos.latitude,
        longitude: pos.longitude,
      });

      if (error) {
        console.error("Fejl ved optagelse af rutepunkt:", error.message);
      } else {
        lastRecordedRef.current = {
          latitude: pos.latitude,
          longitude: pos.longitude,
        };
      }
    }

    // Optag første punkt med det samme
    recordPoint();

    // Derefter hvert 3. minut
    const intervalId = setInterval(recordPoint, RECORD_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [tripId, userId]);
}
