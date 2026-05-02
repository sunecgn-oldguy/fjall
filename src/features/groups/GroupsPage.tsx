/**
 * GroupsPage — side hvor brugeren vælger hvilke grupper de vil deltage i.
 *
 * Viser ALLE grupper i systemet som en liste med checkmarks.
 * Klik på en gruppe = join/leave (toggle). Når mindst én gruppe er valgt,
 * vises en "Kort →" knap der sender brugeren videre.
 *
 * Dette er trin 2 i onboarding-flowet (efter QuickStartPage).
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Spinner from "../../components/Spinner";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import type { Group } from "../../types/database";
import CreateGroupForm from "./CreateGroupForm";

export default function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allGroups, setAllGroups] = useState<Group[]>([]);
  // Set giver O(1) opslag — hurtigere end at søge i et array
  const [memberGroupIds, setMemberGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  /** Hent alle grupper OG brugerens memberships parallelt fra Supabase */
  const fetchData = useCallback(async () => {
    if (!user) return;

    // Promise.all kører begge forespørgsler samtidig (parallelt),
    // i stedet for at vente på den første før den anden starter
    const [groupsRes, membershipsRes] = await Promise.all([
      supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id),
    ]);

    setAllGroups((groupsRes.data as Group[]) ?? []);
    setMemberGroupIds(
      new Set((membershipsRes.data ?? []).map((m) => m.group_id)),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Toggle medlemskab: klik på en gruppe for at joine eller forlade den.
   * UI opdateres kun hvis Supabase-kaldet lykkedes — ellers forbliver
   * tilstanden uændret, så brugeren ser den rigtige status.
   */
  async function toggleMembership(groupId: string) {
    if (!user) return;
    setTogglingId(groupId);

    const isMember = memberGroupIds.has(groupId);

    if (isMember) {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      // Opdatér kun UI hvis databasen accepterede ændringen
      if (!error) {
        setMemberGroupIds((prev) => {
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });
      }
    } else {
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: user.id, role: "member" });

      if (!error) {
        setMemberGroupIds((prev) => new Set(prev).add(groupId));
      }
    }

    setTogglingId(null);
  }

  /** Callback når en ny gruppe er oprettet — luk formularen og genindlæs data */
  function handleCreated() {
    setShowCreate(false);
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center">
        <Spinner />
        <p className="text-stone-500">Innlesur bólkar...</p>
      </div>
    );
  }

  const hasSelection = memberGroupIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Header med titel og "Stovna bólk" knap */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vel bólkar</h1>

        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
          >
            Stovna bólk
          </button>
        ) : (
          <button
            onClick={() => setShowCreate(false)}
            className="text-sm text-stone-600 underline"
          >
            Aftur
          </button>
        )}
      </div>

      {showCreate && <CreateGroupForm onCreated={handleCreated} />}

      {!showCreate && (
        <>
          <p className="text-sm text-stone-500">
            Trýst á ein bólk fyri at delta ella fara úr.
          </p>

          {allGroups.length === 0 ? (
            <div className="rounded border border-dashed border-stone-300 p-8 text-center">
              <p className="text-stone-500">
                Eingin bólkur er stovnaður enn.
              </p>
              <p className="mt-1 text-sm text-stone-400">
                Trýst á &quot;Stovna bólk&quot; fyri at byrja.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {allGroups.map((group) => {
                const isMember = memberGroupIds.has(group.id);
                const isToggling = togglingId === group.id;

                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      onClick={() => toggleMembership(group.id)}
                      disabled={isToggling}
                      className={`flex w-full items-center gap-3 rounded border p-4 text-left transition-colors ${
                        isMember
                          ? "border-green-300 bg-green-50"
                          : "border-stone-200 bg-white hover:bg-stone-50"
                      } disabled:opacity-50`}
                    >
                      {/* Cirkel-checkmark: grøn med ✓ = medlem, tom = ikke medlem */}
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                          isMember
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-stone-300 text-transparent"
                        }`}
                      >
                        ✓
                      </span>

                      <span className="flex-1 font-semibold">
                        {group.name}
                      </span>

                      {isToggling && <Spinner size="sm" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* "Gå til kort" knap — vises kun når mindst én gruppe er valgt */}
          {hasSelection && (
            <button
              onClick={() => navigate("/kort")}
              className="w-full rounded bg-green-700 px-4 py-3 text-center font-medium text-white hover:bg-green-600"
            >
              Kort →
            </button>
          )}
        </>
      )}
    </div>
  );
}
