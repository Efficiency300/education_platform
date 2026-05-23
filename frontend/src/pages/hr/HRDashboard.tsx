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
} from "lucide-react";
import { api, HRAnalytics, LeaderboardItem, TeamMember } from "../../api";
import GlassCard from "../../components/GlassCard";
import { HBarChart, Sparkline, VBarChart, Donut } from "../../components/Charts";
import StatusPill from "./StatusPill";

export default function HRDashboard() {
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
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <Sparkles size={14} className="text-gold-500" /> HR Dashboard
        </div>
        <h1 className="hero-text mt-2">Обзор онбординга</h1>
        <p className="mt-2 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
          Состояние команды, прогресс по модулям, активность за последние две недели.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-4">
        <Stat icon={<Users size={18} />} label="Сотрудников" value={analytics?.total_users ?? 0} />
        <Stat icon={<Activity size={18} className="text-emerald-500" />} label="Активны за 7 дней" value={analytics?.active_last_7d ?? 0} />
        <Stat icon={<TrendingUp size={18} className="text-gold-500" />} label="Средний прогресс" value={`${analytics?.avg_completion_pct ?? 0}%`} />
        <Stat icon={<Sparkles size={18} className="text-gold-500" />} label="Средний XP" value={Math.round(analytics?.avg_xp ?? 0)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 !p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <Activity size={18} className="text-gold-500" /> Активность за 14 дней
            </div>
            <span className="chip">События</span>
          </div>
          {analytics ? (
            <div className="h-40">
              <Sparkline data={analytics.activity_last_14d} height={140} />
            </div>
          ) : (
            <Skeleton h={160} />
          )}
        </GlassCard>

        <GlassCard className="!p-7">
          <div className="mb-5 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
                Средняя готовность
              </div>
              <div className="mt-4">
                <Donut value={analytics?.avg_completion_pct ?? 0} label="готовность" />
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="!p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="font-display text-lg font-semibold">Прохождение курсов</div>
            <span className="chip">% сотрудников</span>
          </div>
          {analytics ? (
            <HBarChart data={analytics.course_completion} max={100} />
          ) : (
            <Skeleton h={180} />
          )}
        </GlassCard>

        <GlassCard className="!p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="font-display text-lg font-semibold">Прохождение сценариев</div>
            <span className="chip">% сотрудников</span>
          </div>
          {analytics ? (
            <HBarChart data={analytics.scenario_completion} max={100} />
          ) : (
            <Skeleton h={180} />
          )}
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <GlassCard className="!p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="font-display text-lg font-semibold">Распределение XP</div>
            <span className="chip">сотрудников в группе</span>
          </div>
          {analytics ? <VBarChart data={analytics.xp_distribution} height={140} /> : <Skeleton h={160} />}
        </GlassCard>

        <GlassCard className="!p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <Trophy size={18} className="text-gold-500" /> Топ-5 сотрудников
            </div>
            <Link
              to="/hr/leaderboard"
              className="inline-flex items-center gap-1 text-xs font-medium text-navy-900/60 hover:text-navy-900 dark:text-white/60 dark:hover:text-white"
            >
              Весь лидерборд <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {top.map((m, i) => (
              <Link
                key={m.user_id}
                to={`/hr/users/${m.user_id}`}
                className="flex items-center justify-between rounded-2xl border border-navy-900/8 bg-white/40 px-4 py-2.5 transition hover:bg-white/70 dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/8"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900"
                        : i === 1
                          ? "bg-slate-300 text-navy-900"
                          : i === 2
                            ? "bg-amber-700/80 text-white"
                            : "bg-navy-900/8 text-navy-900/70 dark:bg-white/10 dark:text-white/70"
                    }`}
                  >
                    {m.rank}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{m.full_name}</div>
                    <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                      {m.department || "—"} · L{m.level}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-gold-700 dark:text-gold-300">{m.total_xp} XP</div>
              </Link>
            ))}
            {top.length === 0 && <Skeleton h={120} />}
          </div>
        </GlassCard>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Команда</h2>
            <p className="mt-1 text-sm text-navy-900/50 dark:text-white/50">
              Кликните на сотрудника, чтобы открыть детальный профиль с AI-оценкой компетенций
            </p>
          </div>
          <Link
            to="/hr/team"
            className="inline-flex items-center gap-1 text-xs font-medium text-navy-900/60 hover:text-navy-900 dark:text-white/60 dark:hover:text-white"
          >
            Все сотрудники <ArrowUpRight size={12} />
          </Link>
        </div>
        <GlassCard className="!p-0 overflow-hidden">
          <div className="divide-y divide-navy-900/8 dark:divide-white/8">
            {team.slice(0, 6).map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
              >
                <Link
                  to={`/hr/users/${m.id}`}
                  className="grid grid-cols-[1.6fr_1fr_120px_100px_120px] items-center gap-4 px-6 py-3 transition hover:bg-white/40 dark:hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-xs font-bold text-navy-900">
                      {m.full_name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{m.full_name}</div>
                      <div className="truncate text-[11px] text-navy-900/50 dark:text-white/50">
                        {m.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-navy-900/70 dark:text-white/70">{m.department || "—"}</div>
                  <div className="text-xs tabular-nums">
                    {m.overall_completion_pct}% · {m.total_xp} XP
                  </div>
                  <div className="text-xs tabular-nums">
                    К {m.courses_done}/{m.courses_total} · С {m.scenarios_done}/{m.scenarios_total}
                  </div>
                  <div className="text-right">
                    <StatusPill status={m.status} />
                  </div>
                </Link>
              </motion.div>
            ))}
            {team.length === 0 && (
              <div className="p-10 text-center text-sm text-navy-900/50 dark:text-white/50">
                Сотрудники с ролью «user» появятся здесь после регистрации.
              </div>
            )}
          </div>
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
          <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
        </div>
        <div className="rounded-full bg-navy-900/8 p-2.5 dark:bg-white/10">{icon}</div>
      </div>
    </GlassCard>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div className="animate-pulse rounded-2xl bg-navy-900/5 dark:bg-white/5" style={{ height: h }} />;
}
