import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useAuth } from "./AuthContext";
import { useLocale } from "./LocaleContext";

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
  const { user } = useAuth();
  const { locale } = useLocale();
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [gamification, setGamification] = useState<Gamification | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);
  const prevLevel = useRef<number | null>(null);
  const prevBadges = useRef<Set<string>>(new Set());
  const seededFor = useRef<number | null>(null);

  const notify = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    if (!user || user.role !== "user") return;
    const [p, g, c, a] = await Promise.all([
      api.progress(user.id).catch(() => null),
      api.badges(user.id).catch(() => null),
      api.courses(user.id, locale).catch(() => []),
      api.activity(user.id, 30).catch(() => []),
    ]);
    if (p) setProgress(p);
    if (g) {
      if (prevLevel.current !== null && g.level.level > prevLevel.current) {
        notify("ok", `Новый уровень: ${g.level.title} · уровень ${g.level.level}`);
      }
      prevLevel.current = g.level.level;
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
  }, [user, notify, locale]);

  // bootstrap health + scenarios (refetch on locale change so the picker flips
  // languages without needing a page reload).
  useEffect(() => {
    (async () => {
      const [h, scns] = await Promise.all([
        api.health().catch(() => null),
        api.scenarios(locale).catch(() => []),
      ]);
      setHealth(h);
      setScenarios(scns);
    })();
  }, [locale]);

  // Refresh courses too when locale flips.
  useEffect(() => {
    if (!user || user.role !== "user") return;
    api.courses(user.id, locale).then(setCourses).catch(() => {});
  }, [locale, user]);

  // подтянуть прогресс при логине обычного пользователя
  useEffect(() => {
    if (!user) {
      setProgress(null);
      setGamification(null);
      setCourses([]);
      setActivity([]);
      prevLevel.current = null;
      prevBadges.current = new Set();
      seededFor.current = null;
      return;
    }
    if (user.role !== "user") return;
    if (seededFor.current === user.id) return;
    seededFor.current = user.id;
    setLoading(true);
    api
      .badges(user.id)
      .then((g) => {
        if (g) {
          prevLevel.current = g.level.level;
          prevBadges.current = new Set(g.badges.filter((b) => b.earned).map((b) => b.id));
          setGamification(g);
        }
      })
      .catch(() => null)
      .finally(() => {
        refresh().finally(() => setLoading(false));
      });
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
