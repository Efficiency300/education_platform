import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, AlertCircle, Sparkles, TrendingUp } from "lucide-react";
import { api, User, ProgressSummary, Gamification, ScenarioSummary } from "../api";
import GlassCard from "../components/GlassCard";
import CircularProgress from "../components/CircularProgress";
import XPBar from "../components/XPBar";
import BadgeGrid from "../components/BadgeGrid";

export default function ProgressPage({ user }: { user: User }) {
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [gam, setGam] = useState<Gamification | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = () => {
    api.progress(user.id).then(setData).catch(console.error);
    api.badges(user.id).then(setGam).catch(console.error);
    api.scenarios().then(setScenarios).catch(console.error);
  };

  useEffect(load, [user.id]);

  const sync = async () => {
    setSyncing(true);
    setToast(null);
    try {
      const res = await api.syncIspring(user.id);
      setToast({ kind: "ok", text: `Результаты отправлены в iSpring (режим: ${res.mode}).` });
    } catch (e: any) {
      setToast({ kind: "err", text: `Ошибка: ${e.message}` });
    } finally {
      setSyncing(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  if (!data || !gam) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy-900/20 border-t-gold-500" />
      </div>
    );
  }

  const titleByScenario: Record<string, string> = Object.fromEntries(
    scenarios.map((s) => [s.id, s.title])
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
            <TrendingUp size={14} className="text-gold-500" /> Аналитика
          </div>
          <h1 className="hero-text mt-2">Мой прогресс</h1>
          <p className="mt-2 text-base text-navy-900/60 dark:text-white/60">
            Сводка по модулям, баллам и достижениям
          </p>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={sync}
          disabled={syncing}
          className="btn-gold"
        >
          {syncing ? "Отправка…" : (<><Send size={14} /> Отправить в iSpring</>)}
        </motion.button>
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

      <div className="grid gap-5 md:grid-cols-3">
        <GlassCard interactive className="flex flex-col items-center text-center">
          <CircularProgress value={data.overall_completion_pct} sublabel="общий прогресс" />
          <div className="mt-3 text-sm font-medium text-navy-900/60 dark:text-white/60">
            По всем модулям
          </div>
        </GlassCard>

        <GlassCard interactive>
          <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
            XP и уровень
          </div>
          <div className="mt-5">
            <XPBar level={gam.level} />
          </div>
        </GlassCard>

        <GlassCard interactive>
          <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
            Бейджи
          </div>
          <div className="mt-2 font-display text-4xl font-semibold tabular-nums">
            {gam.badges.filter((b) => b.earned).length}
            <span className="text-lg text-navy-900/40 dark:text-white/40"> / {gam.badges.length}</span>
          </div>
          <div className="mt-4 text-sm text-navy-900/60 dark:text-white/60">
            Получено за всё время обучения
          </div>
        </GlassCard>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <Sparkles size={18} className="text-gold-500" /> Достижения
        </h2>
        <BadgeGrid badges={gam.badges} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">Модули</h2>
        <GlassCard className="!p-0">
          {data.modules.length === 0 ? (
            <div className="p-10 text-center text-sm text-navy-900/50 dark:text-white/50">
              Вы ещё не проходили ни одного модуля. Начните с симулятора.
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
                  <div>
                    <div className="text-sm font-semibold">{titleByScenario[m.module] ?? m.module}</div>
                    <div className="text-[11px] text-navy-900/50 dark:text-white/50">
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
                      {m.points} XP
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
