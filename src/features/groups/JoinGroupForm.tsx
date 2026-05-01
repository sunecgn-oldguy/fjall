import { type FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthContext";

interface Props {
  onJoined: () => void;
}

export default function JoinGroupForm({ onJoined }: Props) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSubmitting(true);

    // 1. Find gruppen via join_code
    const { data: group, error: lookupError } = await supabase
      .from("groups")
      .select("id")
      .eq("join_code", code.trim())
      .single();

    if (lookupError || !group) {
      setError("Ongin bólkur funnin við hesum kota.");
      setSubmitting(false);
      return;
    }

    // 2. Tilføj brugeren som member
    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "member" });

    if (joinError) {
      // Duplikeret membership giver en unique constraint error
      if (joinError.code === "23505") {
        setError("Tú ert longu limur í hesum bólki.");
      } else {
        setError(joinError.message);
      }
      setSubmitting(false);
      return;
    }

    setCode("");
    setSubmitting(false);
    onJoined();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-lg font-semibold">Delta í bólki</h2>

      <div>
        <label htmlFor="joinCode" className="mb-1 block text-sm font-medium">
          6-cifret kota
        </label>
        <input
          id="joinCode"
          type="text"
          required
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded border border-stone-300 px-3 py-2 tracking-widest focus:border-stone-500 focus:outline-none"
          placeholder="000000"
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
        {submitting ? "Bíða..." : "Delta"}
      </button>
    </form>
  );
}
