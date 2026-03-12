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
  token?: string | null;
  body?: unknown;
};

type DemoDb = {
  users: Array<{ id: number; name: string; email: string; password: string }>;
  workspaces: Array<Workspace & { ownerId: number }>;
  papers: Array<Paper & { workspace_id: number }>;
};

function getDemoDb(): DemoDb {
  const initialState: DemoDb = { users: [], workspaces: [], papers: [] };
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

function getDemoUserId(token?: string | null) {
  if (!token?.startsWith("demo-token-")) return null;
  return Number(token.replace("demo-token-", ""));
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
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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
  const userId = getDemoUserId(options.token);

  if (path === "/auth/register" && method === "POST" && body) {
    const existing = db.users.find((user) => user.email === body.email);
    if (existing) {
      throw new Error("Email already registered");
    }
    const newUser = {
      id: getId(db.users),
      name: body.name,
      email: body.email,
      password: body.password,
    };
    db.users.push(newUser);
    saveDemoDb(db);
    return { access_token: `demo-token-${newUser.id}` } as T;
  }

  if (path === "/auth/login" && method === "POST" && body) {
    const user = db.users.find(
      (item) => item.email === body.email && item.password === body.password,
    );
    if (!user) {
      throw new Error("Invalid email or password");
    }
    return { access_token: `demo-token-${user.id}` } as T;
  }

  if (!userId) {
    throw new Error("Demo mode authentication missing");
  }

  if (path === "/workspaces" && method === "GET") {
    return db.workspaces.filter((workspace) => workspace.ownerId === userId) as T;
  }

  if (path === "/workspaces" && method === "POST" && body) {
    const workspace = {
      id: getId(db.workspaces),
      name: body.name,
      description: body.description,
      ownerId: userId,
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

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}) {
  return request<{ access_token: string }>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function login(payload: { email: string; password: string }) {
  return request<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function getWorkspaces(token: string) {
  return request<Workspace[]>("/workspaces", { token });
}

export async function createWorkspace(
  token: string,
  payload: { name: string; description: string },
) {
  return request<Workspace>("/workspaces", { method: "POST", token, body: payload });
}

export async function searchPapers(token: string, query: string) {
  return request<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`, { token });
}

export async function importPaper(
  token: string,
  workspaceId: number,
  paper: SearchResult,
) {
  return request<SearchResult>(`/search/import/${workspaceId}`, {
    method: "POST",
    token,
    body: paper,
  });
}

export async function getWorkspacePapers(token: string, workspaceId: string) {
  return request<Paper[]>(`/workspaces/${workspaceId}/papers`, { token });
}

export async function askWorkspace(token: string, workspaceId: string, message: string) {
  return request<{ answer: string; citations: string[] }>(`/chat/${workspaceId}`, {
    method: "POST",
    token,
    body: { message },
  });
}
