import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  BookOpen,
  Gamepad2,
  Activity as ActivityIcon,
} from "lucide-react";
import { api } from "../api";
import GlassCard from "../components/GlassCard";
import CircularProgress from "../components/CircularProgress";
import XPBar from "../components/XPBar";
import BadgeGrid from "../components/BadgeGrid";
import ActivityFeed from "../components/ActivityFeed";
import { useProgress } from "../state/ProgressContext";
import { useT } from "../state/LocaleContext";

export default function ProgressPage() {
  const { user, progress: data, gamification: gam, scenarios, courses, activity, refresh, notify } = useProgress();
  const t = useT();
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const sync = async () => {
    if (!user) return;
    setSyncing(true);
    setToast(null);
    try {
      const res = await api.syncIspring(user.id);
      const msg = t("progress.ispringSent", { mode: res.mode });
      setToast({ kind: "ok", text: msg });
      notify("ok", msg);
    } catch (e: any) {
      setToast({ kind: "err", text: `${t("common.error")}: ${e.message}` });
      notify("err", e.message);
    } finally {
      setSyncing(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  if (!data || !gam || !user) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy-900/20 border-t-gold-500" />
      </div>
    );
  }

  const titleByScenario: Record<string, string> = Object.fromEntries(
    scenarios.map((s) => [s.id, s.title]),
  );
  const titleByCourseSlug: Record<string, string> = Object.fromEntries(
    courses.map((c) => [c.slug, c.title]),
  );

  const moduleTitle = (m: { module: string; kind: string }) => {
    if (m.kind === "course" || m.module.startsWith("course:")) {
      const slug = m.module.replace(/^course:/, "");
      return titleByCourseSlug[slug] ?? slug;
    }
    return titleByScenario[m.module] ?? m.module;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
            <TrendingUp size={14} className="text-gold-500" /> {t("progress.kicker")}
          </div>
          <h1 className="hero-text mt-2">{t("progress.title")}</h1>
          <p className="mt-2 text-base text-navy-900/60 dark:text-white/60">
            {t("progress.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="btn-ghost">
            <ActivityIcon size={14} /> {t("common.refresh")}
          </button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={sync}
            disabled={syncing}
            className="btn-gold"
          >
            {syncing ? t("progress.sending") : (<><Send size={14} /> {t("progress.toIspring")}</>)}
          </motion.button>
        </div>
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
            toast.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
          }`}
        >
          {toast.kind === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </motion.div>
      )}

      <div className="grid gap-5 md:grid-cols-4">
        <GlassCard interactive className="flex flex-col items-center text-center md:col-span-1">
          <CircularProgress value={data.overall_completion_pct} sublabel={t("dash.overall")} />
          <div className="mt-3 text-xs font-medium text-navy-900/60 dark:text-white/60">
            {t("dash.allModules")}
          </div>
        </GlassCard>

        <GlassCard interactive className="md:col-span-2">
          <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
            {t("progress.xpLevel")}
          </div>
          <div className="mt-5">
            <XPBar level={gam.level} />
          </div>
        </GlassCard>

        <GlassCard interactive>
          <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
            {t("dash.statBadges")}
          </div>
          <div className="mt-2 font-display text-4xl font-semibold tabular-nums">
            {gam.badges.filter((b) => b.earned).length}
            <span className="text-lg text-navy-900/40 dark:text-white/40"> / {gam.badges.length}</span>
          </div>
          <div className="mt-4 text-xs text-navy-900/60 dark:text-white/60">
            {t("progress.earnedAll")}
          </div>
        </GlassCard>
      </div>

      <section className="grid gap-5 md:grid-cols-2">
        <GlassCard>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen size={16} className="text-gold-500" /> {t("progress.sectionCourses")}
            </div>
            <span className="chip">
              {data.breakdown.courses_done} / {data.breakdown.courses_total}
            </span>
          </div>
          <div className="space-y-2.5">
            {courses.map((c) => {
              const totalSteps = c.lessons_count + 1;
              const done = c.lessons_completed + (c.completed ? 1 : 0);
              const pct = Math.round((done / totalSteps) * 100);
              return (
                <div key={c.slug} className="rounded-2xl border border-navy-900/8 bg-white/40 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{c.title}</div>
                      <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                        {t("courses.modulesCount", { done, total: totalSteps })}
                      </div>
                    </div>
                    <div className="ml-3 text-sm font-semibold tabular-nums">{pct}%</div>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Gamepad2 size={16} className="text-gold-500" /> {t("progress.sectionScenarios")}
            </div>
            <span className="chip">
              {data.breakdown.simulator_done} / {data.breakdown.simulator_total}
            </span>
          </div>
          <div className="space-y-2.5">
            {scenarios.map((s) => {
              const row = data.modules.find((m) => m.module === s.id);
              const pct = Math.round(row?.completion_pct ?? 0);
              return (
                <div key={s.id} className="rounded-2xl border border-navy-900/8 bg-white/40 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{s.title}</div>
                      <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                        {row ? `${row.points} ${t("common.xp")}` : t("common.notStarted")}
                      </div>
                    </div>
                    <div className="ml-3 text-sm font-semibold tabular-nums">{pct}%</div>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <Sparkles size={18} className="text-gold-500" /> {t("progress.achievements")}
        </h2>
        <BadgeGrid badges={gam.badges} />
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <ActivityIcon size={18} className="text-gold-500" /> {t("progress.activityLog")}
        </h2>
        <GlassCard className="!p-7">
          <ActivityFeed items={activity} />
        </GlassCard>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">{t("progress.allModules")}</h2>
        <GlassCard className="!p-0">
          {data.modules.length === 0 ? (
            <div className="p-10 text-center text-sm text-navy-900/50 dark:text-white/50">
              {t("progress.empty")}
            </div>
          ) : (
            <div className="divide-y divide-navy-900/8 dark:divide-white/8">
              {data.modules.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="grid grid-cols-[1fr_120px_64px_72px] items-center gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-navy-900/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-navy-900/60 dark:bg-white/10 dark:text-white/60">
                        {m.kind === "course" || m.module.startsWith("course:") ? t("progress.tagCourse") : t("progress.tagScenario")}
                      </span>
                      <span className="truncate text-sm font-semibold">{moduleTitle(m)}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-navy-900/50 dark:text-white/50">
                      {new Date(m.updated_at).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${m.completion_pct}%` }}
                      transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 60, damping: 18 }}
                    />
                  </div>
                  <div className="text-right text-sm font-semibold tabular-nums">
                    {Math.round(m.completion_pct)}%
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-700 dark:text-gold-300">
                      {m.points} {t("common.xp")}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
