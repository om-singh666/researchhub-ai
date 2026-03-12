const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
const DEMO_KEY = "researchhub-demo-db";

export type Workspace = {
  id: number;
  name: string;
  description: string;
};

export type Paper = {
  id: number;
  title: string;
  authors: string;
  abstract: string;
  source: string;
  url: string;
  published_at: string;
};

export type SearchResult = Omit<Paper, "id">;

type RequestOptions = {
  method?: string;
  body?: unknown;
};

type DemoDb = {
  workspaces: Workspace[];
  papers: Array<Paper & { workspace_id: number }>;
};

function getDemoDb(): DemoDb {
  const initialState: DemoDb = { workspaces: [], papers: [] };
  const stored = localStorage.getItem(DEMO_KEY);
  if (!stored) return initialState;
  try {
    return JSON.parse(stored) as DemoDb;
  } catch {
    return initialState;
  }
}

function saveDemoDb(db: DemoDb) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(db));
}

function getId(items: Array<{ id: number }>) {
  return items.length === 0 ? 1 : Math.max(...items.map((item) => item.id)) + 1;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    return demoRequest<T>(path, options);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(data.detail ?? "Request failed");
    }

    return (await response.json()) as T;
  } catch {
    return demoRequest<T>(path, options);
  }
}

async function demoRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const db = getDemoDb();
  const method = options.method ?? "GET";
  const body = options.body as Record<string, string> | undefined;

  if (path === "/workspaces" && method === "GET") {
    return db.workspaces as T;
  }

  if (path === "/workspaces" && method === "POST" && body) {
    const workspace = {
      id: getId(db.workspaces),
      name: body.name,
      description: body.description,
    };
    db.workspaces.push(workspace);
    saveDemoDb(db);
    return workspace as T;
  }

  if (path.startsWith("/workspaces/") && path.endsWith("/papers") && method === "GET") {
    const workspaceId = Number(path.split("/")[2]);
    return db.papers.filter((paper) => paper.workspace_id === workspaceId) as T;
  }

  if (path.startsWith("/search?q=") && method === "GET") {
    const query = decodeURIComponent(path.split("=")[1] ?? "research");
    return buildMockSearchResults(query) as T;
  }

  if (path.startsWith("/search/import/") && method === "POST" && body) {
    const workspaceId = Number(path.split("/").pop());
    const paper = body as unknown as SearchResult;
    db.papers.push({
      id: getId(db.papers),
      workspace_id: workspaceId,
      ...paper,
    });
    saveDemoDb(db);
    return paper as T;
  }

  if (path.startsWith("/chat/") && method === "POST" && body) {
    const workspaceId = Number(path.split("/").pop());
    const workspacePapers = db.papers.filter((paper) => paper.workspace_id === workspaceId);
    const question = body.message ?? "Summarize the imported papers";
    const citations = workspacePapers.slice(0, 3).map((paper) => paper.title);
    const answer =
      workspacePapers.length === 0
        ? "This GitHub Pages demo is running in local demo mode. Import a few papers first, then ask a question."
        : [
            `Demo analysis for: "${question}"`,
            ...workspacePapers.slice(0, 3).map((paper) => {
              const snippet =
                paper.abstract.length > 180
                  ? `${paper.abstract.slice(0, 180)}...`
                  : paper.abstract;
              return `- ${paper.title}: ${snippet}`;
            }),
            "This response is generated from demo-mode local data so the public live link still works without a hosted backend.",
          ].join("\n");
    return { answer, citations } as T;
  }

  throw new Error("Demo mode route not implemented");
}

function buildMockSearchResults(query: string): SearchResult[] {
  const normalized = query.trim() || "research";
  return [
    {
      title: `${toTitleCase(normalized)} Research Trends and Opportunities`,
      authors: "A. Sharma, R. Patel",
      abstract:
        `This demo paper surveys recent methods, benchmarks, and open problems in ${normalized}. ` +
        "It is designed to make the live GitHub Pages demo usable even without a hosted backend.",
      source: "demo",
      url: "https://example.org/researchhub-demo-paper-1",
      published_at: "2025-07-14",
    },
    {
      title: `Context-Aware Agents for ${toTitleCase(normalized)}`,
      authors: "M. Verma, S. Khan",
      abstract:
        `This demo study focuses on retrieval, orchestration, and evaluation for ${normalized} systems. ` +
        "It highlights how agentic research workflows can reduce literature review time.",
      source: "demo",
      url: "https://example.org/researchhub-demo-paper-2",
      published_at: "2024-11-20",
    },
    {
      title: `Comparative Analysis of ${toTitleCase(normalized)} Pipelines`,
      authors: "N. Yadav, O. Singh",
      abstract:
        `This demo article compares multiple ${normalized} pipelines across accuracy, interpretability, and deployment cost.`,
      source: "demo",
      url: "https://example.org/researchhub-demo-paper-3",
      published_at: "2024-05-08",
    },
  ];
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export async function getWorkspaces() {
  return request<Workspace[]>("/workspaces");
}

export async function createWorkspace(payload: { name: string; description: string }) {
  return request<Workspace>("/workspaces", { method: "POST", body: payload });
}

export async function searchPapers(query: string) {
  return request<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
}

export async function importPaper(workspaceId: number, paper: SearchResult) {
  return request<SearchResult>(`/search/import/${workspaceId}`, {
    method: "POST",
    body: paper,
  });
}

export async function getWorkspacePapers(workspaceId: string) {
  return request<Paper[]>(`/workspaces/${workspaceId}/papers`);
}

export async function askWorkspace(workspaceId: string, message: string) {
  return request<{ answer: string; citations: string[] }>(`/chat/${workspaceId}`, {
    method: "POST",
    body: { message },
  });
}
