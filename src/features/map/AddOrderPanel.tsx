import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface GroupMemberOption {
  user_id: string;
  display_name: string;
}

interface AddOrderPanelProps {
  groupId: string;
  onSubmit: (data: {
    message: string;
    assigned_to: string | null;
  }) => void;
  onCancel: () => void;
}

/**
 * Bottom-panel til at oprette en ny ordre/ávísing.
 * Viser besked-input og valgfri dropdown med gruppemedlemmer.
 */
export default function AddOrderPanel({
  groupId,
  onSubmit,
  onCancel,
}: AddOrderPanelProps) {
  const [message, setMessage] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMemberOption[]>([]);

  // Hent gruppemedlemmer til dropdown
  const fetchMembers = useCallback(async () => {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (!memberships) return;

    const userIds = memberships.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    if (profiles) {
      setMembers(
        profiles.map((p) => ({
          user_id: p.id,
          display_name: p.display_name,
        })),
      );
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  function handleSubmit() {
    if (!message.trim()) return;
    onSubmit({ message: message.trim(), assigned_to: assignedTo });
  }

  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-[1001] rounded-t-2xl bg-white p-4 shadow-lg">
      {/* Overskrift */}
      <h3 className="mb-3 text-center text-lg font-semibold text-stone-800">
        Gev ávísing
      </h3>

      {/* Besked */}
      <div className="mb-3">
        <label className="mb-1 block text-sm font-medium text-stone-600">
          Boð
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="T.d. 'Far til á norður' ella 'Stong veðin'"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Tildeling */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-stone-600">
          Til (valfrítt — tómt = allir)
        </label>
        <select
          value={assignedTo ?? ""}
          onChange={(e) => setAssignedTo(e.target.value || null)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        >
          <option value="">Allir í bólkinum</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Knapper */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-stone-300 px-4 py-3 text-sm font-medium text-stone-600 active:bg-stone-50"
        >
          Angra
        </button>
        <button
          onClick={handleSubmit}
          disabled={!message.trim()}
          className="flex-1 rounded-lg bg-orange-500 px-4 py-3 text-sm font-medium text-white active:bg-orange-600 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
