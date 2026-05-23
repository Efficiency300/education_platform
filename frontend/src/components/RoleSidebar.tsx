import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessagesSquare,
  Gamepad2,
  TrendingUp,
  Moon,
  Sun,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Users,
  Trophy,
  PieChart,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import { useTheme } from "../theme";
import { useAuth } from "../state/AuthContext";
import { useProgress } from "../state/ProgressContext";

type NavItem = { to: string; label: string; icon: any; end?: boolean };

const NAV_BY_ROLE: Record<"user" | "hr" | "admin", NavItem[]> = {
  user: [
    { to: "/", label: "Главная", icon: LayoutDashboard, end: true },
    { to: "/courses", label: "Курсы", icon: BookOpen },
    { to: "/simulator", label: "Симулятор", icon: Gamepad2 },
    { to: "/chat", label: "AI-ассистент", icon: MessagesSquare },
    { to: "/progress", label: "Прогресс", icon: TrendingUp },
  ],
  hr: [
    { to: "/hr", label: "Обзор", icon: LayoutDashboard, end: true },
    { to: "/hr/team", label: "Команда", icon: Users },
    { to: "/hr/leaderboard", label: "Лидерборд", icon: Trophy },
    { to: "/hr/analytics", label: "Аналитика", icon: PieChart },
  ],
  admin: [
    { to: "/admin", label: "Обзор", icon: LayoutDashboard, end: true },
    { to: "/admin/courses", label: "Курсы", icon: BookOpen },
    { to: "/admin/regulations", label: "Регламенты", icon: FileText },
    { to: "/admin/users", label: "Пользователи", icon: Users },
    { to: "/admin/settings", label: "Система", icon: Settings },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  user: "Сотрудник",
  hr: "HR-менеджер",
  admin: "Администратор",
};

export default function RoleSidebar() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { health, gamification } = useProgress();
  if (!user) return null;
  const nav = NAV_BY_ROLE[user.role] ?? NAV_BY_ROLE.user;

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r border-navy-900/8 bg-white/40 px-4 py-6 backdrop-blur-2xl dark:border-white/8 dark:bg-navy-900/40 md:flex">
      <div className="px-2 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 text-gold-500 shadow-soft dark:from-gold-500 dark:to-gold-700 dark:text-navy-900">
            <Sparkles size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-display text-base font-semibold leading-none">AI-Mentor</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">
              Turonbank · {ROLE_LABEL[user.role] ?? user.role}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-navy-900 text-white shadow-soft dark:bg-white dark:text-navy-900"
                  : "text-navy-900/70 hover:bg-navy-900/5 hover:text-navy-900 dark:text-white/70 dark:hover:bg-white/8 dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={2.1} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute right-3 h-1.5 w-1.5 rounded-full bg-gold-500"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        {user.role === "user" && gamification && (
          <div className="rounded-2xl border border-gold-500/25 bg-gradient-to-br from-gold-500/10 to-transparent px-3 py-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-navy-900/60 dark:text-white/60">
              <span>Уровень {gamification.level.level}</span>
              <span>{gamification.level.xp} XP</span>
            </div>
            <div className="mt-1 font-display text-sm font-semibold">{gamification.level.title}</div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all"
                style={{ width: `${gamification.level.progress_pct}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={toggle}
          className="flex items-center gap-2.5 rounded-xl border border-navy-900/8 bg-white/50 px-3 py-2 text-xs font-medium text-navy-900/70 transition hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <div className="rounded-2xl border border-navy-900/8 bg-white/50 p-3 dark:border-white/8 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-xs font-bold text-navy-900">
              {user.full_name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{user.full_name}</div>
              <div className="truncate text-[10px] text-navy-900/50 dark:text-white/50">
                {user.email}
              </div>
            </div>
          </div>
          {health && user.role !== "user" && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-navy-900/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-navy-900/60 dark:bg-white/10 dark:text-white/60">
                <span className={`h-1.5 w-1.5 rounded-full ${health.llm_mode === "live" ? "bg-emerald-500" : "bg-gold-500"}`} />
                LLM {health.llm_mode}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-navy-900/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-navy-900/60 dark:bg-white/10 dark:text-white/60">
                <ShieldCheck size={9} /> RAG {health.rag_chunks}
              </span>
            </div>
          )}
          <button
            onClick={logout}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-navy-900/10 bg-white/40 px-3 py-1.5 text-[11px] font-medium text-navy-900/70 transition hover:bg-rose-500/10 hover:text-rose-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:text-rose-300"
          >
            <LogOut size={12} /> Выйти
          </button>
        </div>
      </div>
    </aside>
  );
}
