const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface User {
  id: number;
  employee_id: string;
  full_name: string;
  role: string;
  department: string;
  program: string;
  created_at: string;
}

export interface Source {
  title: string;
  snippet: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  response_ms: number;
}

export interface ChatHistoryItem {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ScenarioSummary {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
}

export interface ScenarioStep {
  id: string;
  prompt: string;
  options: { id: string; text: string; correct: boolean; feedback: string; points: number }[];
}

export interface Scenario extends ScenarioSummary {
  customer: { name: string; document: string; purpose: string; avatar: string };
  steps: ScenarioStep[];
}

export interface SimSession {
  id: number;
  user_id: number;
  scenario_id: string;
  score: number;
  finished: boolean;
  state: { current_step_id: string | null; log: any[] };
}

export interface AnswerResponse {
  correct: boolean;
  feedback: string;
  points_awarded: number;
  total_score: number;
  next_step_id: string | null;
  finished: boolean;
}

export interface ProgressModule {
  id: number;
  module: string;
  completion_pct: number;
  points: number;
  updated_at: string;
}

export interface ProgressSummary {
  user_id: number;
  full_name: string;
  total_points: number;
  overall_completion_pct: number;
  modules: ProgressModule[];
}

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  xp_in_level: number;
  xp_to_next: number;
  progress_pct: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface Gamification {
  level: LevelInfo;
  badges: Badge[];
}

export interface HealthInfo {
  status: string;
  llm_mode: "live" | "mock";
  ispring_mode: "live" | "mock";
  rag_chunks: number;
  version: string;
}

export const api = {
  health: async () => {
    const res = await fetch("/health");
    if (!res.ok) throw new Error("health failed");
    return res.json() as Promise<HealthInfo>;
  },
  listUsers: () => request<User[]>("/users"),
  ask: (user_id: number, message: string) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ user_id, message }),
    }),
  history: (user_id: number) => request<ChatHistoryItem[]>(`/chat/history/${user_id}`),
  scenarios: () => request<ScenarioSummary[]>("/simulator/scenarios"),
  scenario: (id: string) => request<Scenario>(`/simulator/scenarios/${id}`),
  startSession: (user_id: number, scenario_id: string) =>
    request<SimSession>("/simulator/sessions", {
      method: "POST",
      body: JSON.stringify({ user_id, scenario_id }),
    }),
  answer: (session_id: number, step_id: string, option_id: string) =>
    request<AnswerResponse>("/simulator/answer", {
      method: "POST",
      body: JSON.stringify({ session_id, step_id, option_id }),
    }),
  progress: (user_id: number) => request<ProgressSummary>(`/progress/${user_id}`),
  badges: (user_id: number) => request<Gamification>(`/badges/${user_id}`),
  syncIspring: (user_id: number) =>
    request<{ mode: string; sent: object }>("/ispring/sync", {
      method: "POST",
      body: JSON.stringify({ user_id }),
    }),
};

/** Стрим SSE-чата. Возвращает функцию отмены. */
export interface StreamHandlers {
  onSources?: (sources: Source[]) => void;
  onChunk?: (text: string) => void;
  onDone?: (ms: number) => void;
  onError?: (msg: string) => void;
}

export function streamChat(
  user_id: number,
  message: string,
  handlers: StreamHandlers,
): () => void {
  const controller = new AbortController();
  (async () => {
    try {
      const res = await fetch(`${BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ user_id, message }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        handlers.onError?.(`HTTP ${res.status}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "sources") handlers.onSources?.(ev.sources);
            else if (ev.type === "chunk") handlers.onChunk?.(ev.text);
            else if (ev.type === "done") handlers.onDone?.(ev.ms);
            else if (ev.type === "error") handlers.onError?.(ev.message);
          } catch {
            /* skip malformed */
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") handlers.onError?.(e.message ?? String(e));
    }
  })();
  return () => controller.abort();
}
