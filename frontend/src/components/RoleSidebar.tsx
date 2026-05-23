import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessagesSquare,
  Gamepad2,
  TrendingUp,
  BookOpen,
  Users,
  Trophy,
  Settings,
  FileText,
  UsersRound,
  Compass,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useProgress } from "../state/ProgressContext";
import { useT } from "../state/LocaleContext";
import LanguageSwitcher from "./LanguageSwitcher";

type NavItem = { to: string; label: string; icon: any; end?: boolean };

export default function RoleSidebar() {
  const { user } = useAuth();
  const { gamification, progress } = useProgress();
  const t = useT();
  if (!user) return null;

  const navByRole: Record<"user" | "hr" | "admin", NavItem[]> = {
    user: [
      { to: "/", label: t("nav.home"), icon: LayoutDashboard, end: true },
      { to: "/courses", label: t("nav.courses"), icon: BookOpen },
      { to: "/simulator", label: t("nav.simulator"), icon: Gamepad2 },
      { to: "/chat", label: t("nav.assistant"), icon: MessagesSquare },
      { to: "/teams", label: t("nav.teamChat"), icon: UsersRound },
      { to: "/progress", label: t("nav.progress"), icon: TrendingUp },
      { to: "/profile", label: t("nav.profile"), icon: UserCircle2 },
    ],
    hr: [
      { to: "/hr", label: t("hr.dashboard"), icon: LayoutDashboard, end: true },
      { to: "/hr/team", label: t("nav.team"), icon: Users },
      // HR review all team group chats (not the AI assistant chats).
      { to: "/teams", label: t("nav.teamChat"), icon: UsersRound },
      { to: "/hr/leaderboard", label: t("nav.leaderboard"), icon: Trophy },
      { to: "/profile", label: t("nav.profile"), icon: UserCircle2 },
    ],
    admin: [
      { to: "/admin", label: t("nav.overview"), icon: LayoutDashboard, end: true },
      { to: "/admin/courses", label: t("nav.courses"), icon: BookOpen },
      { to: "/admin/north-scenarios", label: t("nav.northScenarios"), icon: Compass },
      { to: "/admin/regulations", label: t("nav.knowledge"), icon: FileText },
      { to: "/admin/users", label: t("nav.users"), icon: Users },
      { to: "/teams", label: t("nav.teamChat"), icon: UsersRound },
      { to: "/chat", label: t("nav.assistant"), icon: MessagesSquare },
      { to: "/admin/settings", label: t("nav.settings"), icon: Settings },
      { to: "/profile", label: t("nav.profile"), icon: UserCircle2 },
    ],
  };
  const nav = navByRole[user.role] ?? navByRole.user;

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
      {/* Logo */}
      <div
        className="flex items-center"
        style={{ padding: "20px 16px 18px", borderBottom: "0.5px solid var(--border)" }}
      >
        <NavLink
          to={user.role === "admin" ? "/admin" : user.role === "hr" ? "/hr" : "/"}
          end
          aria-label="KOMPAS"
          style={{ display: "block", cursor: "pointer" }}
        >
          <img
            src="/logo-full.svg"
            alt="KOMPAS"
            style={{ height: 30, width: "auto", display: "block" }}
          />
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: 10 }}>
        <div className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 ${isActive ? "kp-nav-active" : "kp-nav-idle"}`
              }
              style={{
                padding: "9px 11px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 500,
                fontSize: 13,
                transition: "all 0.15s ease",
                fontFamily: "var(--font-kompas)",
              }}
            >
              <item.icon size={16} strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
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
          .kp-nav-active, .kp-nav-active:hover {
            color: #FFFFFF;
            background: var(--brand);
            border: 0.5px solid var(--brand);
          }
          .kp-nav-active svg { color: #FFFFFF; }
        `}</style>
      </nav>

      {/* Progress (employees only) */}
      {user.role === "user" && (
        <div
          style={{
            padding: "14px 16px",
            borderTop: "0.5px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {t("dash.overall")}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--brand)" }}>
              {Math.round(overallPct)}%
            </span>
          </div>
          <div className="mt-2 kp-progress-track">
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

      {/* Footer */}
      <div
        className="flex flex-col gap-2.5"
        style={{
          padding: "12px 16px 16px",
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
