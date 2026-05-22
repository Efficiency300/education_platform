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
}

export interface ScenarioStep {
  id: string;
  prompt: string;
  options: { id: string; text: string; correct: boolean; feedback: string; points: number }[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
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

export const api = {
  health: async () => {
    const res = await fetch("/health");
    if (!res.ok) throw new Error("health failed");
    return res.json() as Promise<{ status: string; llm_mode: string; ispring_mode: string; rag_chunks: number }>;
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
  syncIspring: (user_id: number) =>
    request<{ mode: string; sent: object }>("/ispring/sync", {
      method: "POST",
      body: JSON.stringify({ user_id }),
    }),
};
