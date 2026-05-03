/**
 * RoutesLayer — tegner polylines (linjer) for deltagernes ruter på kortet.
 *
 * Hver deltager får sin egen farve baseret på brugerens UUID — præcis
 * samme farvesystem som GroupMembersLayer bruger til positionsprikker.
 * Dette sikrer at en brugers prik og rute altid har samme farve.
 *
 * Polylines tegnes med semi-transparency og en hvid kant for at være
 * synlige mod det topografiske kort.
 */
import { Polyline, Tooltip } from "react-leaflet";
import { hashCode, MEMBER_COLORS } from "./GroupMembersLayer";
import type { LatLng } from "./useRoutePoints";

interface MemberInfo {
  user_id: string;
  display_name: string;
}

interface RoutesLayerProps {
  routePoints: Map<string, LatLng[]>;
  members: MemberInfo[];
}

export default function RoutesLayer({
  routePoints,
  members,
}: RoutesLayerProps) {
  // Lav et hurtigt opslag fra user_id → display_name
  const nameMap = new Map(members.map((m) => [m.user_id, m.display_name]));

  return (
    <>
      {Array.from(routePoints.entries()).map(([userId, points]) => {
        // Mindst 2 punkter nødvendige for at tegne en linje
        if (points.length < 2) return null;

        const color =
          MEMBER_COLORS[hashCode(userId) % MEMBER_COLORS.length];
        const positions = points.map((p) => [p.lat, p.lng] as [number, number]);
        const displayName = nameMap.get(userId) ?? "Ókendur";

        return (
          <Polyline
            key={userId}
            positions={positions}
            pathOptions={{
              color,
              weight: 4,
              opacity: 0.8,
              lineCap: "round",
              lineJoin: "round",
            }}
          >
            <Tooltip sticky>
              {displayName}
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}
