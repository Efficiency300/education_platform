const BASE = "/api";
const TOKEN_KEY = "ai_mentor_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = typeof body?.detail === "string" ? body.detail : JSON.stringify(body);
    } catch {
      detail = await res.text().catch(() => "");
    }
    if (res.status === 401) {
      setToken(null);
    }
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type Role = "user" | "hr" | "admin";

export interface User {
  id: number;
  employee_id: string;
  email: string;
  full_name: string;
  role: Role;
  position: string;
  department: string;
  program: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
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
  kind: "simulator" | "course";
  completion_pct: number;
  points: number;
  updated_at: string;
}

export interface ProgressBreakdown {
  simulator_done: number;
  simulator_total: number;
  courses_done: number;
  courses_total: number;
}

export interface ProgressSummary {
  user_id: number;
  full_name: string;
  total_points: number;
  overall_completion_pct: number;
  breakdown: ProgressBreakdown;
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

export interface CourseSummary {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
  target_scenario_id: string;
  tags: string[];
  lessons_count: number;
  quiz_count: number;
  lessons_completed: number;
  completed: boolean;
  quiz_score: number;
  quiz_max: number;
}

export interface CourseLesson {
  slug: string;
  title: string;
  summary: string;
  duration_min: number;
  body_md: string;
  completed: boolean;
}

export interface CourseQuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
}

export interface CourseDetail extends Omit<CourseSummary, "lessons_completed" | "lessons_count" | "quiz_count"> {
  lessons: CourseLesson[];
  quiz: CourseQuizQuestion[];
  quiz_attempts: number;
}

export interface LessonCompleteResponse {
  course_slug: string;
  lesson_slug: string;
  completed_count: number;
  total_count: number;
  points_awarded: number;
}

export interface QuizQuestionResult {
  question_id: string;
  correct: boolean;
  expected_option_id: string | null;
  explanation: string;
}

export interface QuizSubmitResponse {
  course_slug: string;
  score: number;
  max_score: number;
  passed: boolean;
  course_completed: boolean;
  points_awarded: number;
  next_scenario_id: string;
  results: QuizQuestionResult[];
}

export interface ActivityItem {
  id: number;
  kind: string;
  title: string;
  detail: string;
  points: number;
  created_at: string;
}

// ---------- HR ----------
export interface TeamMember {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  role: Role;
  position: string;
  department: string;
  program: string;
  total_xp: number;
  level: number;
  overall_completion_pct: number;
  courses_done: number;
  courses_total: number;
  scenarios_done: number;
  scenarios_total: number;
  last_activity_at: string | null;
  status: "not_started" | "onboarding" | "progressing" | "ready" | "excellent";
}

export interface CourseSnapshot {
  slug: string;
  title: string;
  completed: boolean;
  lessons_completed: number;
  lessons_total: number;
  quiz_score: number;
  quiz_max: number;
  quiz_attempts: number;
}

export interface ScenarioSnapshot {
  scenario_id: string;
  title: string;
  best_pct: number;
  best_score: number;
  attempts: number;
}

export interface ActivityBrief {
  kind: string;
  title: string;
  detail: string;
  points: number;
  created_at: string;
}

export interface AICompetency {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  mode: "live" | "mock";
}

export interface HRUserProfile {
  user: TeamMember;
  courses: CourseSnapshot[];
  scenarios: ScenarioSnapshot[];
  activity: ActivityBrief[];
  chat_questions: number;
  competency: AICompetency;
}

export interface LeaderboardItem {
  rank: number;
  user_id: number;
  full_name: string;
  department: string;
  total_xp: number;
  level: number;
  courses_done: number;
  scenarios_done: number;
  last_activity_at: string | null;
}

export interface AnalyticsBucket {
  key: string;
  label: string;
  value: number;
}

export interface HRAnalytics {
  total_users: number;
  active_last_7d: number;
  avg_completion_pct: number;
  avg_xp: number;
  course_completion: AnalyticsBucket[];
  scenario_completion: AnalyticsBucket[];
  xp_distribution: AnalyticsBucket[];
  activity_last_14d: AnalyticsBucket[];
}

