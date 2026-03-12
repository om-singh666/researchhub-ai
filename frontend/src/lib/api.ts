const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
