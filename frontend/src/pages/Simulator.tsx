import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
 ShieldCheck,
 Lock,
 ArrowRight,
 Check,
 X,
 Sparkles,
 Trophy,
 RotateCw,
 ChevronLeft,
 Wallet,
 Headphones,
 Shield,
 BookOpen,
 Clock,
 GraduationCap,
} from "lucide-react";
import {
 api,
 Scenario,
 SimSession,
 ScenarioStep,
 AnswerResponse,
} from "../api";
import { useProgress } from "../state/ProgressContext";
import { useT } from "../state/LocaleContext";

const ICON_MAP: Record<string, any> = {
 wallet: Wallet,
 headphones: Headphones,
 shield: Shield,
 book: BookOpen,
};

export default function Simulator() {
 const { user, scenarios, courses, progress, refresh, notify } = useProgress();
 const { scenarioId } = useParams();
 const navigate = useNavigate();
 const t = useT();
 const DIFF_LABEL: Record<string, { label: string; cls: string }> = {
 easy: { label: t("diff.easy"), cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
 medium: { label: t("diff.medium"), cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
 hard: { label: t("diff.hard"), cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
 };
 const [scenario, setScenario] = useState<Scenario | null>(null);
 const [session, setSession] = useState<SimSession | null>(null);
 const [currentStep, setCurrentStep] = useState<ScenarioStep | null>(null);
 const [lastResult, setLastResult] = useState<(AnswerResponse & { optionId: string }) | null>(null);
 const [busy, setBusy] = useState(false);

 const start = useCallback(
 async (id: string) => {
 if (!user) return;
 setBusy(true);
 try {
 const sc = await api.scenario(id);
 const sess = await api.startSession(user.id, id);
 setScenario(sc);
 setSession(sess);
 setCurrentStep(sc.steps[0]);
 setLastResult(null);
 } finally {
 setBusy(false);
 }
 },
 [user],
 );

 useEffect(() => {
 if (scenarioId && (!scenario || scenario.id !== scenarioId)) {
 start(scenarioId);
 }
 }, [scenarioId, scenario, start]);

 const answer = async (optionId: string) => {
 if (!session || !currentStep) return;
 setBusy(true);
 try {
 const res = await api.answer(session.id, currentStep.id, optionId);
 setLastResult({ ...res, optionId });
 setSession((s) => (s ? { ...s, score: res.total_score, finished: res.finished } : s));
 if (res.finished) {
 await refresh();
 notify("ok", t("sim.completedToast", { xp: res.total_score }));
 }
 } finally {
 setBusy(false);
 }
 };

 const next = () => {
 if (!scenario || !lastResult) return;
 if (lastResult.next_step_id) {
 setCurrentStep(scenario.steps.find((s) => s.id === lastResult.next_step_id) ?? null);
 setLastResult(null);
 }
 };

 const restart = () => {
 setScenario(null);
 setSession(null);
 setCurrentStep(null);
 setLastResult(null);
 if (scenarioId) navigate("/simulator", { replace: true });
 };

 // ---------- ВЫБОР СЦЕНАРИЯ ----------
 if (!scenario) {
 const progressByScenario = Object.fromEntries(
 (progress?.modules ?? [])
 .filter((m) => m.kind !== "course" && !m.module.startsWith("course:"))
 .map((m) => [m.module, m]),
 );
 const courseByScenario = Object.fromEntries(
 courses.map((c) => [c.target_scenario_id, c]),
 );

 return (
 <div className="flex flex-col gap-8">
 <div>
 <h1 className="hero-text mt-2">{t("sim.title")}</h1>
 <p className="mt-3 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
 {t("sim.subtitle")}
 </p>
 </div>

 <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
 {scenarios.map((s, i) => {
 const Icon = ICON_MAP[s.icon] ?? BookOpen;
 const diff = DIFF_LABEL[s.difficulty] ?? DIFF_LABEL.easy;
 const done = progressByScenario[s.id];
 const course = courseByScenario[s.id];
 const courseReady = course?.completed ?? true;
 return (
 <motion.button
 key={s.id}
 onClick={() => start(s.id)}
 disabled={busy}
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.05 * i, type: "spring", stiffness: 220, damping: 22 }}
 whileHover={{ y: -4 }}
 whileTap={{ scale: 0.98 }}
 className="glass group flex h-full flex-col gap-4 p-6 text-left transition-all duration-300 hover:shadow-glass-lg"
 >
 <div className="flex items-start justify-between">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white dark: dark: dark:text-navy-900">
 <Icon size={22} strokeWidth={2.2} />
 </div>
 <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${diff.cls}`}>
 {diff.label}
 </span>
 </div>
 <div className="flex-1">
 <h3 className="font-display text-lg font-semibold leading-tight">{s.title}</h3>
 <p className="mt-2 text-sm leading-relaxed text-navy-900/60 dark:text-white/60">
 {s.description}
 </p>
 </div>
 {course && !courseReady && (
 <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200">
 <GraduationCap size={11} className="mr-1 inline" />
 {t("sim.suggestCourse", { name: course.title })}
 </div>
 )}
 <div className="flex items-center justify-between border-t border-navy-900/8 pt-4 dark:border-white/8">
 <div className="flex items-center gap-1.5 text-xs text-navy-900/50 dark:text-white/50">
 <Clock size={12} /> {s.estimated_minutes} {t("common.minutes")}
 </div>
 {done ? (
 <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
 {t("sim.bestPct", { pct: Math.round(done.completion_pct) })}
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-900 transition-all group-hover:gap-2 dark:text-white">
 {t("common.start")} <ArrowRight size={12} />
 </span>
 )}
 </div>
 </motion.button>
 );
 })}
 </div>
 </div>
 );
 }

 // ---------- ФИНАЛЬНЫЙ ЭКРАН ----------
 if (session?.finished && !lastResult) {
 const maxPossible = scenario.steps.reduce(
 (acc, st) => acc + Math.max(...st.options.map((o) => o.points)),
 0,
 );
 const pct = Math.round((session.score / maxPossible) * 100);
 const grade =
 pct >= 90 ? t("sim.done.excellent") : pct >= 70 ? t("sim.done.good") : pct >= 50 ? t("sim.done.ok") : t("sim.done.repeat");
 return (
 <div className="flex flex-col items-center gap-8 py-8">
 <motion.div
 initial={{ scale: 0.7, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: "spring", stiffness: 180, damping: 18 }}
 className="flex h-24 w-24 items-center justify-center rounded-full bg-brand text-white"
 >
 <Trophy size={42} strokeWidth={2.2} />
 </motion.div>
 <div className="text-center">
 <div className="text-sm uppercase tracking-widest text-navy-900/50 dark:text-white/50">
 {grade}
 </div>
 <h1 className="hero-text mt-2">{t("sim.done.title")}</h1>
 <p className="mt-2 text-navy-900/60 dark:text-white/60">{scenario.title}</p>
 </div>
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="glass-strong flex flex-col items-center gap-3 px-12 py-8"
 >
 <div className="font-display text-7xl font-semibold tabular-nums text-navy-900 dark:text-white">
 {pct}%
 </div>
 <div className="text-sm text-navy-900/60 dark:text-white/60">
 {t("sim.done.scoreLine", { score: session.score, max: maxPossible })}
 </div>
 <div className="mt-4 flex flex-wrap justify-center gap-3">
 <button onClick={restart} className="btn-ghost">
 <ChevronLeft size={14} /> {t("sim.done.other")}
 </button>
 <button onClick={() => start(scenario.id)} className="btn-gold">
 <RotateCw size={14} /> {t("common.retry")}
 </button>
 </div>
 </motion.div>
 </div>
 );
 }

 if (!currentStep) return null;
 const stepIndex = scenario.steps.findIndex((s) => s.id === currentStep.id);
 const progressPct = ((stepIndex + (lastResult ? 1 : 0)) / scenario.steps.length) * 100;

 return (
 <div className="flex flex-col gap-6">
 <div className="flex items-center justify-between">
 <button onClick={restart} className="btn-ghost !px-3 !py-1.5">
 <ChevronLeft size={14} />
 {t("sim.toScenarios")}
 </button>
 <motion.div
 initial={{ scale: 0.8 }}
 animate={{ scale: 1 }}
 className="flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-navy-900 shadow-soft"
 >
 <Sparkles size={14} /> {session?.score ?? 0} XP
 </motion.div>
 </div>

 <div>
 <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{scenario.title}</h1>
 <div className="mt-3 flex items-center gap-3">
 <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
 {t("sim.step", { idx: stepIndex + 1, total: scenario.steps.length })}
 </div>
 <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
 <motion.div
 className="absolute inset-y-0 left-0 rounded-full bg-brand"
 initial={false}
 animate={{ width: `${progressPct}%` }}
 transition={{ type: "spring", stiffness: 80, damping: 18 }}
 />
 </div>
 </div>
 </div>

 <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
 <div className="flex flex-col gap-5">
 <motion.div
 key={currentStep.id}
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ type: "spring", stiffness: 220, damping: 24 }}
 className="glass p-7"
 >
 <h2 className="font-display text-xl font-semibold leading-snug">{currentStep.prompt}</h2>
 <div className="mt-5 flex flex-col gap-3">
 {currentStep.options.map((opt, i) => {
 const isChosen = lastResult?.optionId === opt.id;
 const showFeedback = !!lastResult;
 const correct = isChosen && lastResult!.correct;
 const wrong = isChosen && !lastResult!.correct;
 return (
 <motion.button
 key={opt.id}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.05 * i }}
 whileHover={!showFeedback ? { x: 4, transition: { type: "spring", stiffness: 300 } } : undefined}
 whileTap={!showFeedback ? { scale: 0.98 } : undefined}
 onClick={() => answer(opt.id)}
 disabled={busy || showFeedback}
 className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-sm transition-all duration-200 ${
 correct
 ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
 : wrong
 ? "border-rose-500/50 bg-rose-500/10 text-rose-900 dark:text-rose-100"
 : showFeedback
 ? "border-navy-900/8 bg-white/30 text-navy-900/40 dark:border-white/8 dark:bg-white/[0.02] dark:text-white/40"
 : "border-navy-900/8 bg-white/50 hover:border-gold-500/40 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
 }`}
 >
 <div
 className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
 correct
 ? "border-emerald-500 bg-emerald-500 text-white"
 : wrong
 ? "border-rose-500 bg-rose-500 text-white"
 : "border-navy-900/15 dark:border-white/20"
 }`}
 >
 {correct ? <Check size={14} /> : wrong ? <X size={14} /> : opt.id.toUpperCase()}
 </div>
 <span className="leading-relaxed">{opt.text}</span>
 </motion.button>
 );
 })}
 </div>

 <AnimatePresence>
 {lastResult && (
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0 }}
 className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm ${
 lastResult.correct
 ? "border-emerald-500/30 bg-emerald-500/10"
 : "border-rose-500/30 bg-rose-500/10"
 }`}
 >
 <div
 className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
 lastResult.correct ? "bg-emerald-500" : "bg-rose-500"
 } text-white`}
 >
 {lastResult.correct ? <Check size={14} /> : <X size={14} />}
 </div>
 <div className="flex-1">
 <div className="font-semibold">
 {lastResult.correct ? t("common.allRight") : t("common.notQuite")}
 {lastResult.points_awarded > 0 && (
 <span className="ml-2 text-gold-600 dark:text-gold-400">
 +{lastResult.points_awarded} {t("common.xp")}
 </span>
 )}
 </div>
 <div className="mt-1 leading-relaxed text-navy-900/80 dark:text-white/80">
 {lastResult.feedback}
 </div>
 </div>
 <button
 onClick={lastResult.next_step_id ? next : () => setLastResult(null)}
 className="btn-primary !rounded-full !px-4 !py-1.5 shrink-0"
 >
 {lastResult.next_step_id ? t("common.next") : t("common.finish")} <ArrowRight size={12} />
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 </div>

 <div className="flex flex-col gap-5">
 <SandboxFrame scenario={scenario} stepId={currentStep.id} />
 </div>
 </div>
 </div>
 );
}

function SandboxFrame({ scenario, stepId }: { scenario: Scenario; stepId: string }) {
 const t = useT();
 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.96 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ type: "spring", stiffness: 200 }}
 className="overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-b /40 to-transparent p-1 shadow-glass-lg dark:/10"
 >
 <div className="flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-widest text-gold-700 dark:text-gold-400">
 <span className="inline-flex items-center gap-1.5">
 <Lock size={11} /> {t("common.safeSandbox")}
 </span>
 <span>{t("common.dummyData")}</span>
 </div>

 <div className="overflow-hidden rounded-2xl border border-navy-900/15 bg-[#0F1B2E] text-slate-200 shadow-2xl">
 <div className="flex items-center gap-2 border-b border-white/8 bg-[#0A1628] px-4 py-2.5">
 <div className="flex gap-1.5">
 <span className="h-3 w-3 rounded-full bg-rose-500/80" />
 <span className="h-3 w-3 rounded-full bg-amber-500/80" />
 <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
 </div>
 <div className="flex-1 text-center text-[11px] font-medium text-slate-400">
 {t("sim.absWindow")}
 </div>
 <span className="text-[10px] text-gold-400">v.demo</span>
 </div>
 <div className="space-y-3 p-5 font-mono text-xs">
 <CustomerHeader scenario={scenario} />
 <FieldRow label={t("sim.fieldCustomer")} value={scenario.customer.name} />
 <FieldRow label={t("sim.fieldDocument")} value={scenario.customer.document} />
 <FieldRow label={t("sim.fieldPurpose")} value={scenario.customer.purpose} />
 <FieldRow label={t("sim.fieldStep")} value={stepId} mono />
 <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3 text-[10px] leading-relaxed text-slate-400">
 {t("sim.dlpNote")}
 </div>
 </div>
 </div>
 </motion.div>
 );
}

function CustomerHeader({ scenario }: { scenario: Scenario }) {
 const t = useT();
 return (
 <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r /15 to-transparent p-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white text-xs font-bold text-navy-900">
 {scenario.customer.avatar}
 </div>
 <div className="flex-1">
 <div className="text-[11px] text-slate-300">{t("sim.virtualCustomer")}</div>
 <div className="text-sm font-semibold text-white">{scenario.customer.name}</div>
 </div>
 </div>
 );
}

function FieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
 return (
 <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-dashed border-white/8 pb-2">
 <span className="text-slate-500">{label}</span>
 <span className={mono ? "font-mono text-gold-400" : "text-slate-100"}>{value}</span>
 </div>
 );
}
