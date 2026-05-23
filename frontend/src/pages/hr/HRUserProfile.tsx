import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Gamepad2,
  MessagesSquare,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { api, HRUserProfile as HRUserProfileType } from "../../api";
import GlassCard from "../../components/GlassCard";
import ActivityFeed from "../../components/ActivityFeed";
import { Donut } from "../../components/Charts";
import StatusPill from "./StatusPill";

export default function HRUserProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState<HRUserProfileType | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setData(null);
    setErr(null);
    api
      .hrUserProfile(Number(id))
      .then(setData)
      .catch((e) => setErr(e?.detail || e?.message || "Ошибка загрузки"));
  }, [id]);

  if (err) {
    return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm">{err}</div>;
  }
  if (!data) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy-900/20 border-t-gold-500" />
      </div>
    );
  }

  const u = data.user;
  const c = data.competency;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/hr/team" className="btn-ghost !px-3 !py-1.5">
          <ArrowLeft size={14} /> К команде
        </Link>
      </div>

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-2xl font-bold text-navy-900 shadow-soft">
            {u.full_name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
              <Sparkles size={14} className="text-gold-500" /> Профиль сотрудника
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{u.full_name}</h1>
            <div className="mt-1 text-sm text-navy-900/60 dark:text-white/60">
              {u.email} · {u.position === "intern" ? "Стажёр" : "Сотрудник"} · {u.department || "—"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={u.status} />
          <span className="chip">
            <Award size={11} /> {u.total_xp} XP · L{u.level}
          </span>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* AI-оценка компетенций */}
        <GlassCard strong className="!p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-gold-500 shadow-soft dark:from-gold-500 dark:to-gold-700 dark:text-navy-900">
              <Brain size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold-700 dark:text-gold-300">
                AI оценка компетенций
                <span className="rounded-full bg-navy-900/8 px-2 py-0.5 text-[9px] tracking-wider text-navy-900/60 dark:bg-white/10 dark:text-white/60">
                  {c.mode === "live" ? "Claude" : "rule-based"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-4">
                <h3 className="font-display text-2xl font-semibold tracking-tight">{c.score}/100</h3>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.score}%` }}
                    transition={{ type: "spring", stiffness: 60, damping: 18 }}
                    className={`h-full rounded-full ${
                      c.score >= 75
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                        : c.score >= 45
                          ? "bg-gradient-to-r from-amber-400 to-amber-600"
                          : "bg-gradient-to-r from-rose-400 to-rose-600"
                    }`}
                  />
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-navy-900/80 dark:text-white/80">
                {c.summary}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={13} /> Сильные стороны
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {c.strengths.length === 0 && (
                  <li className="text-navy-900/40 dark:text-white/40">—</li>
                )}
                {c.strengths.map((s, i) => (
                  <li key={i} className="rounded-xl bg-emerald-500/8 px-3 py-2">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                <Target size={13} /> Зоны роста
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {c.gaps.length === 0 && (
                  <li className="text-navy-900/40 dark:text-white/40">Нет явных пробелов</li>
                )}
                {c.gaps.map((s, i) => (
                  <li key={i} className="rounded-xl bg-amber-500/8 px-3 py-2">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gradient-to-r from-gold-500/10 to-transparent p-4">
            <div className="text-[11px] uppercase tracking-widest text-gold-700 dark:text-gold-300">
              Рекомендация
            </div>
            <div className="mt-1 text-sm font-medium">{c.recommendation}</div>
          </div>
        </GlassCard>

        {/* Donut + быстрые цифры */}
        <GlassCard className="!p-7">
          <div className="flex flex-col items-center gap-4">
            <Donut value={u.overall_completion_pct} label="общий прогресс" size={140} />
            <div className="grid w-full grid-cols-2 gap-3 text-center">
              <Mini label="Курсы" value={`${u.courses_done}/${u.courses_total}`} icon={<BookOpen size={14} />} />
              <Mini label="Сценарии" value={`${u.scenarios_done}/${u.scenarios_total}`} icon={<Gamepad2 size={14} />} />
              <Mini label="XP" value={`${u.total_xp}`} icon={<Sparkles size={14} className="text-gold-500" />} />
              <Mini label="Вопросов AI" value={`${data.chat_questions}`} icon={<MessagesSquare size={14} />} />
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <BookOpen size={18} className="text-gold-500" /> Курсы
            </div>
          </div>
          <div className="space-y-2">
            {data.courses.map((c) => {
              const lpct = Math.round((c.lessons_completed / Math.max(c.lessons_total, 1)) * 100);
              return (
                <div key={c.slug} className="rounded-2xl border border-navy-900/8 bg-white/40 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{c.title}</span>
                        {c.completed && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </div>
                      <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                        Уроки {c.lessons_completed}/{c.lessons_total} · Квиз {c.quiz_score}/{c.quiz_max}
                        {c.quiz_attempts > 0 && ` · ${c.quiz_attempts} попыток`}
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{lpct}%</div>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                      style={{ width: `${lpct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <Gamepad2 size={18} className="text-gold-500" /> Сценарии симулятора
            </div>
          </div>
          <div className="space-y-2">
            {data.scenarios.map((s) => (
              <div key={s.scenario_id} className="rounded-2xl border border-navy-900/8 bg-white/40 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{s.title}</div>
                    <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                      Попыток: {s.attempts} · лучший результат: {s.best_score}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      s.best_pct >= 90
                        ? "text-emerald-600"
                        : s.best_pct >= 70
                          ? "text-amber-600"
                          : s.best_pct > 0
                            ? "text-rose-600"
                            : "text-navy-900/30 dark:text-white/30"
                    }`}
                  >
                    {s.best_pct}%
                    {s.best_pct === 0 && <XCircle size={14} className="ml-1 inline" />}
                  </div>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                    style={{ width: `${s.best_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <TrendingUp size={18} className="text-gold-500" /> Последняя активность
        </h2>
        <GlassCard className="!p-7">
          <ActivityFeed items={data.activity.map((a, i) => ({ id: i, ...a }))} />
        </GlassCard>
      </section>
    </div>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white/40 px-3 py-2.5 text-center dark:border-white/8 dark:bg-white/[0.03]">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-navy-900/50 dark:text-white/50">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
