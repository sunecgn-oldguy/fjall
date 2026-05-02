/**
 * useGeolocation — hook der henter brugerens GPS-position fra browseren.
 *
 * En "hook" i React er en funktion der starter med "use" og giver komponenter
 * adgang til funktionalitet (state, side-effekter, browserens API'er osv.).
 *
 * Denne hook bruger browserens Geolocation API via watchPosition(), som
 * løbende giver opdaterede positioner (i modsætning til getCurrentPosition()
 * der kun giver én).
 *
 * enableHighAccuracy: true beder telefonen om at bruge GPS-chippen
 * (i stedet for kun WiFi/mobilmast-triangulering) — vigtigt i bjergterræn.
 *
 * Returnerer:
 * - position: den seneste GPS-position (null hvis ikke tilgængelig)
 * - error: fejlbesked på færøsk (null hvis ingen fejl)
 * - loading: true indtil vi har fået enten en position eller en fejl
 */
import { useEffect, useRef, useState } from "react";

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

  // useRef holder værdier der overlever renders uden at trigger nye renders.
  // Her gemmer vi watchPosition's ID så vi kan stoppe den ved cleanup.
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Tjek om browseren understøtter Geolocation (ældre browsere gør det ikke)
    if (!navigator.geolocation) {
      setError("Geolocation er ikki tøkt í hesum kaga.");
      setLoading(false);
      return;
    }

    // Callback der køres hver gang browseren har en ny position
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

    // Callback der køres hvis GPS fejler
    function onError(err: GeolocationPositionError) {
      // Fejlkoderne er standardiserede i Geolocation API:
      // 1 = PERMISSION_DENIED (brugeren sagde nej til GPS)
      // 2 = POSITION_UNAVAILABLE (GPS-signal tabt)
      // 3 = TIMEOUT (tog for lang tid)
      const messages: Record<number, string> = {
        1: "GPS-loyvi er ikki givið. Vinarliga loyv GPS í kaganstillingum.",
        2: "Støðuupplýsing er ikki tøk. Royn aftur uttansongar.",
        3: "GPS-fyrispurningur tók ov langa tíð. Royn aftur.",
      };
      setError(messages[err.code] ?? "Ókend GPS-villa.");
      setLoading(false);
    }

    // Start løbende GPS-overvågning
    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,  // Brug GPS-chip, ikke kun WiFi
        maximumAge: 10_000,        // Acceptér cached position op til 10 sek gammel
        timeout: 30_000,           // Giv op efter 30 sek uden svar
      },
    );

    // Cleanup: stop GPS-overvågning når komponenten unmountes.
    // Uden dette ville GPS'en køre i baggrunden og dræne batteri.
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []); // Tom dependency-array = kør kun ved mount (én gang)

  return { position, error, loading };
}
