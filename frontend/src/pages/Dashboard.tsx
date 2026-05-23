import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  Headphones,
  Shield,
  ArrowUpRight,
  Sparkles,
  Clock,
  MessagesSquare,
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

const ICON_MAP: Record<string, any> = {
  wallet: Wallet,
  headphones: Headphones,
  shield: Shield,
  book: BookOpen,
};

export default function Dashboard() {
  const { user, progress, gamification, courses, activity } = useProgress();
  if (!user) return null;

  const firstName = user.full_name.split(" ").slice(-1)[0] || user.full_name;
  const earnedBadges = gamification?.badges.filter((b) => b.earned).length ?? 0;
  const recommendedCourse = courses.find((c) => !c.completed) ?? courses[0];

  return (
    <div className="flex flex-col gap-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <Sparkles size={14} className="text-gold-500" />
          {gamification?.level.title ?? "Новичок"} · Уровень {gamification?.level.level ?? 1}
        </div>
        <h1 className="hero-text mt-2">
          Привет,{" "}
          <span className="bg-gradient-to-r from-navy-900 to-gold-600 bg-clip-text text-transparent dark:from-white dark:to-gold-400">
            {firstName}
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-navy-900/60 dark:text-white/60">
          Программа «{user.program || "—"}». Сегодня — отличный день, чтобы продолжить онбординг.
        </p>
      </motion.section>

      <section className="grid gap-5 md:grid-cols-3">
        <GlassCard interactive className="flex flex-col items-center text-center">
          <CircularProgress
            value={progress?.overall_completion_pct ?? 0}
            sublabel="общий прогресс"
          />
          <div className="mt-3 text-sm font-medium text-navy-900/60 dark:text-white/60">
            По курсам и симуляторам
          </div>
          {progress && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <span className="rounded-full bg-navy-900/5 px-2.5 py-1 dark:bg-white/10">
                <BookOpen size={10} className="mr-1 inline" />
                Курсы {progress.breakdown.courses_done}/{progress.breakdown.courses_total}
              </span>
              <span className="rounded-full bg-navy-900/5 px-2.5 py-1 dark:bg-white/10">
                <Gamepad2 size={10} className="mr-1 inline" />
                Сценарии {progress.breakdown.simulator_done}/{progress.breakdown.simulator_total}
              </span>
            </div>
          )}
        </GlassCard>

        <GlassCard interactive>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
                XP / Геймификация
              </div>
              <div className="mt-2 font-display text-4xl font-semibold tabular-nums">
                {progress?.total_points ?? 0}
              </div>
            </div>
            <div className="rounded-full bg-gold-500/15 p-2.5 text-gold-600 dark:text-gold-400">
              <Award size={20} />
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
                Бейджи
              </div>
              <div className="mt-2 font-display text-4xl font-semibold tabular-nums">
                {earnedBadges}
                <span className="text-lg text-navy-900/40 dark:text-white/40">
                  {" "}
                  / {gamification?.badges.length ?? 0}
                </span>
              </div>
            </div>
            <div className="rounded-full bg-navy-900/8 p-2.5 dark:bg-white/10">
              <Sparkles size={20} className="text-gold-500" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {(gamification?.badges ?? []).slice(0, 8).map((b) => (
              <div
                key={b.id}
                title={b.title}
                className={`h-2 flex-1 rounded-full transition-all ${
                  b.earned ? "bg-gradient-to-r from-gold-400 to-gold-600" : "bg-navy-900/8 dark:bg-white/10"
                }`}
              />
            ))}
          </div>
          <Link
            to="/progress"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-navy-900/60 hover:text-navy-900 dark:text-white/60 dark:hover:text-white"
          >
            Посмотреть все <ArrowUpRight size={12} />
          </Link>
        </GlassCard>
      </section>

      {recommendedCourse && (
        <section>
          <GlassCard strong>
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 shadow-glass">
                <GraduationCap size={28} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] uppercase tracking-widest text-gold-700 dark:text-gold-300">
                  {recommendedCourse.completed ? "Все курсы пройдены" : "Рекомендуем продолжить"}
                </div>
                <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">
                  {recommendedCourse.title}
                </h3>
                <p className="mt-1 text-sm text-navy-900/60 dark:text-white/60">
                  {recommendedCourse.subtitle}
                </p>
                {!recommendedCourse.completed && recommendedCourse.lessons_count > 0 && (
                  <div className="mt-3 flex items-center gap-3 text-xs text-navy-900/60 dark:text-white/60">
                    <div className="relative h-1.5 w-40 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                        style={{
                          width: `${Math.round(
                            (recommendedCourse.lessons_completed / recommendedCourse.lessons_count) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    {recommendedCourse.lessons_completed}/{recommendedCourse.lessons_count} уроков
                  </div>
                )}
              </div>
              <Link to={`/courses/${recommendedCourse.slug}`} className="btn-gold">
                {recommendedCourse.completed ? "Открыть курс" : "Продолжить"} <ArrowUpRight size={14} />
              </Link>
            </div>
          </GlassCard>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Доступные курсы</h2>
            <p className="mt-1 text-sm text-navy-900/50 dark:text-white/50">
              Теория → проверка знаний → практика в симуляторе
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 text-xs font-medium text-navy-900/60 hover:text-navy-900 dark:text-white/60 dark:hover:text-white"
          >
            Все курсы <ArrowUpRight size={12} />
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-gold-500 shadow-soft dark:from-gold-500 dark:to-gold-700 dark:text-navy-900">
                      <Icon size={22} strokeWidth={2.2} />
                    </div>
                    {c.completed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={10} /> Пройдено
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
                      <Clock size={12} /> {c.estimated_minutes} мин · {c.lessons_count} уроков
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-900 transition-all group-hover:gap-2 dark:text-white">
                      {c.lessons_completed > 0 || c.completed ? "Открыть" : "Начать"} <ArrowUpRight size={12} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard className="!p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <ActivityIcon size={18} className="text-gold-500" /> Последняя активность
            </div>
            <Link
              to="/progress"
              className="inline-flex items-center gap-1 text-xs font-medium text-navy-900/60 hover:text-navy-900 dark:text-white/60 dark:hover:text-white"
            >
              Подробнее <ArrowUpRight size={12} />
            </Link>
          </div>
          <ActivityFeed items={activity} limit={6} />
        </GlassCard>

        <GlassCard strong className="!p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-gold-500 dark:from-gold-500 dark:to-gold-700 dark:text-navy-900">
              <MessagesSquare size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">AI-наставник 24/7</h3>
              <p className="text-xs text-navy-900/60 dark:text-white/60">
                Со ссылками на регламенты Turonbank
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-navy-900/70 dark:text-white/70">
            Не нашли ответ в курсе? Задайте вопрос AI-наставнику — он подберёт цитаты
            из официальных регламентов и подскажет, какой раздел повторить.
          </p>
          <Link to="/chat" className="btn-primary mt-5 w-full !justify-center">
            Открыть чат <ArrowUpRight size={14} />
          </Link>
        </GlassCard>
      </section>
    </div>
  );
}
