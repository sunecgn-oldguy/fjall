import { CircleMarker, Tooltip } from "react-leaflet";
import type { Location } from "../../types/database";

interface MemberLocation extends Location {
  display_name: string;
}

interface GroupMembersLayerProps {
  members: MemberLocation[];
}

/**
 * 8 tydelige farver til gruppemedlemmer.
 * Valgt for god kontrast indbyrdes og mod kortet.
 */
const MEMBER_COLORS = [
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
 * Simpel hash af en streng → et stabilt heltal.
 * Bruges til at give samme bruger samme farve hver gang.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Viser andre gruppemedlemmers positioner som farvede prikker med navne.
 * Hver bruger får en unik farve baseret på deres user_id.
 */
export default function GroupMembersLayer({
  members,
}: GroupMembersLayerProps) {
  return (
    <>
      {members.map((member) => {
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
            <Tooltip permanent direction="top" offset={[0, -10]}>
              {member.display_name}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
