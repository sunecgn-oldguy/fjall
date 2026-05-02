import { CircleMarker, Tooltip } from "react-leaflet";
import type { Location } from "../../types/database";

interface MemberLocation extends Location {
  display_name: string;
}

interface GroupMembersLayerProps {
  members: MemberLocation[];
}

/**
 * Viser andre gruppemedlemmers positioner som røde prikker med navne.
 * Hvert medlem vises som en rød CircleMarker med permanent Tooltip.
 */
export default function GroupMembersLayer({
  members,
}: GroupMembersLayerProps) {
  return (
    <>
      {members.map((member) => (
        <CircleMarker
          key={member.user_id}
          center={[member.latitude, member.longitude]}
          radius={7}
          pathOptions={{
            color: "#fff",
            fillColor: "#ef4444",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {member.display_name}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
