/**
 * GroupMembersLayer — viser andre gruppemedlemmers positioner på kortet.
 *
 * Hvert medlem vises som en farvet prik med deres navn permanent synligt.
 * Farven er baseret på brugerens UUID via en hash-funktion — dette sikrer
 * at samme bruger altid får samme farve, selv efter genindlæsning.
 *
 * 8 farver er valgt for god kontrast mod hinanden og mod kortet.
 */
import { CircleMarker, Tooltip } from "react-leaflet";
import type { Location } from "../../types/database";

interface MemberLocation extends Location {
  display_name: string;
}

interface GroupMembersLayerProps {
  members: MemberLocation[];
}

/** Farvepalet til gruppemedlemmer — valgt for genkendelighed i felten.
 *  Eksporteret så RoutesLayer kan genbruge samme farver til polylines. */
export const MEMBER_COLORS = [
  "#ef4444", // rød
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#10b981", // emerald
  "#6366f1", // indigo
  "#f97316", // orange
];

/**
 * Simpel hash-funktion der omdanner en streng til et stabilt heltal.
 * "Stabil" betyder at samme input altid giver samme output.
 * Bruges til at mappe en bruger-UUID til et farveindex.
 * Eksporteret så RoutesLayer kan genbruge samme farvemapping.
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0; // | 0 holder det som 32-bit integer
  }
  return Math.abs(hash);
}

export default function GroupMembersLayer({
  members,
}: GroupMembersLayerProps) {
  return (
    <>
      {members.map((member) => {
        // Vælg farve baseret på brugerens UUID
        const color =
          MEMBER_COLORS[hashCode(member.user_id) % MEMBER_COLORS.length];

        return (
          <CircleMarker
            key={member.user_id}
            center={[member.latitude, member.longitude]}
            radius={7}
            pathOptions={{
              color: "#fff",
              fillColor: color,
              fillOpacity: 1,
              weight: 2,
            }}
          >
            {/* permanent = altid synlig (ikke kun ved hover). direction + offset placerer teksten over prikken */}
            <Tooltip permanent direction="top" offset={[0, -10]}>
              {member.display_name}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
