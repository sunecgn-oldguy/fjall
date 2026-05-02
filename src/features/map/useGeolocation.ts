import { useEffect, useRef, useState } from "react";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook der wrapper browser Geolocation API.
 * Bruger enableHighAccuracy for præcis GPS i bjergterræn.
 * Fejlmeddelelser er på færøsk.
 */
export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
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
      // Numeriske koder brugt i stedet for GeolocationPositionError-konstanter
      // (1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT)
      const messages: Record<number, string> = {
        1: "GPS-loyvi er ikki givið. Vinarliga loyv GPS í kaganstillingum.",
        2: "Støðuupplýsing er ikki tøk. Royn aftur uttansongar.",
        3: "GPS-fyrispurningur tók ov langa tíð. Royn aftur.",
      };
      setError(messages[err.code] ?? "Ókend GPS-villa.");
      setLoading(false);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 30_000,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { position, error, loading };
}
