/**
 * MapTapHandler — usynlig komponent der lytter på kort-klik.
 *
 * Bruges når brugeren skal placere en observation eller ordre:
 * de trykker på kortet, og denne komponent fanger positionen.
 *
 * Komponenten renderer ingenting (return null) — den eksisterer kun
 * for sin side-effekt (useMapEvents). Dette er et normalt mønster
 * i react-leaflet for at lytte på kort-events.
 *
 * "active" prop'en styrer om klik registreres — dette forhindrer
 * at normale kort-interaktioner (pan, zoom) opfanges ved fejl.
 */
import { useMapEvents } from "react-leaflet";
import type { LatLng } from "leaflet";

interface MapTapHandlerProps {
  active: boolean;
  onTap: (latlng: LatLng) => void;
}

export default function MapTapHandler({ active, onTap }: MapTapHandlerProps) {
  useMapEvents({
    click(e) {
      if (active) {
        onTap(e.latlng);
      }
    },
  });

  return null;
}
