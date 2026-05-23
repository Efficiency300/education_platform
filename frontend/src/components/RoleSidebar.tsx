import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessagesSquare,
  Gamepad2,
  TrendingUp,
  BookOpen,
  ShieldCheck,
  Users,
  Trophy,
  PieChart,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useProgress } from "../state/ProgressContext";
import { useT } from "../state/LocaleContext";
import LanguageSwitcher from "./LanguageSwitcher";

type NavItem = { to: string; label: string; icon: any; end?: boolean };

export default function RoleSidebar() {
  const { user, logout } = useAuth();
  const { health, gamification, progress } = useProgress();
  const t = useT();
  if (!user) return null;

  const navByRole: Record<"user" | "hr" | "admin", { label: string; items: NavItem[] }[]> = {
    user: [
      {
        label: t("common.system"),
        items: [
          { to: "/", label: t("nav.home"), icon: LayoutDashboard, end: true },
          { to: "/courses", label: t("nav.courses"), icon: BookOpen },
          { to: "/simulator", label: t("nav.simulator"), icon: Gamepad2 },
          { to: "/chat", label: t("nav.assistant"), icon: MessagesSquare },
          { to: "/progress", label: t("nav.progress"), icon: TrendingUp },
        ],
      },
    ],
    hr: [
      {
        label: t("common.system"),
        items: [
          { to: "/hr", label: t("nav.overview"), icon: LayoutDashboard, end: true },
          { to: "/hr/team", label: t("nav.team"), icon: Users },
          { to: "/hr/leaderboard", label: t("nav.leaderboard"), icon: Trophy },
          { to: "/hr/analytics", label: t("nav.analytics"), icon: PieChart },
        ],
      },
    ],
    admin: [
      {
        label: t("common.system"),
        items: [
          { to: "/admin", label: t("nav.overview"), icon: LayoutDashboard, end: true },
          { to: "/admin/courses", label: t("nav.courses"), icon: BookOpen },
          { to: "/admin/regulations", label: t("nav.regulations"), icon: FileText },
          { to: "/admin/users", label: t("nav.users"), icon: Users },
          { to: "/admin/settings", label: t("nav.settings"), icon: Settings },
        ],
      },
    ],
  };
  const sections = navByRole[user.role] ?? navByRole.user;
  const roleLabel =
    user.role === "admin" ? t("role.admin") : user.role === "hr" ? t("role.hr") : t("role.user");

  const overallPct = progress?.overall_completion_pct ?? gamification?.level.progress_pct ?? 0;

  return (
    <aside
      className="sticky top-0 hidden h-screen shrink-0 flex-col md:flex"
      style={{
        width: "220px",
        background: "var(--bg-elevated)",
        borderRight: "0.5px solid var(--border)",
      }}
    >
      {/* ── Logo block ── */}
      <div
        className="flex items-center gap-2.5"
        style={{ padding: "16px 14px", borderBottom: "0.5px solid var(--border)" }}
      >
        <img src="/logo-icon.svg" alt="KOMPAS" style={{ width: 28, height: 28 }} />
        <div className="min-w-0">
          <div
            className="leading-none"
            style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}
          >
            KOMPAS
          </div>
          <div
            className="mt-1"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            {roleLabel}
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: 8 }}>
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-4">
            <div
              className="px-2 pb-2"
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                fontWeight: 500,
              }}
            >
              {section.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 text-sm transition-all`
                    + ` ${isActive ? "kp-nav-active" : "kp-nav-idle"}`
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 500,
                    fontSize: 13,
                    transitionDuration: "0.15s",
                  }}
                >
                  <item.icon size={16} strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        <style>{`
          .kp-nav-idle {
            color: var(--text-secondary);
            background: transparent;
            border: 0.5px solid transparent;
          }
          .kp-nav-idle:hover {
            color: var(--text-primary);
            background: var(--bg-hover);
          }
          .kp-nav-active {
            color: var(--brand);
            background: var(--brand-subtle);
            border: 0.5px solid var(--border-brand);
          }
        `}</style>
      </nav>

      {/* ── Progress block ── */}
      {user.role === "user" && (
        <div
          style={{
            padding: "12px 14px",
            borderTop: "0.5px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {t("dash.overall")}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--brand)" }}>
              {Math.round(overallPct)}%
            </span>
          </div>
          <div className="mt-1.5 kp-progress-track">
            <div className="kp-progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
          {gamification && (
            <div
              className="mt-2"
              style={{ fontSize: 11, color: "var(--text-tertiary)" }}
            >
              {t("common.level")} {gamification.level.level} · {gamification.level.xp} {t("common.xp")}
            </div>
          )}
        </div>
      )}

      {/* ── Footer block ── */}
      <div
        className="flex flex-col gap-2"
        style={{
          padding: "12px 14px",
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <LanguageSwitcher />

        <div
          className="flex items-center gap-2.5"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: 8,
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--brand)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {user.full_name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}
            >
              {user.full_name}
            </div>
            <div
              className="truncate"
              style={{ fontSize: 10, color: "var(--text-tertiary)" }}
            >
              {user.email}
            </div>
          </div>
          <button
            onClick={logout}
            title={t("profile.logout")}
            aria-label={t("profile.logout")}
            className="kp-logout"
            style={{
              padding: 6,
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut size={13} />
          </button>
          <style>{`
            .kp-logout:hover { color: var(--danger); background: rgba(240,62,62,0.08); }
          `}</style>
        </div>

        {health && user.role !== "user" && (
          <div className="flex flex-wrap gap-1">
            <span
              className="inline-flex items-center gap-1"
              style={{
                fontSize: 9,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                background: "var(--bg-card)",
                border: "0.5px solid var(--border)",
                padding: "2px 6px",
                borderRadius: 99,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: health.llm_mode === "live" ? "var(--success)" : "var(--warning)",
                }}
              />
              LLM {health.llm_mode}
            </span>
            <span
              className="inline-flex items-center gap-1"
              style={{
                fontSize: 9,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                background: "var(--bg-card)",
                border: "0.5px solid var(--border)",
                padding: "2px 6px",
                borderRadius: 99,
              }}
            >
              <ShieldCheck size={9} /> RAG {health.rag_chunks}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
