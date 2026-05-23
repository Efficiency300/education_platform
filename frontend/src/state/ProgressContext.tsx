import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  ActivityItem,
  CourseSummary,
  Gamification,
  HealthInfo,
  ProgressSummary,
  ScenarioSummary,
  User,
} from "../api";

interface Toast {
  id: number;
  kind: "ok" | "info" | "warn" | "err";
  text: string;
}

interface Ctx {
  user: User | null;
  health: HealthInfo | null;
  progress: ProgressSummary | null;
  gamification: Gamification | null;
  scenarios: ScenarioSummary[];
  courses: CourseSummary[];
  activity: ActivityItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  notify: (kind: Toast["kind"], text: string) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
}

const ProgressContext = createContext<Ctx | null>(null);

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [gamification, setGamification] = useState<Gamification | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);
  const prevLevel = useRef<number | null>(null);
  const prevBadges = useRef<Set<string>>(new Set());

  const notify = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [p, g, c, a] = await Promise.all([
      api.progress(user.id).catch(() => null),
      api.badges(user.id).catch(() => null),
      api.courses(user.id).catch(() => []),
      api.activity(user.id, 30).catch(() => []),
    ]);
    if (p) setProgress(p);
    if (g) {
      // detect level-up
      if (prevLevel.current !== null && g.level.level > prevLevel.current) {
        notify("ok", `Новый уровень: ${g.level.title} · уровень ${g.level.level}`);
      }
      prevLevel.current = g.level.level;
      // detect newly earned badges
      const earnedNow = new Set(g.badges.filter((b) => b.earned).map((b) => b.id));
      if (prevBadges.current.size > 0) {
        for (const id of earnedNow) {
          if (!prevBadges.current.has(id)) {
            const badge = g.badges.find((b) => b.id === id);
            if (badge) notify("ok", `Бейдж получен: ${badge.title}`);
          }
        }
      }
      prevBadges.current = earnedNow;
      setGamification(g);
    }
    setCourses(c);
    setActivity(a);
  }, [user, notify]);

  // initial bootstrap
  useEffect(() => {
    (async () => {
      try {
        const [users, h, scns] = await Promise.all([
          api.listUsers(),
          api.health().catch(() => null),
          api.scenarios().catch(() => []),
        ]);
        setUser(users[0] ?? null);
        setHealth(h);
        setScenarios(scns);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // when user is set — pull everything else
  useEffect(() => {
    if (user) {
      // seed baseline so the first refresh doesn't spam toasts
      Promise.all([api.badges(user.id).catch(() => null)]).then(([g]) => {
        if (g) {
          prevLevel.current = g.level.level;
          prevBadges.current = new Set(g.badges.filter((b) => b.earned).map((b) => b.id));
          setGamification(g);
        }
        refresh();
      });
    }
  }, [user, refresh]);

  const value = useMemo<Ctx>(
    () => ({
      user,
      health,
      progress,
      gamification,
      scenarios,
      courses,
      activity,
      loading,
      refresh,
      notify,
      toasts,
      dismissToast,
    }),
    [user, health, progress, gamification, scenarios, courses, activity, loading, refresh, notify, toasts, dismissToast],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
