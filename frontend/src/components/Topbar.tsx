import { useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useProgress } from "../state/ProgressContext";
import { useT } from "../state/LocaleContext";

// Maps the first path segment to a friendly page title.
function usePageTitle(): { title: string; breadcrumb?: string } {
  const t = useT();
  const { pathname } = useLocation();
  const seg = pathname.split("/").filter(Boolean);

  if (seg.length === 0) return { title: t("nav.home") };

  if (seg[0] === "hr") {
    if (seg[1] === "team") return { title: t("nav.team"), breadcrumb: t("hr.kicker") };
    if (seg[1] === "leaderboard") return { title: t("nav.leaderboard"), breadcrumb: t("hr.kicker") };
    if (seg[1] === "analytics") return { title: t("nav.analytics"), breadcrumb: t("hr.kicker") };
    if (seg[1] === "users") return { title: t("hr.profile.kicker"), breadcrumb: t("hr.kicker") };
    return { title: t("nav.overview"), breadcrumb: t("hr.kicker") };
  }
  if (seg[0] === "admin") {
    if (seg[1] === "courses") return { title: t("nav.courses"), breadcrumb: t("admin.kicker") };
    if (seg[1] === "regulations") return { title: t("nav.regulations"), breadcrumb: t("admin.kicker") };
    if (seg[1] === "users") return { title: t("nav.users"), breadcrumb: t("admin.kicker") };
    if (seg[1] === "settings") return { title: t("nav.settings"), breadcrumb: t("admin.kicker") };
    return { title: t("nav.overview"), breadcrumb: t("admin.kicker") };
  }
  if (seg[0] === "courses") return { title: t("nav.courses") };
  if (seg[0] === "simulator") return { title: t("nav.simulator") };
  if (seg[0] === "chat") return { title: t("nav.assistant") };
  if (seg[0] === "progress") return { title: t("nav.progress") };
  return { title: t("nav.home") };
}

export default function Topbar() {
  const { user } = useAuth();
  const { health } = useProgress();
  const t = useT();
  const { title, breadcrumb } = usePageTitle();
  if (!user) return null;

  const canSearch = user.role === "hr" || user.role === "admin";

  return (
    <header
      className="sticky top-0 z-20 hidden items-center justify-between md:flex"
      style={{
        height: 52,
        padding: "0 24px",
        background: "var(--bg-elevated)",
        borderBottom: "0.5px solid var(--border)",
        backdropFilter: "saturate(140%)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {breadcrumb && (
          <>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
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

      {canSearch && (
        <div
          className="hidden lg:flex items-center gap-2"
          style={{
            background: "var(--bg-input)",
            border: "0.5px solid var(--border-emphasis)",
            borderRadius: "var(--radius-md)",
            padding: "6px 12px",
            minWidth: 260,
            maxWidth: 360,
            flex: "0 1 320px",
          }}
        >
          <Search size={14} style={{ color: "var(--text-tertiary)" }} />
          <input
            placeholder={t("common.search")}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 12,
              color: "var(--text-primary)",
              width: "100%",
              fontFamily: "var(--font-kompas)",
            }}
            readOnly
          />
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <div className="ai-chip" title="Powered by Gemini">
          <span className="ai-dot">G</span>
          Gemini
        </div>
        <button
          aria-label="Notifications"
          className="flex items-center justify-center kp-icon-btn"
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-md)",
            background: "var(--bg-card)",
            border: "0.5px solid var(--border)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Bell size={14} />
        </button>
        {health && (
          <span
            className="hidden lg:inline-flex items-center gap-1"
            style={{
              fontSize: 10,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              padding: "4px 8px",
              borderRadius: 99,
              background: "var(--bg-card)",
              border: "0.5px solid var(--border)",
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
        )}
      </div>
      <style>{`
        .kp-icon-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-emphasis);
          background: var(--bg-hover);
        }
      `}</style>
    </header>
  );
}
