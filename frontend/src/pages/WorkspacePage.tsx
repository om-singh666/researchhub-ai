import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { askWorkspace, getWorkspacePapers, type Paper } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

type ConversationEntry = {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

export function WorkspacePage() {
  const { workspaceId = "" } = useParams();
  const { token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !workspaceId) return;
    getWorkspacePapers(token, workspaceId).then(setPapers).catch(() => undefined);
  }, [token, workspaceId]);

  async function handleAsk(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !workspaceId || !prompt.trim()) return;
    const question = prompt;
    setPrompt("");
    setConversation((current) => [...current, { role: "user", content: question }]);
    setLoading(true);
    try {
      const response = await askWorkspace(token, workspaceId, question);
      setConversation((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
          citations: response.citations,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <section className="rounded-[2rem] bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink/50">Workspace papers</p>
            <h2 className="font-display text-3xl">Imported Literature</h2>
          </div>
          <Link to="/" className="rounded-full bg-ink px-4 py-2 text-sm text-white">
            Back
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {papers.length === 0 && (
            <div className="rounded-2xl bg-ink/5 p-4 text-sm text-ink/60">
              No papers imported yet. Go back to the dashboard and import some search results.
            </div>
          )}
          {papers.map((paper) => (
            <article key={paper.id} className="rounded-2xl border border-ink/10 p-4">
              <h3 className="font-semibold">{paper.title}</h3>
              <p className="mt-1 text-sm text-ink/55">{paper.authors}</p>
              <p className="mt-3 text-sm leading-6 text-ink/75">{paper.abstract}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-ink p-6 text-white shadow-card">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">AI Research Assistant</p>
        <h2 className="mt-3 font-display text-3xl">Ask questions across your workspace.</h2>
        <p className="mt-2 max-w-2xl text-white/65">
          Example prompts: compare methods, summarize findings, identify gaps, or extract themes.
        </p>

        <div className="mt-6 space-y-4 rounded-[1.5rem] bg-white/5 p-4">
          {conversation.length === 0 && (
            <p className="text-sm text-white/60">
              Start the conversation with a question like “Summarize major findings in these papers”.
            </p>
          )}
          {conversation.map((entry, index) => (
            <div
              key={`${entry.role}-${index}`}
              className={`rounded-2xl p-4 ${entry.role === "user" ? "bg-white text-ink" : "bg-accent/70 text-white"}`}
            >
              <p className="text-xs uppercase tracking-[0.2em] opacity-70">{entry.role}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{entry.content}</p>
              {entry.citations && entry.citations.length > 0 && (
                <p className="mt-3 text-xs opacity-80">Sources: {entry.citations.join(" | ")}</p>
              )}
            </div>
          ))}
          {loading && <p className="text-sm text-white/70">Generating answer...</p>}
        </div>

        <form onSubmit={handleAsk} className="mt-6 flex gap-3">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask about findings, methods, gaps, datasets..."
            className="min-h-24 flex-1 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/45 focus:border-white/40"
          />
          <button className="h-fit rounded-2xl bg-coral px-5 py-3 font-medium text-white">
            Ask AI
          </button>
        </form>
      </section>
    </div>
  );
}