// ---------- Admin ----------
export interface AdminCourse {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
  target_scenario_id: string;
  tags: string[];
  lessons_count: number;
  quiz_count: number;
  created_at: string;
  created_by_name: string | null;
  source: "built_in" | "custom";
}

export interface AdminCourseCreate {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  difficulty?: "easy" | "medium" | "hard";
  estimated_minutes?: number;
  target_scenario_id?: string;
  tags?: string[];
  lessons: {
    slug: string;
    title: string;
    summary: string;
    duration_min: number;
    body_md: string;
  }[];
  quiz: {
    id: string;
    question: string;
    options: { id: string; text: string; correct: boolean }[];
    explanation?: string;
  }[];
}

export interface AdminRegulation {
  filename: string;
  size_bytes: number;
  modified_at: string;
}

export interface AdminUser {
  id: number;
  employee_id: string;
  email: string;
  full_name: string;
  role: Role;
  position: string;
  department: string;
  program: string;
  created_at: string;
}

export interface AdminStats {
  users_total: number;
  users_by_role: Record<string, number>;
  courses_built_in: number;
  courses_custom: number;
  regulations_count: number;
  rag_chunks: number;
  chat_messages_total: number;
  activity_events_total: number;
  completed_courses_total: number;
  completed_scenarios_total: number;
  llm_mode: "live" | "mock";
  ispring_mode: "live" | "mock";
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
  courses: (user_id?: number) =>
    request<CourseSummary[]>(
      `/courses${user_id ? `?user_id=${user_id}` : ""}`,
    ),
  course: (slug: string, user_id?: number) =>
    request<CourseDetail>(
      `/courses/${slug}${user_id ? `?user_id=${user_id}` : ""}`,
    ),
  completeLesson: (user_id: number, course_slug: string, lesson_slug: string) =>
    request<LessonCompleteResponse>("/courses/lessons/complete", {
      method: "POST",
      body: JSON.stringify({ user_id, course_slug, lesson_slug }),
    }),
  submitQuiz: (user_id: number, course_slug: string, answers: Record<string, string>) =>
    request<QuizSubmitResponse>("/courses/quiz/submit", {
      method: "POST",
      body: JSON.stringify({ user_id, course_slug, answers }),
    }),
  activity: (user_id: number, limit = 20) =>
    request<ActivityItem[]>(`/activity/${user_id}?limit=${limit}`),

  // auth
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    position?: string;
    department?: string;
    program?: string;
  }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request<User>("/auth/me"),

  // HR
  hrTeam: () => request<TeamMember[]>("/hr/team"),
  hrUserProfile: (user_id: number) => request<HRUserProfile>(`/hr/users/${user_id}`),
  hrLeaderboard: (limit = 10) => request<LeaderboardItem[]>(`/hr/leaderboard?limit=${limit}`),
  hrAnalytics: () => request<HRAnalytics>("/hr/analytics"),

  // Admin
  adminCourses: () => request<AdminCourse[]>("/admin/courses"),
  adminCreateCourse: (payload: AdminCourseCreate) =>
    request<AdminCourse>("/admin/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminDeleteCourse: (id: number) =>
    request<{ deleted: boolean }>(`/admin/courses/${id}`, { method: "DELETE" }),
  adminRegulations: () => request<AdminRegulation[]>("/admin/regulations"),
  adminUploadRegulation: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${BASE}/admin/regulations/upload`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: fd,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new ApiError(res.status, `${res.status}`, t);
    }
    return res.json() as Promise<{ filename: string; rag_chunks: number }>;
  },
  adminDeleteRegulation: (filename: string) =>
    request<{ deleted: boolean; rag_chunks: number }>(
      `/admin/regulations/${encodeURIComponent(filename)}`,
      { method: "DELETE" },
    ),
  adminListUsers: () => request<AdminUser[]>("/admin/users"),
  adminUpdateRole: (user_id: number, role: Role) =>
    request<{ id: number; role: Role }>(`/admin/users/${user_id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  adminStats: () => request<AdminStats>("/admin/stats"),
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
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...authHeaders(),
        },
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
