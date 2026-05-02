import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import Spinner from "../../components/Spinner";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setSubmitting(false);
    } else {
      navigate("/");
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Rita inn</h1>
      <p className="text-stone-600">
        Log ind på din Fjall-konto.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Teldupostur
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-stone-300 px-3 py-2 focus:border-stone-500 focus:outline-none"
            placeholder="navn@eksempel.fo"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Loyniorð
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-stone-300 px-3 py-2 focus:border-stone-500 focus:outline-none"
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
          className="w-full rounded bg-stone-800 px-4 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {submitting ? <><Spinner size="sm" /> Bíða...</> : "Rita inn"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-600">
        Eingin konto?{" "}
        <Link to="/register" className="font-medium text-stone-800 underline">
          Stovna kontu
        </Link>
      </p>
    </div>
  );
}
