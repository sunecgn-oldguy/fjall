/**
 * TripHistoryPage — oversigt over tidligere seyðadriv-ture.
 *
 * Viser en liste af afsluttede ture for brugerens grupper, grupperet per gruppe.
 * Klik på en tur åbner et kort med de gemte ruter (read-only).
 *
 * Tilgængelig på /turar (beskyttet rute — kræver login).
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import type { Trip, RoutePoint } from "../../types/database";
import MapView from "../map/MapView";
import RoutesLayer from "../map/RoutesLayer";
import Spinner from "../../components/Spinner";

/** Trip beriget med gruppens navn og antal unikke deltagere */
interface TripWithGroup extends Trip {
  group_name: string;
  participants: string[];
}

/** Formattér en ISO-dato til "2. mai 2026 kl. 14:30" */
function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("fo-FO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formattér varighed mellem to ISO-datoer */
function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}t ${minutes}m`;
  return `${minutes}m`;
}

export default function TripHistoryPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripWithGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<TripWithGroup | null>(null);
  const [routePoints, setRoutePoints] = useState<Map<string, { lat: number; lng: number }[]>>(new Map());
  const [members, setMembers] = useState<{ user_id: string; display_name: string }[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Hent alle afsluttede ture for brugerens grupper
  useEffect(() => {
    if (!user) return;

    async function fetchTrips() {
      // Hent brugerens grupper
      const { data: memberRows } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user!.id);

      if (!memberRows || memberRows.length === 0) {
        setTrips([]);
        setLoading(false);
        return;
      }

      const groupIds = memberRows.map((r) => r.group_id);

      // Hent grupper for navne
      const { data: groups } = await supabase
        .from("groups")
        .select("id, name")
        .in("id", groupIds);

      const groupNameMap = new Map(
        (groups ?? []).map((g: { id: string; name: string }) => [g.id, g.name]),
      );

      // Hent afsluttede ture
      const { data: tripRows } = await supabase
        .from("trips")
        .select("*")
        .in("group_id", groupIds)
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false });

      if (!tripRows) {
        setTrips([]);
        setLoading(false);
        return;
      }

      // Hent unikke deltagere per tur
      const tripsWithGroups: TripWithGroup[] = [];
      for (const trip of tripRows as Trip[]) {
        const { data: points } = await supabase
          .from("route_points")
          .select("user_id")
          .eq("trip_id", trip.id);

        const uniqueUsers = [...new Set((points ?? []).map((p: { user_id: string }) => p.user_id))];

        tripsWithGroups.push({
          ...trip,
          group_name: groupNameMap.get(trip.group_id) ?? "Ókend bólkur",
          participants: uniqueUsers,
        });
      }

      setTrips(tripsWithGroups);
      setLoading(false);
    }

    fetchTrips();
  }, [user]);

  // Hent rutepunkter for den valgte tur
  const viewTrip = useCallback(async (trip: TripWithGroup) => {
    setSelectedTrip(trip);
    setLoadingRoutes(true);

    const { data } = await supabase
      .from("route_points")
      .select("*")
      .eq("trip_id", trip.id)
      .order("recorded_at", { ascending: true });

    if (data) {
      const grouped = new Map<string, { lat: number; lng: number }[]>();
      for (const point of data as RoutePoint[]) {
        const existing = grouped.get(point.user_id) ?? [];
        existing.push({ lat: point.latitude, lng: point.longitude });
        grouped.set(point.user_id, existing);
      }
      setRoutePoints(grouped);

      // Hent navne for deltagerne
      const userIds = [...grouped.keys()];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        setMembers(
          (profiles ?? []).map((p: { id: string; display_name: string }) => ({
            user_id: p.id,
            display_name: p.display_name,
          })),
        );
      }
    }

    setLoadingRoutes(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12">
        <Spinner />
        <span className="text-stone-500">Lesur túrar...</span>
      </div>
    );
  }

  // Vis kort med ruter for valgt tur
  if (selectedTrip) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedTrip(null);
              setRoutePoints(new Map());
              setMembers([]);
            }}
            className="rounded bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-300 active:bg-stone-400"
          >
            &larr; Aftur
          </button>
          <div>
            <h2 className="text-lg font-bold text-stone-800">
              {selectedTrip.name || selectedTrip.group_name}
            </h2>
            <p className="text-sm text-stone-500">
              {formatDate(selectedTrip.started_at)}
              {selectedTrip.ended_at &&
                ` — ${formatDuration(selectedTrip.started_at, selectedTrip.ended_at)}`}
            </p>
          </div>
        </div>

        {loadingRoutes ? (
          <div className="flex items-center justify-center gap-2 py-12">
            <Spinner />
            <span className="text-stone-500">Lesur rútar...</span>
          </div>
        ) : (
          <div className="h-96 overflow-hidden rounded-lg border border-stone-200 shadow">
            <MapView>
              <RoutesLayer routePoints={routePoints} members={members} />
            </MapView>
          </div>
        )}

        {/* Deltagerliste */}
        {members.length > 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-stone-600">
              Luttakarar ({members.length})
            </h3>
            <ul className="flex flex-wrap gap-2">
              {members.map((m) => (
                <li
                  key={m.user_id}
                  className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
                >
                  {m.display_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Gruppér ture per gruppe
  const tripsByGroup = new Map<string, TripWithGroup[]>();
  for (const trip of trips) {
    const existing = tripsByGroup.get(trip.group_name) ?? [];
    existing.push(trip);
    tripsByGroup.set(trip.group_name, existing);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-stone-800">Túrar</h1>

      {trips.length === 0 ? (
        <p className="text-stone-500">
          Eingin avsluttaður túrur enn. Start ein túr á kortinum!
        </p>
      ) : (
        Array.from(tripsByGroup.entries()).map(([groupName, groupTrips]) => (
          <section key={groupName}>
            <h2 className="mb-2 text-lg font-semibold text-stone-700">
              {groupName}
            </h2>
            <ul className="flex flex-col gap-2">
              {groupTrips.map((trip) => (
                <li key={trip.id}>
                  <button
                    onClick={() => viewTrip(trip)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-stone-50 active:bg-stone-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-800">
                        {trip.name || "Ónevndur túrur"}
                      </span>
                      {trip.ended_at && (
                        <span className="text-xs text-stone-400">
                          {formatDuration(trip.started_at, trip.ended_at)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-stone-500">
                      {formatDate(trip.started_at)} — {trip.participants.length}{" "}
                      {trip.participants.length === 1
                        ? "luttakari"
                        : "luttakarar"}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
