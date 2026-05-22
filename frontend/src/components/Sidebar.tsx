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
} from "lucide-react";
import { useTheme } from "../theme";
import { HealthInfo, User } from "../api";

const NAV = [
  { to: "/", label: "Главная", icon: LayoutDashboard, end: true },
  { to: "/chat", label: "AI-ассистент", icon: MessagesSquare },
  { to: "/simulator", label: "Симулятор", icon: Gamepad2 },
  { to: "/progress", label: "Прогресс", icon: TrendingUp },
];

export default function Sidebar({ user, health }: { user: User; health: HealthInfo | null }) {
  const { theme, toggle } = useTheme();
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
              Turonbank
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
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
                {user.role === "intern" ? "Стажёр" : "Сотрудник"} · {user.department || "—"}
              </div>
            </div>
          </div>
          {health && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-navy-900/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-navy-900/60 dark:bg-white/10 dark:text-white/60">
                <span className={`h-1.5 w-1.5 rounded-full ${health.llm_mode === "live" ? "bg-emerald-500" : "bg-gold-500"}`} />
                LLM {health.llm_mode}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-navy-900/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-navy-900/60 dark:bg-white/10 dark:text-white/60">
                RAG {health.rag_chunks}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
