import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import type { Group } from "../../types/database";
import CreateGroupForm from "./CreateGroupForm";
import JoinGroupForm from "./JoinGroupForm";

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "join">("list");

  const fetchGroups = useCallback(async () => {
    if (!user) return;

    // Hent gruppe-IDs som brugeren er medlem af
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);

    // Hent gruppedata
    const { data } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    setGroups((data as Group[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  function handleCreatedOrJoined() {
    setView("list");
    fetchGroups();
  }

  if (loading) {
    return <p className="text-stone-500">Innlesur bólkar...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bólkar</h1>

        {view === "list" && (
          <div className="flex gap-2">
            <button
              onClick={() => setView("create")}
              className="rounded bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
            >
              Stovna bólk
            </button>
            <button
              onClick={() => setView("join")}
              className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
            >
              Delta í bólki
            </button>
          </div>
        )}

        {view !== "list" && (
          <button
            onClick={() => setView("list")}
            className="text-sm text-stone-600 underline"
          >
            Aftur
          </button>
        )}
      </div>

      {view === "create" && (
        <CreateGroupForm onCreated={handleCreatedOrJoined} />
      )}

      {view === "join" && (
        <JoinGroupForm onJoined={handleCreatedOrJoined} />
      )}

      {view === "list" && (
        <>
          {groups.length === 0 ? (
            <div className="rounded border border-dashed border-stone-300 p-8 text-center">
              <p className="text-stone-500">
                Tú ert ikki limur í onkrum bólki enn.
              </p>
              <p className="mt-1 text-sm text-stone-400">
                Stovna ein nýggjan bólk ella delta við einum kota.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="rounded border border-stone-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">{group.name}</h2>
                    <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-sm tracking-widest text-stone-600">
                      {group.join_code}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
