import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import Spinner from "../../components/Spinner";
import { useAuth } from "./AuthContext";

export default function QuickStartPage() {
  const { quickStart, signIn } = useAuth();
  const navigate = useNavigate();

  // Quick-start state
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Email-login fold-ud
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleQuickStart(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: startError } = await quickStart(name.trim());

    if (startError) {
      setError(startError);
      setSubmitting(false);
    } else {
      navigate("/bolkar");
    }
  }

  async function handleEmailLogin(e: FormEvent) {
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
      <h1 className="text-2xl font-bold">Kom í gongd</h1>
      <p className="text-stone-600">
        Skriva títt navn og byrja beinanvegin.
      </p>

      <form onSubmit={handleQuickStart} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Hvat eitur tú?
          </label>
          <input
            id="name"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-stone-300 px-3 py-2 focus:border-stone-500 focus:outline-none"
            placeholder="Jógvan"
          />
        </div>

        {error && !showEmailLogin && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-stone-800 px-4 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {submitting && !showEmailLogin ? (
            <>
              <Spinner size="sm" /> Bíða...
            </>
          ) : (
            "Byrja"
          )}
        </button>
      </form>

      {/* Fold-ud sektion til eksisterende email-brugere */}
      <div className="border-t border-stone-200 pt-4">
        <button
          type="button"
          onClick={() => setShowEmailLogin(!showEmailLogin)}
          className="text-sm text-stone-500 underline hover:text-stone-700"
        >
          {showEmailLogin
            ? "Fjal teldupost-innriting"
            : "Hevur tú longu kontu? Rita inn við telduposti"}
        </button>

        {showEmailLogin && (
          <form onSubmit={handleEmailLogin} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium"
              >
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
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
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

            {error && showEmailLogin && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              {submitting && showEmailLogin ? (
                <>
                  <Spinner size="sm" /> Bíða...
                </>
              ) : (
                "Rita inn"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
