import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createWorkspace,
  getWorkspaces,
  importPaper,
  searchPapers,
  type SearchResult,
  type Workspace,
} from "../lib/api";

export function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | "">("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getWorkspaces().then(setWorkspaces).catch(() => undefined);
  }, []);

  async function handleCreateWorkspace(event: React.FormEvent) {
    event.preventDefault();
    const workspace = await createWorkspace({
      name: workspaceName,
      description: workspaceDescription,
    });
    setWorkspaces((current) => [...current, workspace]);
    setWorkspaceName("");
    setWorkspaceDescription("");
    setSelectedWorkspace(workspace.id);
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const papers = await searchPapers(query);
      setResults(papers);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(result: SearchResult) {
    if (!selectedWorkspace) {
      setMessage("Create or select a workspace before importing a paper.");
      return;
    }
    await importPaper(selectedWorkspace, result);
    setMessage(`Imported "${result.title}" successfully.`);
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] bg-ink px-8 py-10 text-white shadow-card">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Workspace overview</p>
          <h2 className="mt-3 font-display text-4xl">Build research collections that stay searchable.</h2>
          <p className="mt-4 max-w-2xl text-white/70">
            Create topic-specific workspaces, pull in relevant papers, and jump into AI-assisted
            analysis for each project.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Workspaces" value={String(workspaces.length)} />
            <StatCard label="Search source" value="arXiv + demo fallback" />
            <StatCard label="AI mode" value="Groq or local summary" />
          </div>
        </div>

        <form onSubmit={handleCreateWorkspace} className="rounded-[2rem] bg-white p-6 shadow-card">
          <h3 className="font-display text-2xl">New Workspace</h3>
          <p className="mt-2 text-sm text-ink/60">Separate your literature by project or theme.</p>
          <div className="mt-6 space-y-4">
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="e.g. Medical Imaging Analysis"
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none focus:border-accent"
              required
            />
            <textarea
              value={workspaceDescription}
              onChange={(event) => setWorkspaceDescription(event.target.value)}
              placeholder="What does this workspace track?"
              className="min-h-28 w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none focus:border-accent"
            />
            <button className="rounded-2xl bg-accent px-5 py-3 font-medium text-white">
              Create workspace
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl">Your Workspaces</h3>
            <select
              className="rounded-full border border-ink/10 px-4 py-2 text-sm"
              value={selectedWorkspace}
              onChange={(event) =>
                setSelectedWorkspace(
                  event.target.value ? Number(event.target.value) : "",
                )
              }
            >
              <option value="">Select workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {workspaces.length === 0 && (
              <p className="rounded-2xl bg-ink/5 p-4 text-sm text-ink/60">
                No workspaces yet. Create one to start importing papers.
              </p>
            )}
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                to={`/workspace/${workspace.id}`}
                className="block rounded-2xl border border-ink/10 p-4 transition hover:border-accent hover:bg-accent/5"
              >
                <p className="font-medium">{workspace.name}</p>
                <p className="mt-1 text-sm text-ink/60">{workspace.description || "No description yet."}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl">Paper Discovery</h3>
              <p className="mt-1 text-sm text-ink/60">Search papers and import them in one click.</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transformers, GANs, medical imaging..."
              className="flex-1 rounded-2xl border border-ink/10 px-4 py-3 outline-none focus:border-accent"
            />
            <button
              disabled={loading}
              className="rounded-2xl bg-ink px-5 py-3 font-medium text-white disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-accent">{message}</p>}

          <div className="mt-6 space-y-4">
            {results.map((result) => (
              <article key={result.url} className="rounded-2xl border border-ink/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">{result.title}</h4>
                    <p className="mt-1 text-sm text-ink/60">{result.authors || "Unknown authors"}</p>
                  </div>
                  <button
                    onClick={() => handleImport(result)}
                    className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm text-white"
                  >
                    Import
                  </button>
                </div>
                <p className="mt-4 text-sm leading-6 text-ink/75">{result.abstract}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink/50">
                  <span>{result.source.toUpperCase()}</span>
                  <span>{result.published_at || "Unknown date"}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
