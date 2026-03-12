import { useState } from "react";
import { login, register } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { saveToken } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response =
        mode === "register"
          ? await register({ name, email, password })
          : await login({ email, password });
      saveToken(response.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_35%),linear-gradient(135deg,_#f7f4ea,_#fff7ed)] px-6">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] bg-ink px-8 py-10 text-white shadow-card">
          <p className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm">
            Intelligent research workflow
          </p>
          <h1 className="font-display text-5xl leading-tight">
            Discover papers, organize evidence, and chat with your literature.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/70">
            ResearchHub AI gives students and researchers a focused workspace for discovery,
            import, and contextual analysis of academic papers.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-8 shadow-card">
          <div className="mb-6 flex rounded-full bg-ink/5 p-1">
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm ${mode === "register" ? "bg-accent text-white" : ""}`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm ${mode === "login" ? "bg-accent text-white" : ""}`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                className="w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none focus:border-accent"
                required
              />
            )}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              type="email"
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none focus:border-accent"
              required
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none focus:border-accent"
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
