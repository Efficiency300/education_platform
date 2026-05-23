import { useEffect, useState } from "react";
import { Activity, BookOpen, Gamepad2, PieChart, Sparkles, Users } from "lucide-react";
import { api, HRAnalytics as Data } from "../../api";
import GlassCard from "../../components/GlassCard";
import { HBarChart, Sparkline, VBarChart, Donut } from "../../components/Charts";

export default function HRAnalyticsPage() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    api.hrAnalytics().then(setData).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <PieChart size={14} className="text-gold-500" /> Аналитика
        </div>
        <h1 className="hero-text mt-2">Метрики онбординга</h1>
      </header>

      <section className="grid gap-5 md:grid-cols-4">
        <KPI icon={<Users size={18} />} label="Сотрудников" value={data?.total_users ?? 0} />
        <KPI icon={<Activity size={18} className="text-emerald-500" />} label="Активны (7 дн)" value={data?.active_last_7d ?? 0} />
        <KPI icon={<Sparkles size={18} className="text-gold-500" />} label="Средний XP" value={Math.round(data?.avg_xp ?? 0)} />
        <KPI icon={<PieChart size={18} className="text-gold-500" />} label="Средний прогресс" value={`${data?.avg_completion_pct ?? 0}%`} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <Activity size={18} className="text-gold-500" /> Активность за 14 дней
            </div>
          </div>
          <div className="h-44">{data && <Sparkline data={data.activity_last_14d} height={170} />}</div>
        </GlassCard>

        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-lg font-semibold">Распределение XP</div>
            <span className="chip">сотрудников</span>
          </div>
          {data && <VBarChart data={data.xp_distribution} height={170} />}
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <BookOpen size={18} className="text-gold-500" /> Прохождение курсов
          </div>
          {data && <HBarChart data={data.course_completion} max={100} />}
        </GlassCard>
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Gamepad2 size={18} className="text-gold-500" /> Прохождение сценариев
          </div>
          {data && <HBarChart data={data.scenario_completion} max={100} />}
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="!p-7">
          <div className="mb-4 font-display text-lg font-semibold">Средняя готовность команды</div>
          <div className="flex items-center justify-center">
            <Donut value={data?.avg_completion_pct ?? 0} label="готовность" size={180} />
          </div>
        </GlassCard>
        <GlassCard className="!p-7">
          <div className="mb-4 font-display text-lg font-semibold">Что это значит</div>
          <ul className="space-y-3 text-sm text-navy-900/80 dark:text-white/80">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
              <div>
                <strong>Активны за 7 дней</strong> — заходили в платформу и оставили события: уроки, симуляторы, чат с AI.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-gold-500" />
              <div>
                <strong>Прохождение курсов</strong> — процент сотрудников, у которых курс полностью завершён (квиз сдан ≥ 70%).
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-navy-900/40 dark:bg-white/40" />
              <div>
                <strong>Распределение XP</strong> — сколько сотрудников в каждой группе по накопленным баллам.
              </div>
            </li>
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
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
