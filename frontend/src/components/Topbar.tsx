import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useT } from "../state/LocaleContext";

function capitalize(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function usePageTitle(): { title: string; breadcrumb?: string } {
  const t = useT();
  const { pathname } = useLocation();
  const seg = pathname.split("/").filter(Boolean);

  if (seg.length === 0) return { title: t("nav.home") };

  if (seg[0] === "hr") {
    if (seg[1] === "team") return { title: t("nav.team"), breadcrumb: t("hr.dashboard") };
    if (seg[1] === "leaderboard") return { title: t("nav.leaderboard"), breadcrumb: t("hr.dashboard") };
    if (seg[1] === "users") return { title: t("hr.profile.kicker"), breadcrumb: t("hr.dashboard") };
    return { title: t("nav.overview"), breadcrumb: t("hr.dashboard") };
  }
  if (seg[0] === "admin") {
    if (seg[1] === "courses") return { title: t("nav.courses"), breadcrumb: t("admin.kicker") };
    if (seg[1] === "regulations") return { title: t("nav.knowledge"), breadcrumb: t("admin.kicker") };
    if (seg[1] === "users") return { title: t("nav.users"), breadcrumb: t("admin.kicker") };
    if (seg[1] === "settings") return { title: t("nav.settings"), breadcrumb: t("admin.kicker") };
    return { title: t("nav.overview"), breadcrumb: t("admin.kicker") };
  }
  if (seg[0] === "courses") return { title: t("nav.courses") };
  if (seg[0] === "simulator") return { title: t("nav.simulator") };
  if (seg[0] === "chat") return { title: t("nav.assistant") };
  if (seg[0] === "progress") return { title: t("nav.progress") };
  if (seg[0] === "teams") return { title: t("nav.teams") };
  if (seg[0] === "profile") return { title: t("nav.profile") };
  return { title: t("nav.home") };
}

export default function Topbar() {
  const { user } = useAuth();
  const t = useT();
  const { title, breadcrumb } = usePageTitle();
  if (!user) return null;

  const firstInitial = user.full_name.trim().slice(0, 1).toUpperCase();
  const positionLabel = user.position ? t(`position.${user.position}`) : "";
  const deptLabel = (user.department || "").trim();
  const subline = [positionLabel, deptLabel].filter(Boolean).map(capitalize).join(" · ");

  return (
    <header
      className="sticky top-0 z-20 hidden items-center justify-between md:flex"
      style={{
        height: 52,
        padding: "0 24px",
        background: "var(--bg-elevated)",
        borderBottom: "0.5px solid var(--border)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {breadcrumb && (
          <>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                fontWeight: 500,
              }}
            >
              {breadcrumb}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>/</span>
          </>
        )}
        <h1
          className="truncate"
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h1>
      </div>

      <Link
        to="/profile"
        aria-label="Profile"
        className="flex items-center gap-2 kp-topbar-profile"
        style={{
          padding: "4px 12px 4px 4px",
          borderRadius: 99,
          background: "var(--bg-card)",
          border: "0.5px solid var(--border)",
          color: "var(--text-primary)",
          textDecoration: "none",
          transition: "all 0.15s ease",
        }}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <span
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--brand)",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {firstInitial}
          </span>
        )}
        <div className="flex flex-col" style={{ lineHeight: 1.1 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{user.full_name.split(" ")[0]}</span>
          {subline && (
            <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{subline}</span>
          )}
        </div>
      </Link>
      <style>{`
        .kp-topbar-profile:hover { border-color: var(--border-emphasis); background: var(--bg-hover); }
      `}</style>
    </header>
  );
}
