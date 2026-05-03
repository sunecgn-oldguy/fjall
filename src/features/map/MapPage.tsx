/**
 * MapPage — appens hovedside med det interaktive kort.
 *
 * "Kortet er appen" — dette er den første side brugeren ser.
 *
 * Funktionalitet:
 * - GPS-position (useGeolocation)
 * - Live positionsdeling (useGroupLocations)
 * - Fåre-observationer (useSheepSightings)
 * - Ordrer/ávísingar (useOrders)
 * - Kortvisning med alle lag (MapView + layers)
 * - Overlay-UI (gruppevælger med panel, TripControlPanel, "+"-knap, formularer)
 * - Auto-start tur når gruppe + GPS er klar
 *
 * Interaktionen styres af en STATE-MASKINE (MapMode):
 *   idle → placing-sighting → sighting-form → idle
 *   idle → placing-order   → order-form    → idle
 *
 * Farvekoder på kortet:
 * - Blå = egen position
 * - Farvede (rød, violet osv.) = gruppemedlemmer
 * - Grøn = fåre-observationer
 * - Orange = ordrer
 */
import { useState, useCallback, useEffect, useRef } from "react";
import type { LatLng } from "leaflet";
import { CircleMarker } from "react-leaflet";
import { useAuth } from "../auth/AuthContext";
import { useGeolocation } from "./useGeolocation";
import { useGroupLocations } from "./useGroupLocations";
import { useSheepSightings } from "./useSheepSightings";
import { useOrders } from "./useOrders";
import { useActiveTrip } from "./useActiveTrip";
import { useRouteRecorder } from "./useRouteRecorder";
import { useRoutePoints } from "./useRoutePoints";
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
import TripControlPanel from "./TripControlPanel";
import RoutesLayer from "./RoutesLayer";

/** De mulige tilstande for kort-interaktion */
type MapMode =
  | "idle"              // Normal kort-visning
  | "placing-sighting"  // Venter på at brugeren trykker på kortet (observation)
  | "sighting-form"     // Formular til observationsdata
  | "placing-order"     // Venter på at brugeren trykker på kortet (ordre)
  | "order-form";       // Formular til ordredata

/**
 * Formatterer dagens dato på færøsk, f.eks. "3. mai 2026"
 */
function todayFormatted(): string {
  const months = [
    "januar", "februar", "mars", "apríl", "mai", "juni",
    "juli", "august", "september", "oktober", "november", "desember",
  ];
  const d = new Date();
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

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

  // Tur-hooks: hent/start/stop aktiv tur, optag rute, hent alles ruter
  const { activeTrip, startTrip, endTrip } = useActiveTrip(
    selectedGroupId,
    user?.id ?? null,
  );
  useRouteRecorder(activeTrip?.id ?? null, user?.id ?? null, position);
  const { routePoints } = useRoutePoints(activeTrip?.id ?? null);

  // ------ AUTO-START TUR ------
  // Når brugeren har valgt en gruppe, har GPS og der ingen aktiv tur er,
  // startes en ny tur automatisk med dagens dato som navn.
  const autoStartAttempted = useRef(false);

  useEffect(() => {
    // Nulstil flag når gruppe skiftes
    autoStartAttempted.current = false;
  }, [selectedGroupId]);

  useEffect(() => {
    if (
      selectedGroupId &&
      user &&
      position &&
      activeTrip === null &&
      !autoStartAttempted.current
    ) {
      autoStartAttempted.current = true;
      startTrip(todayFormatted());
    }
  }, [selectedGroupId, user, position, activeTrip, startTrip]);

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
          <RoutesLayer routePoints={routePoints} members={members} />
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

        {/* Tur-kontrolpanel: viser optagelsesstatus */}
        {user && selectedGroupId && (
          <div className="flex justify-center px-3">
            <TripControlPanel
              activeTrip={activeTrip}
              currentUserId={user.id}
              onEndTrip={endTrip}
            />
          </div>
        )}

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
                <a
                  href="/login"
                  className="mt-1 inline-block font-medium text-stone-800 underline"
                >
                  Rita inn
                </a>
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
