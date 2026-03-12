import type { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-sand text-ink">
      <header className="border-b border-ink/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-2xl font-semibold">ResearchHub AI</p>
            <p className="text-sm text-ink/60">Agentic research paper management and analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className={`rounded-full px-4 py-2 text-sm ${location.pathname === "/" ? "bg-accent text-white" : "bg-ink/5 text-ink"}`}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
