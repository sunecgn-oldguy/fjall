import { type FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthContext";

/** Genererer en tilfældig 6-cifret kode (000000–999999) */
function generateJoinCode(): string {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
}

interface Props {
  onCreated: () => void;
}

export default function CreateGroupForm({ onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSubmitting(true);

    const joinCode = generateJoinCode();

    // 1. Opret gruppen
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({ name, join_code: joinCode, created_by: user.id })
      .select()
      .single();

    if (groupError) {
      setError(groupError.message);
      setSubmitting(false);
      return;
    }

    // 2. Tilføj opretteren som admin
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "admin" });

    if (memberError) {
      setError(memberError.message);
      setSubmitting(false);
      return;
    }

    setName("");
    setSubmitting(false);
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-lg font-semibold">Stovna bólk</h2>

      <div>
        <label htmlFor="groupName" className="mb-1 block text-sm font-medium">
          Bólkanavn
        </label>
        <input
          id="groupName"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-stone-300 px-3 py-2 focus:border-stone-500 focus:outline-none"
          placeholder="t.d. Seyðadriv Vestmanna"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {submitting ? "Bíða..." : "Stovna"}
      </button>
    </form>
  );
}
