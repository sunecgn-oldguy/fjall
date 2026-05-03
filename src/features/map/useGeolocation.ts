/**
 * useGeolocation — hook der henter brugerens GPS-position.
 *
 * To modes:
 * 1. **Native (Capacitor):** Bruger @capacitor-community/background-geolocation
 *    som kører videre selv med skærmen slukket. Viser en notifikation på Android.
 * 2. **Web (browser):** Bruger navigator.geolocation.watchPosition() som fallback
 *    når appen køres som PWA i browseren (stopper ved skærm-sluk).
 *
 * Detekteringen sker via `Capacitor.isNativePlatform()` — true i native app,
 * false i browseren.
 *
 * Returnerer:
 * - position: den seneste GPS-position (null hvis ikke tilgængelig)
 * - error: fejlbesked på færøsk (null hvis ingen fejl)
 * - loading: true indtil vi har fået enten en position eller en fejl
 */
import { useEffect, useRef, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";

// Registrér plugin'et — det kobles til den native implementation i Capacitor
const BackgroundGeolocation =
  registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;       // Nøjagtighed i meter — lavere er bedre
  heading: number | null;  // Retning i grader (null hvis brugeren står stille)
  speed: number | null;    // Hastighed i m/s (null hvis ukendt)
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Gem watcher-ID til cleanup
  const watcherIdRef = useRef<string | null>(null);
  const browserWatchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // --- NATIVE MODE (Capacitor / Android / iOS) ---
    if (Capacitor.isNativePlatform()) {
      BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "Fjall optekur túrin í bakgrunninum.",
          backgroundTitle: "Fjall — GPS aktiv",
          requestPermissions: true,
          stale: false,
          // Minimum 10 meter mellem opdateringer (sparer batteri)
          distanceFilter: 10,
        },
        (location, err) => {
          if (err) {
            if (err.code === "NOT_AUTHORIZED") {
              setError("GPS-loyvi er ikki givið. Vinarliga loyv GPS í stillingum.");
            } else {
              setError("GPS-villa: " + (err.code ?? "ókend"));
            }
            setLoading(false);
            return;
          }

          if (location) {
            setPosition({
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              heading: location.bearing ?? null,
              speed: location.speed ?? null,
            });
            setError(null);
            setLoading(false);
          }
        },
      ).then((id) => {
        watcherIdRef.current = id;
      });

      // Cleanup: fjern watcher når komponenten unmountes
      return () => {
        if (watcherIdRef.current !== null) {
          BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
        }
      };
    }

    // --- WEB MODE (browser / PWA) ---
    if (!navigator.geolocation) {
      setError("Geolocation er ikki tøkt í hesum kaga.");
      setLoading(false);
      return;
    }

    function onSuccess(pos: GeolocationPosition) {
      setPosition({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
      });
      setError(null);
      setLoading(false);
    }

    function onError(err: GeolocationPositionError) {
      const messages: Record<number, string> = {
        1: "GPS-loyvi er ikki givið. Vinarliga loyv GPS í kaganstillingum.",
        2: "Støðuupplýsing er ikki tøk. Royn aftur uttansongar.",
        3: "GPS-fyrispurningur tók ov langa tíð. Royn aftur.",
      };
      setError(messages[err.code] ?? "Ókend GPS-villa.");
      setLoading(false);
    }

    browserWatchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 30_000,
      },
    );

    return () => {
      if (browserWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(browserWatchIdRef.current);
      }
    };
  }, []);

  return { position, error, loading };
}
