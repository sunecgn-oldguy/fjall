/**
 * MapView — basis-kortkomponent der wrapper Leaflet.
 *
 * Leaflet er et open source JavaScript-bibliotek til interaktive kort.
 * react-leaflet er en React-wrapper der gør Leaflet-komponenter til React-komponenter.
 *
 * Vi bruger OpenTopoMap som tile-provider (kartfliser). OpenTopoMap viser
 * højdekurver og terræn — vigtigt for bjergterræn på Færøerne, hvor
 * fåredrivning foregår i kuperet landskab.
 *
 * Kortet centreres på Færøerne (62°N, 6.8°V) ved indlæsning.
 * Børnekomponenter (LocationMarker, GroupMembersLayer osv.) indsættes
 * som children og vises automatisk på kortet.
 */
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ReactNode } from "react";

/** Centrum af Færøerne — bruges som kortets startposition */
const FAROE_CENTER: [number, number] = [62.0, -6.8];
const DEFAULT_ZOOM = 9;

interface MapViewProps {
  children?: ReactNode;
}

export default function MapView({ children }: MapViewProps) {
  return (
    <div data-testid="map-view" className="h-full w-full">
      <MapContainer
        center={FAROE_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}  // Skjul +/- knapper — de er for små til touch med handsker
      >
        <TileLayer
          attribution='Map data: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> | Rendering: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
          url="https://tile.opentopomap.org/{z}/{x}/{y}.png"
          maxZoom={17}
        />
        {children}
      </MapContainer>
    </div>
  );
}
