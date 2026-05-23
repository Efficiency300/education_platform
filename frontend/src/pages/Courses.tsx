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
import { useT } from "../state/LocaleContext";
import { useTranslated } from "../state/TranslationContext";
import { CourseSummary } from "../api";

const ICONS: Record<string, any> = {
 wallet: Wallet,
 headphones: Headphones,
 shield: Shield,
 book: BookOpen,
};

export default function CoursesPage() {
 const { courses, scenarios } = useProgress();
 const t = useT();
 const scenarioMap = Object.fromEntries(scenarios.map((s) => [s.id, s.title]));

 const total = courses.length;
 const completed = courses.filter((c) => c.completed).length;
 const inProgress = courses.filter((c) => !c.completed && c.lessons_completed > 0).length;

 return (
 <div className="flex flex-col gap-8">
 <header>
 <h1 className="hero-text mt-2">{t("courses.title")}</h1>
 <p className="mt-3 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
 {t("courses.subtitle")}
 </p>
 </header>

 <section className="grid gap-4 md:grid-cols-3">
 <Stat label={t("courses.statTotal")} value={total} icon={<BookOpen size={18} />} />
 <Stat label={t("courses.statInProgress")} value={inProgress} icon={<Sparkles size={18} className="text-gold-500" />} />
 <Stat label={t("courses.statCompleted")} value={completed} icon={<CheckCircle2 size={18} className="text-emerald-500" />} />
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
 const t = useT();
 const title = useTranslated(course.title);
 const subtitle = useTranslated(course.subtitle);
 const description = useTranslated(course.description);
 const Icon = ICONS[course.icon] ?? BookOpen;
 const DIFF: Record<string, { label: string; cls: string }> = {
 easy: { label: t("diff.basic"), cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
 medium: { label: t("diff.medium"), cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
 hard: { label: t("diff.advanced"), cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
 };
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
 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white dark: dark: dark:text-navy-900">
 <Icon size={24} strokeWidth={2.2} />
 </div>
 <div className="min-w-0">
 <div className="text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">
 {subtitle}
 </div>
 <h3 className="mt-1 font-display text-lg font-semibold leading-tight">{title}</h3>
 </div>
 </div>
 <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${diff.cls}`}>
 {diff.label}
 </span>
 </div>

 <p className="text-sm leading-relaxed text-navy-900/60 dark:text-white/60">
 {description}
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
 {t("courses.modulesCount", { done: doneSteps, total: totalSteps })}
 </span>
 <span className="tabular-nums">{pct}%</span>
 </div>
 <div className="relative h-1.5 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
 <motion.div
 className="absolute inset-y-0 left-0 rounded-full bg-brand"
 initial={{ width: 0 }}
 animate={{ width: `${pct}%` }}
 transition={{ delay: 0.2 + index * 0.05, type: "spring", stiffness: 80, damping: 18 }}
 />
 </div>
 </div>

 <div className="flex items-center justify-between border-t border-navy-900/8 pt-4 dark:border-white/8">
 <div className="flex items-center gap-3 text-xs text-navy-900/50 dark:text-white/50">
 <span className="inline-flex items-center gap-1">
 <BookOpen size={12} /> {course.lessons_count} {t("common.lessons")}
 </span>
 <span className="inline-flex items-center gap-1">
 <Clock size={12} /> {course.estimated_minutes} {t("common.minutes")}
 </span>
 </div>
 {course.completed ? (
 <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
 <CheckCircle2 size={12} /> {t("common.completed")}
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-900 transition-all group-hover:gap-2 dark:text-white">
 {course.lessons_completed > 0 ? t("dash.continue") : t("common.start")} <ArrowRight size={12} />
 </span>
 )}
 </div>

 <div className="-mx-6 -mb-6 mt-2 flex items-center justify-between gap-2 rounded-b-2xl border-t border-gold-500/25 bg-gradient-to-r /8 to-transparent px-6 py-3 text-xs">
 <span className="text-navy-900/60 dark:text-white/60">
 {t("courses.afterCourse")} <strong className="text-navy-900 dark:text-white">«{scenarioTitle}»</strong>
 </span>
 </div>
 </Link>
 </motion.div>
 );
}
