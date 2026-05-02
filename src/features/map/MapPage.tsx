import { useState, useCallback } from "react";
import { Link } from "react-router";
import type { LatLng } from "leaflet";
import { CircleMarker } from "react-leaflet";
import { useAuth } from "../auth/AuthContext";
import { useGeolocation } from "./useGeolocation";
import { useGroupLocations } from "./useGroupLocations";
import { useSheepSightings } from "./useSheepSightings";
import { useOrders } from "./useOrders";
import MapView from "./MapView";
import LocationMarker from "./LocationMarker";
import GroupMembersLayer from "./GroupMembersLayer";
import GroupSelector from "./GroupSelector";
import MapTapHandler from "./MapTapHandler";
import SheepSightingsLayer from "./SheepSightingsLayer";
import OrdersLayer from "./OrdersLayer";
import MapActionButton from "./MapActionButton";
import AddSightingPanel from "./AddSightingPanel";
import AddOrderPanel from "./AddOrderPanel";

/**
 * State-maskine for kort-interaktion:
 * - idle: normal kort-visning
 * - placing-sighting: brugeren vælger position for fåre-observation
 * - sighting-form: formular til at udfylde observationsdata
 * - placing-order: brugeren vælger position for ordre
 * - order-form: formular til at udfylde ordredata
 */
type MapMode =
  | "idle"
  | "placing-sighting"
  | "sighting-form"
  | "placing-order"
  | "order-form";

/**
 * Kortsiden — viser et interaktivt Leaflet-kort med:
 * - Brugerens GPS-position (blå prik)
 * - Andre gruppemedlemmers positioner (røde prikker)
 * - Fåre-observationer (grønne prikker med fade)
 * - Ordrer/ávísingar (orange prikker)
 * - "+"-knap til at oprette nye observationer/ordrer
 * - Gruppevælger overlay
 * - GPS-status og login-opfordring
 */
