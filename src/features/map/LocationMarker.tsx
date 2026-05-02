import { useEffect, useRef } from "react";
import { CircleMarker, Circle, useMap } from "react-leaflet";
import type { GeoPosition } from "./useGeolocation";

interface LocationMarkerProps {
  position: GeoPosition;
}

/**
 * Viser brugerens GPS-position som en blå prik med nøjagtighedscirkel.
 * Flyver til positionen ved første GPS-fix.
 * Bruger CircleMarker i stedet for Marker — undgår Leaflet-ikonproblem med Vite.
 */
export default function LocationMarker({ position }: LocationMarkerProps) {
  const map = useMap();
  const hasFlownRef = useRef(false);

  const center: [number, number] = [position.latitude, position.longitude];

  // Flyv til brugerens position ved første GPS-fix
  useEffect(() => {
    if (!hasFlownRef.current) {
      map.flyTo(center, 15, { duration: 1.5 });
      hasFlownRef.current = true;
    }
  }, [map, center]);

  return (
    <>
      {/* Nøjagtighedscirkel — viser GPS-usikkerhed */}
      <Circle
        center={center}
        radius={position.accuracy}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
          weight: 1,
        }}
      />
      {/* Blå prik — brugerens position */}
      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{
          color: "#fff",
          fillColor: "#3b82f6",
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </>
  );
}
