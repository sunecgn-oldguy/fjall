import { useMapEvents } from "react-leaflet";
import type { LatLng } from "leaflet";

interface MapTapHandlerProps {
  /** Kun lyt på kort-klik når active er true */
  active: boolean;
  /** Callback med den valgte position */
  onTap: (latlng: LatLng) => void;
}

/**
 * Usynlig komponent der lytter på kort-klik for positionsvalg.
 * Bruges når brugeren placerer en observation eller ordre på kortet.
 */
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
