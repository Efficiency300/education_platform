import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Wallet,
  Headphones,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { useProgress } from "../state/ProgressContext";
import { CourseSummary } from "../api";

const ICONS: Record<string, any> = {
  wallet: Wallet,
  headphones: Headphones,
  shield: Shield,
  book: BookOpen,
};
const DIFF: Record<string, { label: string; cls: string }> = {
  easy: { label: "Базовый", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  medium: { label: "Средний", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  hard: { label: "Углублённый", cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
};

export default function CoursesPage() {
  const { courses, scenarios } = useProgress();
  const scenarioMap = Object.fromEntries(scenarios.map((s) => [s.id, s.title]));

  const total = courses.length;
  const completed = courses.filter((c) => c.completed).length;
  const inProgress = courses.filter((c) => !c.completed && c.lessons_completed > 0).length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <GraduationCap size={14} className="text-gold-500" /> Учебный центр
        </div>
        <h1 className="hero-text mt-2">Курсы подготовки к симулятору</h1>
        <p className="mt-3 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
          Каждый курс — теория, проверка знаний и практика в симуляторе.
          Завершите курс, чтобы быть готовым к реальным операциям.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="Всего курсов" value={total} icon={<BookOpen size={18} />} />
        <Stat label="В процессе" value={inProgress} icon={<Sparkles size={18} className="text-gold-500" />} />
        <Stat label="Завершено" value={completed} icon={<CheckCircle2 size={18} className="text-emerald-500" />} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {courses.map((c, i) => (
          <CourseCard
            key={c.slug}
            course={c}
            index={i}
            scenarioTitle={scenarioMap[c.target_scenario_id] ?? c.target_scenario_id}
          />
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="glass flex items-center justify-between p-5">
      <div>
        <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">{label}</div>
        <div className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</div>
      </div>
      <div className="rounded-full bg-navy-900/8 p-3 dark:bg-white/10">{icon}</div>
    </div>
  );
}

function CourseCard({
  course,
  index,
  scenarioTitle,
}: {
  course: CourseSummary;
  index: number;
  scenarioTitle: string;
}) {
  const Icon = ICONS[course.icon] ?? BookOpen;
  const diff = DIFF[course.difficulty] ?? DIFF.easy;
  const totalSteps = course.lessons_count + 1; // lessons + quiz
  const doneSteps = course.lessons_completed + (course.completed ? 1 : 0);
  const pct = Math.round((doneSteps / totalSteps) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, type: "spring", stiffness: 220, damping: 22 }}
    >
      <Link
        to={`/courses/${course.slug}`}
        className="glass group flex h-full flex-col gap-5 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-gold-500 shadow-soft dark:from-gold-500 dark:to-gold-700 dark:text-navy-900">
              <Icon size={24} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">
                {course.subtitle}
              </div>
              <h3 className="mt-1 font-display text-lg font-semibold leading-tight">{course.title}</h3>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${diff.cls}`}>
            {diff.label}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-navy-900/60 dark:text-white/60">
          {course.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {course.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-navy-900/5 px-2.5 py-0.5 text-[10px] font-medium text-navy-900/60 dark:bg-white/10 dark:text-white/60"
            >
              #{t}
            </span>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-navy-900/50 dark:text-white/50">
            <span>
              {doneSteps} / {totalSteps} модулей
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.2 + index * 0.05, type: "spring", stiffness: 80, damping: 18 }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-navy-900/8 pt-4 dark:border-white/8">
          <div className="flex items-center gap-3 text-xs text-navy-900/50 dark:text-white/50">
            <span className="inline-flex items-center gap-1">
              <BookOpen size={12} /> {course.lessons_count} уроков
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {course.estimated_minutes} мин
            </span>
          </div>
          {course.completed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={12} /> Завершён
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-900 transition-all group-hover:gap-2 dark:text-white">
              {course.lessons_completed > 0 ? "Продолжить" : "Начать"} <ArrowRight size={12} />
            </span>
          )}
        </div>

        <div className="-mx-6 -mb-6 mt-2 flex items-center justify-between gap-2 rounded-b-2xl border-t border-gold-500/25 bg-gradient-to-r from-gold-500/8 to-transparent px-6 py-3 text-xs">
          <span className="text-navy-900/60 dark:text-white/60">
            После курса откроется симулятор <strong className="text-navy-900 dark:text-white">«{scenarioTitle}»</strong>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
