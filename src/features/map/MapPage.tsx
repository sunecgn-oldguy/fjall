import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { useGeolocation } from "./useGeolocation";
import { useGroupLocations } from "./useGroupLocations";
import MapView from "./MapView";
import LocationMarker from "./LocationMarker";
import GroupMembersLayer from "./GroupMembersLayer";
import GroupSelector from "./GroupSelector";

/**
 * Kortsiden — viser et interaktivt Leaflet-kort med:
 * - Brugerens GPS-position (blå prik)
 * - Andre gruppemedlemmers positioner (røde prikker)
 * - Gruppevælger overlay
 * - GPS-status og login-opfordring
 */
export default function MapPage() {
  const { user } = useAuth();
  const { position, error: geoError, loading: geoLoading } = useGeolocation();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { members, onlineCount } = useGroupLocations(
    selectedGroupId,
    user?.id ?? null,
    position,
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* Kort */}
      <div className="flex-1">
        <MapView>
          {position && <LocationMarker position={position} />}
          <GroupMembersLayer members={members} />
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

        {/* Bund: GPS-status + login-opfordring */}
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
      </div>
    </div>
  );
}