export default function MapPage() {
  const { user } = useAuth();
  const { position, error: geoError, loading: geoLoading } = useGeolocation();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [mode, setMode] = useState<MapMode>("idle");
  const [tapPosition, setTapPosition] = useState<LatLng | null>(null);

  const { members, onlineCount } = useGroupLocations(
    selectedGroupId,
    user?.id ?? null,
    position,
  );

  const { sightings, addSighting, resolveSighting } =
    useSheepSightings(selectedGroupId);

  const { orders, addOrder, acceptOrder, completeOrder, cancelOrder } =
    useOrders(selectedGroupId);

  // Er kortet i placerings-mode? (lytter på tap)
  const isPlacingMode =
    mode === "placing-sighting" || mode === "placing-order";

  // Håndtér kort-tap for positionsvalg
  const handleMapTap = useCallback(
    (latlng: LatLng) => {
      setTapPosition(latlng);
      if (mode === "placing-sighting") {
        setMode("sighting-form");
      } else if (mode === "placing-order") {
        setMode("order-form");
      }
    },
    [mode],
  );

  // Annullér og gå tilbage til idle
  const handleCancel = useCallback(() => {
    setMode("idle");
    setTapPosition(null);
  }, []);

  // Gem fåre-observation
  const handleSubmitSighting = useCallback(
    async (data: { count: number; direction: number | null; note: string }) => {
      if (!tapPosition || !selectedGroupId || !user) return;
      const success = await addSighting({
        group_id: selectedGroupId,
        user_id: user.id,
        latitude: tapPosition.lat,
        longitude: tapPosition.lng,
        count: data.count,
        direction: data.direction,
        note: data.note,
      });
      if (success) {
        setMode("idle");
        setTapPosition(null);
      }
    },
    [tapPosition, selectedGroupId, user, addSighting],
  );

  // Gem ordre
  const handleSubmitOrder = useCallback(
    async (data: { message: string; assigned_to: string | null }) => {
      if (!tapPosition || !selectedGroupId || !user) return;
      const success = await addOrder({
        group_id: selectedGroupId,
        created_by: user.id,
        assigned_to: data.assigned_to,
        latitude: tapPosition.lat,
        longitude: tapPosition.lng,
        message: data.message,
      });
      if (success) {
        setMode("idle");
        setTapPosition(null);
      }
    },
    [tapPosition, selectedGroupId, user, addOrder],
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* Kort */}
      <div className="flex-1">
        <MapView>
          {position && <LocationMarker position={position} />}
          <GroupMembersLayer members={members} />
          <SheepSightingsLayer
            sightings={sightings}
            onResolve={resolveSighting}
          />
          <OrdersLayer
            orders={orders}
            currentUserId={user?.id ?? null}
            onAccept={acceptOrder}
            onComplete={completeOrder}
            onCancel={cancelOrder}
          />
          <MapTapHandler active={isPlacingMode} onTap={handleMapTap} />

          {/* Preview-prik for valgt position */}
          {tapPosition && mode === "sighting-form" && (
            <CircleMarker
              center={[tapPosition.lat, tapPosition.lng]}
              radius={10}
              pathOptions={{
                color: "#fff",
                fillColor: "#22c55e",
                fillOpacity: 0.5,
                weight: 2,
                dashArray: "4",
              }}
            />
          )}
          {tapPosition && mode === "order-form" && (
            <CircleMarker
              center={[tapPosition.lat, tapPosition.lng]}
              radius={10}
              pathOptions={{
                color: "#fff",
                fillColor: "#f97316",
                fillOpacity: 0.5,
                weight: 2,
                dashArray: "4",
              }}
            />
          )}
        </MapView>
      </div>

      {/* Overlays oven på kortet */}
      <div className="pointer-events-none absolute inset-0 z-[1000]">
        {/* Top: Gruppevælger + online-tæller */}
        <div className="pointer-events-auto flex items-center gap-2 p-3">
          {user && (
            <>
              <GroupSelector
                userId={user.id}
                selectedGroupId={selectedGroupId}
                onSelect={setSelectedGroupId}
              />
              {selectedGroupId && (
                <span className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-stone-600 shadow backdrop-blur">
                  {onlineCount} online
                </span>
              )}
            </>
          )}
        </div>

        {/* Placerings-mode instruktion */}
        {isPlacingMode && (
          <div className="absolute left-0 right-0 top-16 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-sm font-medium text-stone-700">
                Trýst á kortið
              </span>
              <button
                onClick={handleCancel}
                className="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-600 active:bg-stone-300"
              >
                Angra
              </button>
            </div>
          </div>
        )}

        {/* Bund: GPS-status + login-opfordring (kun i idle mode) */}
        {mode === "idle" && (
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
            {/* GPS-status */}
            {geoLoading && (
              <div className="pointer-events-auto rounded bg-white/90 px-3 py-2 text-sm text-stone-600 shadow backdrop-blur">
                Leitar eftir GPS-staðseting...
              </div>
            )}
            {geoError && (
              <div className="pointer-events-auto rounded bg-red-50/90 px-3 py-2 text-sm text-red-700 shadow backdrop-blur">
                {geoError}
              </div>
            )}

            {/* Login-opfordring for ikke-loggede brugere */}
            {!user && (
              <div className="pointer-events-auto rounded bg-white/90 px-4 py-3 text-center text-sm shadow backdrop-blur">
                <p className="text-stone-600">
                  Rita inn fyri at deila GPS-staðseting við bólkin.
                </p>
                <Link
                  to="/login"
                  className="mt-1 inline-block font-medium text-stone-800 underline"
                >
                  Rita inn
                </Link>
              </div>
            )}
          </div>
        )}

        {/* "+"-knap — kun synlig når idle og brugeren er logget ind med valgt gruppe */}
        {mode === "idle" && user && selectedGroupId && (
          <MapActionButton
            onAddSighting={() => setMode("placing-sighting")}
            onAddOrder={() => setMode("placing-order")}
          />
        )}

        {/* Bottom-panels for formularer */}
        {mode === "sighting-form" && (
          <AddSightingPanel
            onSubmit={handleSubmitSighting}
            onCancel={handleCancel}
          />
        )}

        {mode === "order-form" && selectedGroupId && (
          <AddOrderPanel
            groupId={selectedGroupId}
            onSubmit={handleSubmitOrder}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
