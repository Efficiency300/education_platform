import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  TrendingUp,
  Trophy,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Gamepad2,
} from "lucide-react";
import { api, HRAnalytics, LeaderboardItem, TeamMember } from "../../api";
import GlassCard from "../../components/GlassCard";
import { HBarChart, VBarChart, Donut } from "../../components/Charts";
import ActivityChart from "../../components/ActivityChart";
import StatusPill from "./StatusPill";
import { useT } from "../../state/LocaleContext";

export default function HRDashboard() {
  const t = useT();
  const [analytics, setAnalytics] = useState<HRAnalytics | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [top, setTop] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    api.hrAnalytics().then(setAnalytics).catch(console.error);
    api.hrTeam().then(setTeam).catch(console.error);
    api.hrLeaderboard(5).then(setTop).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="hero-text mt-2">{t("hr.overview.title")}</h1>
        <p className="mt-2 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
          {t("hr.overview.subtitle")}
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-4">
        <Stat icon={<Users size={18} />} label={t("hr.stat.employees")} value={analytics?.total_users ?? 0} />
        <Stat icon={<Activity size={18} />} label={t("hr.stat.active7d")} value={analytics?.active_last_7d ?? 0} />
        <Stat icon={<TrendingUp size={18} />} label={t("hr.stat.avgProgress")} value={`${analytics?.avg_completion_pct ?? 0}%`} />
        <Stat icon={<Sparkles size={18} />} label={t("hr.stat.avgXP")} value={Math.round(analytics?.avg_xp ?? 0)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 !p-6 min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div
              className="flex items-center gap-2"
              style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}
            >
              <Activity size={18} style={{ color: "var(--brand)" }} /> {t("hr.activity14d")}
            </div>
          </div>
          {analytics ? (
            <ActivityChart data={analytics.activity_last_14d} />
          ) : (
            <Skeleton h={160} />
          )}
        </GlassCard>

        <GlassCard className="!p-6">
          <div className="mb-3 text-center">
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                fontWeight: 500,
              }}
            >
              {t("hr.avgReadiness")}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Donut value={analytics?.avg_completion_pct ?? 0} label={t("hr.readinessLabel")} size={140} />
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="!p-6">
          <div className="mb-5 flex items-center justify-between">
            <div
              className="flex items-center gap-2"
              style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}
            >
              <BookOpen size={18} style={{ color: "var(--brand)" }} /> {t("hr.coursesCompletion")}
            </div>
            <span className="chip">{t("hr.pctEmployees")}</span>
          </div>
          {analytics ? <HBarChart data={analytics.course_completion} max={100} /> : <Skeleton h={180} />}
        </GlassCard>

        <GlassCard className="!p-6">
          <div className="mb-5 flex items-center justify-between">
            <div
              className="flex items-center gap-2"
              style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}
            >
              <Gamepad2 size={18} style={{ color: "var(--brand)" }} /> {t("hr.scenariosCompletion")}
            </div>
            <span className="chip">{t("hr.pctEmployees")}</span>
          </div>
          {analytics ? <HBarChart data={analytics.scenario_completion} max={100} /> : <Skeleton h={180} />}
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <GlassCard className="!p-6 min-w-0">
          <div className="mb-5 flex items-center justify-between">
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              {t("hr.xpDistribution")}
            </div>
            <span className="chip">{t("hr.xpInGroup")}</span>
          </div>
          {analytics ? <VBarChart data={analytics.xp_distribution} height={140} /> : <Skeleton h={160} />}
        </GlassCard>

        <GlassCard className="!p-6">
          <div className="mb-5 flex items-center justify-between">
            <div
              className="flex items-center gap-2"
              style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}
            >
              <Trophy size={18} style={{ color: "var(--brand)" }} /> {t("hr.top5")}
            </div>
            <Link
              to="/hr/leaderboard"
              className="inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("hr.fullLeaderboard")} <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {top.map((m) => (
              <Link
                key={m.user_id}
                to={`/hr/users/${m.user_id}`}
                className="flex items-center justify-between rounded-[10px] kp-row"
                style={{
                  padding: "10px 14px",
                  background: "var(--bg-elevated)",
                  border: "0.5px solid var(--border)",
                  color: "var(--text-primary)",
                  transition: "all 0.15s ease",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--brand)",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {m.rank}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.full_name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                      {m.department || "—"} · L{m.level}
                    </div>
                  </div>
                </div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)" }}
                >
                  {m.total_xp} {t("common.xp")}
                </div>
              </Link>
            ))}
            {top.length === 0 && <Skeleton h={120} />}
          </div>
          <style>{`.kp-row:hover { border-color: var(--border-emphasis); background: var(--bg-hover); }`}</style>
        </GlassCard>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
              {t("hr.teamHeader")}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
              {t("hr.teamHeaderSub")}
            </p>
          </div>
          <Link
            to="/hr/team"
            className="inline-flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("hr.allEmployees")} <ArrowUpRight size={12} />
          </Link>
        </div>
        <GlassCard className="!p-0 overflow-hidden">
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {team.slice(0, 6).map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * i }}
                style={{ borderTop: i === 0 ? "none" : "0.5px solid var(--border)" }}
              >
                <Link
                  to={`/hr/users/${m.id}`}
                  className="grid grid-cols-[1.6fr_1fr_120px_100px_120px] items-center gap-4 transition kp-team-row"
                  style={{
                    padding: "12px 24px",
                    color: "var(--text-primary)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--brand)",
                        color: "#FFFFFF",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {m.full_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{m.full_name}</div>
                      <div className="truncate" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{m.email}</div>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.department || "—"}</div>
                  <div className="text-xs tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {m.overall_completion_pct}% · {m.total_xp} {t("common.xp")}
                  </div>
                  <div className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    {t("hr.modulesShort", { c: m.courses_done, ct: m.courses_total, s: m.scenarios_done, st: m.scenarios_total })}
                  </div>
                  <div className="text-right">
                    <StatusPill status={m.status} />
                  </div>
                </Link>
              </motion.div>
            ))}
            {team.length === 0 && (
              <div className="p-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                {t("hr.emptyTeam")}
              </div>
            )}
          </div>
          <style>{`.kp-team-row:hover { background: var(--bg-hover); }`}</style>
        </GlassCard>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <GlassCard interactive>
      <div className="flex items-start justify-between">
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              fontWeight: 500,
            }}
          >
            {label}
          </div>
          <div
            className="mt-2 tabular-nums"
            style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)" }}
          >
            {value}
          </div>
        </div>
        <div
          className="flex items-center justify-center"
          style={{
            width: 38, height: 38,
            borderRadius: "50%",
            background: "var(--brand)",
            color: "#FFFFFF",
          }}
        >
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div className="animate-pulse rounded-[14px]" style={{ background: "var(--bg-hover)", height: h }} />;
}
