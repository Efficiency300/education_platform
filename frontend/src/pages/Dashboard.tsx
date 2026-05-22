import { useEffect, useState } from "react";
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
} from "lucide-react";
import { api, User, ProgressSummary, ScenarioSummary, Gamification } from "../api";
import GlassCard from "../components/GlassCard";
import CircularProgress from "../components/CircularProgress";
import XPBar from "../components/XPBar";

const ICON_MAP: Record<string, any> = {
  wallet: Wallet,
  headphones: Headphones,
  shield: Shield,
  book: BookOpen,
};
const DIFF_LABEL: Record<string, { label: string; cls: string }> = {
  easy: { label: "Лёгкий", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  medium: { label: "Средний", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  hard: { label: "Сложный", cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
};

export default function Dashboard({ user }: { user: User }) {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [gam, setGam] = useState<Gamification | null>(null);

  useEffect(() => {
    api.progress(user.id).then(setProgress).catch(console.error);
    api.scenarios().then(setScenarios).catch(console.error);
    api.badges(user.id).then(setGam).catch(console.error);
  }, [user.id]);

  const firstName = user.full_name.split(" ").slice(-1)[0] || user.full_name;
  const completedCount = progress?.modules.length ?? 0;
  const earnedBadges = gam?.badges.filter((b) => b.earned).length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <Sparkles size={14} className="text-gold-500" />
          {gam?.level.title ?? "Новичок"} · Уровень {gam?.level.level ?? 1}
        </div>
        <h1 className="hero-text mt-2">
          Привет, <span className="bg-gradient-to-r from-navy-900 to-gold-600 bg-clip-text text-transparent dark:from-white dark:to-gold-400">{firstName}</span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-navy-900/60 dark:text-white/60">
          Программа «{user.program || "—"}». Сегодня — отличный день, чтобы продолжить онбординг.
        </p>
      </motion.section>

      {/* Stats */}
      <section className="grid gap-5 md:grid-cols-3">
        <GlassCard interactive className="flex flex-col items-center text-center">
          <CircularProgress
            value={progress?.overall_completion_pct ?? 0}
            sublabel="общий прогресс"
          />
          <div className="mt-3 text-sm font-medium text-navy-900/60 dark:text-white/60">
            По всем модулям онбординга
          </div>
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
          {gam && <div className="mt-5"><XPBar level={gam.level} /></div>}
        </GlassCard>

        <GlassCard interactive>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
                Бейджи
              </div>
              <div className="mt-2 font-display text-4xl font-semibold tabular-nums">
                {earnedBadges}
                <span className="text-lg text-navy-900/40 dark:text-white/40"> / {gam?.badges.length ?? 0}</span>
              </div>
            </div>
            <div className="rounded-full bg-navy-900/8 p-2.5 dark:bg-white/10">
              <Sparkles size={20} className="text-gold-500" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {(gam?.badges ?? []).slice(0, 6).map((b) => (
              <div
                key={b.id}
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

      {/* Scenarios */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Доступные сценарии</h2>
            <p className="mt-1 text-sm text-navy-900/50 dark:text-white/50">
              Безопасная среда с виртуальными клиентами · никаких реальных данных
            </p>
          </div>
          <div className="chip">
            <Clock size={11} />
            {completedCount} из {scenarios.length} пройдено
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s, i) => {
            const Icon = ICON_MAP[s.icon] ?? BookOpen;
            const diff = DIFF_LABEL[s.difficulty] ?? DIFF_LABEL.easy;
            const done = progress?.modules.find((m) => m.module === s.id);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, type: "spring", stiffness: 220, damping: 22 }}
              >
                <Link
                  to="/simulator"
                  className="glass group flex h-full flex-col gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-gold-500 shadow-soft dark:from-gold-500 dark:to-gold-700 dark:text-navy-900">
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
                  <div className="flex items-center justify-between border-t border-navy-900/8 pt-4 dark:border-white/8">
                    <div className="flex items-center gap-1.5 text-xs text-navy-900/50 dark:text-white/50">
                      <Clock size={12} /> {s.estimated_minutes} мин
                    </div>
                    {done ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ {done.completion_pct}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-900 transition-all group-hover:gap-2 dark:text-white">
                        Начать <ArrowUpRight size={12} />
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <GlassCard strong>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900">
                <MessagesSquare size={22} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Нужна помощь?</h3>
                <p className="text-sm text-navy-900/60 dark:text-white/60">
                  Спросите AI-наставника — он отвечает 24/7 со ссылками на регламенты.
                </p>
              </div>
            </div>
            <Link to="/chat" className="btn-primary">
              Открыть чат <ArrowUpRight size={14} />
            </Link>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
