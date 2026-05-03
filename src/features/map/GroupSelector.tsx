/**
 * GroupSelector — dropdown + administrationspanel til grupper.
 *
 * Bruges som overlay på kortet. Tre tilstande:
 * 1. Normal: dropdown med brugerens grupper + ⚙-knap
 * 2. Panel åbent: liste med grupper + leave/delete + join/opret
 * 3. Ingen grupper: direkte visning af join/opret-felter
 *
 * Erstatter den gamle separate GroupsPage — alt gruppestyring
 * sker nu direkte fra kortet.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Group } from "../../types/database";

interface GroupSelectorProps {
  userId: string;
  selectedGroupId: string | null;
  onSelect: (groupId: string | null) => void;
}

/** Genererer en tilfældig 6-cifret join-kode */
function generateJoinCode(): string {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
}

export default function GroupSelector({
  userId,
  selectedGroupId,
  onSelect,
}: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  // Panel-formular state
  const [joinCode, setJoinCode] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    // Trin 1: Find hvilke grupper brugeren er medlem af
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Trin 2: Hent gruppedata for de grupper brugeren er i
    const groupIds = memberships.map((m) => m.group_id);
    const { data } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("name");

    const fetched = (data as Group[]) ?? [];
    setGroups(fetched);
    setLoading(false);

    // Auto-vælg første gruppe hvis ingen er valgt endnu
    if (!selectedGroupId && fetched.length > 0) {
      onSelect(fetched[0].id);
    }
  }, [userId, selectedGroupId, onSelect]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  /** Join en gruppe via join-kode */
  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setError(null);
    setActionLoading(true);

    // Find gruppen med denne join-kode
    const { data: group, error: findError } = await supabase
      .from("groups")
      .select("id")
      .eq("join_code", joinCode.trim())
      .single();

    if (findError || !group) {
      setError("Kodan er skeiv — roynt aftur");
      setActionLoading(false);
      return;
    }

    // Tilføj brugeren som medlem
    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: userId, role: "member" });

    if (joinError) {
      // Duplikat-fejl = allerede medlem
      if (joinError.code === "23505") {
        setError("Tú ert longu limur");
      } else {
        setError(joinError.message);
      }
      setActionLoading(false);
      return;
    }

    setJoinCode("");
    setActionLoading(false);
    await fetchGroups();
    // Auto-vælg den nye gruppe
    onSelect(group.id);
  };

  /** Opret en ny gruppe */
  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setError(null);
    setActionLoading(true);

    const joinCodeGenerated = generateJoinCode();

    // Opret gruppen
    const { data: group, error: createError } = await supabase
      .from("groups")
      .insert({
        name: newGroupName.trim(),
        join_code: joinCodeGenerated,
        created_by: userId,
      })
      .select()
      .single();

    if (createError || !group) {
      setError(createError?.message ?? "Fekk ikki stovnað bólk");
      setActionLoading(false);
      return;
    }

    // Tilføj opretteren som admin
    await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: userId, role: "admin" });

    setNewGroupName("");
    setActionLoading(false);
    await fetchGroups();
    onSelect(group.id);
    setPanelOpen(false);
  };

  /** Forlad en gruppe (fjern sig selv fra group_members) */
  const handleLeave = async (groupId: string) => {
    if (!window.confirm("Ert tú vís/ur? Tú fert úr hesum bólki.")) return;
    setActionLoading(true);

    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    // Hvis vi forlod den valgte gruppe, nulstil
    if (selectedGroupId === groupId) {
      onSelect(null);
    }
    await fetchGroups();
    setActionLoading(false);
  };

  /** Slet en gruppe (kun opretteren kan) */
  const handleDelete = async (groupId: string) => {
    if (!window.confirm("Ert tú vís/ur? Bólkurin verður strikaður — kann ikki takast aftur.")) return;
    setActionLoading(true);

    // Slet alle medlemmer først (cascade virker måske, men vær sikker)
    await supabase.from("group_members").delete().eq("group_id", groupId);
    await supabase.from("groups").delete().eq("id", groupId);

    if (selectedGroupId === groupId) {
      onSelect(null);
    }
    await fetchGroups();
    setActionLoading(false);
  };

  // Vis ingenting mens vi indlæser
  if (loading) return null;

  // ------ Tilstand 3: Ingen grupper → vis opret/join direkte ------
  if (groups.length === 0 && !panelOpen) {
    return (
      <div className="rounded-lg bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="mb-2 text-sm font-medium text-stone-700">
          Skráset í bólk fyri at byrja
        </p>

        {error && (
          <p className="mb-2 text-xs text-red-600">{error}</p>
        )}

        {/* Join via kode */}
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            placeholder="Skriva kodu"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-28 rounded border border-stone-300 px-2 py-1.5 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            onClick={handleJoin}
            disabled={actionLoading || !joinCode.trim()}
            className="rounded bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            Delta
          </button>
        </div>

        {/* Opret ny gruppe */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nýtt bólkanavn"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="w-36 rounded border border-stone-300 px-2 py-1.5 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={actionLoading || !newGroupName.trim()}
            className="rounded bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            Stovna
          </button>
        </div>
      </div>
    );
  }

  // ------ Tilstand 2: Panel åbent ------
  if (panelOpen) {
    return (
      <div className="max-h-80 w-72 overflow-y-auto rounded-lg bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-800">Bólkar</h3>
          <button
            onClick={() => { setPanelOpen(false); setError(null); }}
            className="text-xs text-stone-500 underline"
          >
            Lat aftur
          </button>
        </div>

        {error && (
          <p className="mb-2 text-xs text-red-600">{error}</p>
        )}

        {/* Liste over brugerens grupper */}
        <ul className="mb-3 space-y-2">
          {groups.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between rounded border border-stone-200 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-stone-700">
                  {g.name}
                </span>
                <span className="text-xs text-stone-400">
                  Koda: {g.join_code}
                </span>
              </div>
              <div className="ml-2 flex gap-1">
                <button
                  onClick={() => handleLeave(g.id)}
                  disabled={actionLoading}
                  className="rounded px-2 py-1 text-xs text-stone-600 hover:bg-stone-100 disabled:opacity-50"
                  title="Fara úr bólki"
                >
                  Fara úr
                </button>
                {g.created_by === userId && (
                  <button
                    onClick={() => handleDelete(g.id)}
                    disabled={actionLoading}
                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Strika bólk"
                  >
                    Strika
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Join via kode */}
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            placeholder="Skriva kodu"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="flex-1 rounded border border-stone-300 px-2 py-1.5 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            onClick={handleJoin}
            disabled={actionLoading || !joinCode.trim()}
            className="rounded bg-stone-800 px-2 py-1.5 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            Delta
          </button>
        </div>

        {/* Opret ny gruppe */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nýtt bólkanavn"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="flex-1 rounded border border-stone-300 px-2 py-1.5 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={actionLoading || !newGroupName.trim()}
            className="rounded bg-emerald-700 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            Stovna
          </button>
        </div>
      </div>
    );
  }

  // ------ Tilstand 1: Normal dropdown med ⚙-knap ------
  return (
    <div className="flex items-center gap-1">
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

      <button
        onClick={() => setPanelOpen(true)}
        className="rounded bg-white/90 p-2 text-sm text-stone-600 shadow backdrop-blur hover:bg-white"
        title="Stýr bólkar"
      >
        ⚙
      </button>
    </div>
  );
}
