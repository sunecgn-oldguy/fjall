import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Group } from "../../types/database";

interface GroupSelectorProps {
  userId: string;
  selectedGroupId: string | null;
  onSelect: (groupId: string | null) => void;
}

/**
 * Dropdown-overlay øverst på kortet til at vælge aktiv gruppe.
 * Henter brugerens grupper fra Supabase og auto-vælger den første.
 */
export default function GroupSelector({
  userId,
  selectedGroupId,
  onSelect,
}: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);
    const { data } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("name");

    const fetched = (data as Group[]) ?? [];
    setGroups(fetched);
    setLoading(false);

    // Auto-vælg første gruppe hvis ingen er valgt
    if (!selectedGroupId && fetched.length > 0) {
      onSelect(fetched[0].id);
    }
  }, [userId, selectedGroupId, onSelect]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  if (loading) return null;

  if (groups.length === 0) {
    return (
      <div className="rounded bg-white/90 px-3 py-2 text-sm text-stone-500 shadow backdrop-blur">
        Eingin bólkur — stovna ein í{" "}
        <span className="font-medium">Bólkar</span>
      </div>
    );
  }

  return (
    <select
      value={selectedGroupId ?? ""}
      onChange={(e) => onSelect(e.target.value || null)}
      className="rounded bg-white/90 px-3 py-2 text-sm font-medium text-stone-800 shadow backdrop-blur"
    >
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}
