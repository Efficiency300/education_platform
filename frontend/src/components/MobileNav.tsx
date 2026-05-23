import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessagesSquare,
  Gamepad2,
  TrendingUp,
  BookOpen,
  Users,
  Trophy,
  PieChart,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useT } from "../state/LocaleContext";
import { LanguageInline } from "./LanguageSwitcher";

export default function MobileNav() {
  const { user, logout } = useAuth();
  const t = useT();
  if (!user) return null;

  const navUser = [
    { to: "/", label: t("nav.home"), icon: LayoutDashboard, end: true },
    { to: "/courses", label: t("nav.courses"), icon: BookOpen },
    { to: "/simulator", label: t("nav.simulator"), icon: Gamepad2 },
    { to: "/chat", label: t("nav.assistant"), icon: MessagesSquare },
    { to: "/progress", label: t("nav.progress"), icon: TrendingUp },
  ];
  const navHR = [
    { to: "/hr", label: t("nav.overview"), icon: LayoutDashboard, end: true },
    { to: "/hr/team", label: t("nav.team"), icon: Users },
    { to: "/hr/leaderboard", label: t("nav.leaderboard"), icon: Trophy },
    { to: "/hr/analytics", label: t("nav.analytics"), icon: PieChart },
  ];
  const navAdmin = [
    { to: "/admin", label: t("nav.overview"), icon: LayoutDashboard, end: true },
    { to: "/admin/courses", label: t("nav.courses"), icon: BookOpen },
    { to: "/admin/regulations", label: t("nav.regulations"), icon: FileText },
    { to: "/admin/users", label: t("nav.users"), icon: Users },
    { to: "/admin/settings", label: t("nav.settings"), icon: Settings },
  ];
  const nav = user.role === "admin" ? navAdmin : user.role === "hr" ? navHR : navUser;

  return (
    <>
      <div
        className="sticky top-0 z-30 flex items-center justify-between md:hidden"
        style={{
          padding: "10px 16px",
          background: "var(--bg-elevated)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <img src="/logo-icon.svg" alt="KOMPAS" style={{ width: 22, height: 22 }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            KOMPAS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageInline />
          <button
            onClick={logout}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              border: "0.5px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            aria-label={t("profile.logout")}
            title={t("profile.logout")}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <nav
        className="fixed z-30 flex items-center justify-around gap-1 md:hidden"
        style={{
          left: 12,
          right: 12,
          bottom: 12,
          padding: "6px",
          background: "var(--bg-elevated)",
          border: "0.5px solid var(--border-emphasis)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 ${isActive ? "kp-mob-active" : "kp-mob-idle"}`
            }
            style={{
              padding: "8px 4px",
              borderRadius: "var(--radius-sm)",
              fontSize: 10,
              fontWeight: 500,
              transition: "all 0.15s ease",
            }}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
        <style>{`
          .kp-mob-idle { color: var(--text-tertiary); background: transparent; }
          .kp-mob-active { color: var(--brand); background: var(--brand-subtle); border: 0.5px solid var(--border-brand); }
        `}</style>
      </nav>
    </>
  );
}
