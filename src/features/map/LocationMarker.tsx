/**
 * LocationMarker — viser brugerens egen GPS-position på kortet.
 *
 * Består af to elementer:
 * 1. En blå prik (CircleMarker) — brugerens position
 * 2. En halvgennemsigtig cirkel (Circle) — GPS-nøjagtighed i meter
 *    (stor cirkel = upræcis GPS, lille cirkel = præcis GPS)
 *
 * Ved første GPS-fix "flyver" kortet til brugerens position (flyTo).
 * hasFlownRef sikrer at dette kun sker én gang — ellers ville kortet
 * hoppe hver gang GPS'en opdaterer.
 *
 * Vi bruger CircleMarker i stedet for Leaflets standard Marker-ikon
 * fordi Marker har et kendt problem med Vite-bundlers (ikonfilerne
 * bliver ikke fundet korrekt).
 */
import { useEffect, useRef } from "react";
import { CircleMarker, Circle, useMap } from "react-leaflet";
import type { GeoPosition } from "./useGeolocation";

interface LocationMarkerProps {
  position: GeoPosition;
}

export default function LocationMarker({ position }: LocationMarkerProps) {
  const map = useMap();  // useMap() giver adgang til Leaflet-kortinstansen
  const hasFlownRef = useRef(false);  // Sporer om vi allerede har fløjet til positionen

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
      {/* Nøjagtighedscirkel — radius = GPS-usikkerhed i meter */}
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
      {/* Brugerens position — blå prik med hvid kant */}
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
