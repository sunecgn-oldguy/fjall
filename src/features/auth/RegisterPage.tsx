import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./AuthContext";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signUpError } = await signUp(email, password, displayName);

    if (signUpError) {
      setError(signUpError);
      setSubmitting(false);
    } else {
      navigate("/");
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Stovna kontu</h1>
      <p className="text-stone-600">
        Upprætta eina nýggja kontu til Fjall.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm font-medium"
          >
            Navn
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded border border-stone-300 px-3 py-2 focus:border-stone-500 focus:outline-none"
            placeholder="Jógvan"
          />
        </div>

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
          <p className="mt-1 text-xs text-stone-500">
            Minst 6 tekin
          </p>
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
          {submitting ? "Bíða..." : "Stovna kontu"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-600">
        Hevur tú longu kontu?{" "}
        <Link to="/login" className="font-medium text-stone-800 underline">
          Rita inn
        </Link>
      </p>
    </div>
  );
}
