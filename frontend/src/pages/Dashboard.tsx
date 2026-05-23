import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  Headphones,
  Shield,
  ArrowUpRight,
  Sparkles,
  Clock,
  Award,
  BookOpen,
  Activity as ActivityIcon,
  CheckCircle2,
  Gamepad2,
  GraduationCap,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import CircularProgress from "../components/CircularProgress";
import XPBar from "../components/XPBar";
import ActivityFeed from "../components/ActivityFeed";
import { useProgress } from "../state/ProgressContext";
import { useT } from "../state/LocaleContext";

const ICON_MAP: Record<string, any> = {
  wallet: Wallet,
  headphones: Headphones,
  shield: Shield,
  book: BookOpen,
};

export default function Dashboard() {
  const { user, progress, gamification, courses, activity } = useProgress();
  const t = useT();
  if (!user) return null;

  const firstName = user.full_name.trim().split(/\s+/)[0] || user.full_name;
  const earnedBadges = gamification?.badges.filter((b) => b.earned).length ?? 0;
  const recommendedCourse = courses.find((c) => !c.completed) ?? courses[0];

  return (
    <div className="flex flex-col gap-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
          <Sparkles size={14} style={{ color: "var(--brand)" }} />
          {gamification?.level.title ?? "—"} · {t("common.level")} {gamification?.level.level ?? 1}
        </div>
        <h1 className="hero-text mt-2">
          {t("common.greet", { name: firstName })}
        </h1>
        <p className="mt-3 max-w-xl text-base" style={{ color: "var(--text-secondary)" }}>
          {t("dash.programLine", { name: user.program || "—" })}
        </p>
      </motion.section>

      <section className="grid gap-5 md:grid-cols-3">
        <GlassCard interactive className="flex flex-col items-center text-center">
          <CircularProgress
            value={progress?.overall_completion_pct ?? 0}
            sublabel={t("dash.overall")}
          />
          <div className="mt-3 text-sm font-medium text-navy-900/60 dark:text-white/60">
            {t("dash.allModules")}
          </div>
          {progress && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <span className="rounded-full bg-navy-900/5 px-2.5 py-1 dark:bg-white/10">
                <BookOpen size={10} className="mr-1 inline" />
                {t("nav.courses")} {progress.breakdown.courses_done}/{progress.breakdown.courses_total}
              </span>
              <span className="rounded-full bg-navy-900/5 px-2.5 py-1 dark:bg-white/10">
                <Gamepad2 size={10} className="mr-1 inline" />
                {t("progress.sectionScenarios")} {progress.breakdown.simulator_done}/{progress.breakdown.simulator_total}
              </span>
            </div>
          )}
        </GlassCard>

        <GlassCard interactive>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
                {t("dash.statXP")}
              </div>
              <div className="mt-2 font-display text-4xl font-semibold tabular-nums">
                {progress?.total_points ?? 0}
              </div>
            </div>
            <div
              className="flex items-center justify-center"
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "var(--brand)", color: "#FFFFFF",
              }}
            >
              <Award size={18} />
            </div>
          </div>
          {gamification && (
            <div className="mt-5">
              <XPBar level={gamification.level} />
            </div>
          )}
        </GlassCard>

        <GlassCard interactive>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
                {t("dash.statBadges")}
              </div>
              <div className="mt-2 font-display text-4xl font-semibold tabular-nums">
                {earnedBadges}
                <span className="text-lg text-navy-900/40 dark:text-white/40">
                  {" "}
                  / {gamification?.badges.length ?? 0}
                </span>
              </div>
            </div>
            <div
              className="flex items-center justify-center"
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "var(--brand)", color: "#FFFFFF",
              }}
            >
              <Sparkles size={18} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {(gamification?.badges ?? []).slice(0, 8).map((b) => (
              <div
                key={b.id}
                title={b.title}
                className="h-2 flex-1 rounded-full transition-all"
                style={{ background: b.earned ? "var(--brand)" : "var(--bg-hover)" }}
              />
            ))}
          </div>
          <Link
            to="/progress"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-navy-900/60 hover:text-navy-900 dark:text-white/60 dark:hover:text-white"
          >
            {t("dash.viewAll")} <ArrowUpRight size={12} />
          </Link>
        </GlassCard>
      </section>

      {recommendedCourse && (
        <section>
          <GlassCard strong>
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 56, height: 56,
                  borderRadius: "var(--radius-md)",
                  background: "var(--brand)",
                  color: "#FFFFFF",
                }}
              >
                <GraduationCap size={26} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] uppercase tracking-widest text-gold-700 dark:text-gold-300">
                  {recommendedCourse.completed ? t("dash.recommended.allDone") : t("dash.recommended.continue")}
                </div>
                <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">
                  {recommendedCourse.title}
                </h3>
                <p className="mt-1 text-sm text-navy-900/60 dark:text-white/60">
                  {recommendedCourse.subtitle}
                </p>
                {!recommendedCourse.completed && recommendedCourse.lessons_count > 0 && (
                  <div className="mt-3 flex items-center gap-3 text-xs text-navy-900/60 dark:text-white/60">
                    <div className="kp-progress-track" style={{ width: 160 }}>
                      <div
                        className="kp-progress-fill"
                        style={{
                          width: `${Math.round(
                            (recommendedCourse.lessons_completed / recommendedCourse.lessons_count) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    {recommendedCourse.lessons_completed}/{recommendedCourse.lessons_count} {t("common.lessons")}
                  </div>
                )}
              </div>
              <Link to={`/courses/${recommendedCourse.slug}`} className="btn-gold">
                {recommendedCourse.completed ? t("dash.openCourse") : t("dash.continue")} <ArrowUpRight size={14} />
              </Link>
            </div>
          </GlassCard>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{t("dash.coursesHeader")}</h2>
            <p className="mt-1 text-sm text-navy-900/50 dark:text-white/50">
              {t("dash.coursesSub")}
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 text-xs font-medium text-navy-900/60 hover:text-navy-900 dark:text-white/60 dark:hover:text-white"
          >
            {t("dash.allCourses")} <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => {
            const Icon = ICON_MAP[c.icon] ?? BookOpen;
            const pct = Math.round(
              ((c.lessons_completed + (c.completed ? 1 : 0)) / (c.lessons_count + 1)) * 100,
            );
            return (
              <motion.div
                key={c.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, type: "spring", stiffness: 220, damping: 22 }}
              >
                <Link
                  to={`/courses/${c.slug}`}
                  className="glass group flex h-full flex-col gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass-lg"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 44, height: 44,
                        borderRadius: "var(--radius-md)",
                        background: "var(--brand)",
                        color: "#FFFFFF",
                      }}
                    >
                      <Icon size={20} strokeWidth={2.2} />
                    </div>
                    {c.completed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={10} /> {t("common.completed")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-navy-900/5 px-2.5 py-0.5 text-[10px] font-semibold text-navy-900/60 dark:bg-white/10 dark:text-white/60">
                        {pct}%
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-semibold leading-tight">{c.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-navy-900/60 dark:text-white/60">
                      {c.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-navy-900/8 pt-4 dark:border-white/8">
                    <div className="flex items-center gap-1.5 text-xs text-navy-900/50 dark:text-white/50">
                      <Clock size={12} /> {c.estimated_minutes} {t("common.minutes")} · {c.lessons_count} {t("common.lessons")}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-900 transition-all group-hover:gap-2 dark:text-white">
                      {c.lessons_completed > 0 || c.completed ? t("common.open") : t("common.start")} <ArrowUpRight size={12} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <GlassCard className="!p-7">
          <div className="mb-5 flex items-center justify-between">
            <div
              className="flex items-center gap-2"
              style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}
            >
              <ActivityIcon size={18} style={{ color: "var(--brand)" }} /> {t("dash.lastActivity")}
            </div>
            <Link
              to="/progress"
              className="inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("dash.more")} <ArrowUpRight size={12} />
            </Link>
          </div>
          <ActivityFeed items={activity} limit={6} />
        </GlassCard>
      </section>
    </div>
  );
}
