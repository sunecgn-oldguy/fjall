import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ReactNode } from "react";

/** Færøerne center-koordinater */
const FAROE_CENTER: [number, number] = [62.0, -6.8];
const DEFAULT_ZOOM = 9;

interface MapViewProps {
  children?: ReactNode;
}

/**
 * Basis-kortkomponent med OpenTopoMap tiles.
 * OpenTopoMap viser højdekurver og terræn — vigtigt for bjergterræn på Færøerne.
 */
export default function MapView({ children }: MapViewProps) {
  return (
    <div data-testid="map-view" className="h-full w-full">
      <MapContainer
        center={FAROE_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
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
