import { useEffect, useState } from "react";
import { Activity, BookOpen, Gamepad2, PieChart, Sparkles, Users } from "lucide-react";
import { api, HRAnalytics as Data } from "../../api";
import GlassCard from "../../components/GlassCard";
import { HBarChart, Sparkline, VBarChart, Donut } from "../../components/Charts";
import { useT } from "../../state/LocaleContext";

export default function HRAnalyticsPage() {
  const t = useT();
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    api.hrAnalytics().then(setData).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <PieChart size={14} className="text-gold-500" /> {t("hr.an.kicker")}
        </div>
        <h1 className="hero-text mt-2">{t("hr.an.title")}</h1>
      </header>

      <section className="grid gap-5 md:grid-cols-4">
        <KPI icon={<Users size={18} />} label={t("hr.stat.employees")} value={data?.total_users ?? 0} />
        <KPI icon={<Activity size={18} className="text-emerald-500" />} label={t("hr.stat.active7d")} value={data?.active_last_7d ?? 0} />
        <KPI icon={<Sparkles size={18} className="text-gold-500" />} label={t("hr.stat.avgXP")} value={Math.round(data?.avg_xp ?? 0)} />
        <KPI icon={<PieChart size={18} className="text-gold-500" />} label={t("hr.stat.avgProgress")} value={`${data?.avg_completion_pct ?? 0}%`} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <Activity size={18} className="text-gold-500" /> {t("hr.activity14d")}
            </div>
          </div>
          <div className="h-44">{data && <Sparkline data={data.activity_last_14d} height={170} />}</div>
        </GlassCard>

        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-lg font-semibold">{t("hr.xpDistribution")}</div>
            <span className="chip">{t("hr.xpInGroup")}</span>
          </div>
          {data && <VBarChart data={data.xp_distribution} height={170} />}
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <BookOpen size={18} className="text-gold-500" /> {t("hr.coursesCompletion")}
          </div>
          {data && <HBarChart data={data.course_completion} max={100} />}
        </GlassCard>
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Gamepad2 size={18} className="text-gold-500" /> {t("hr.scenariosCompletion")}
          </div>
          {data && <HBarChart data={data.scenario_completion} max={100} />}
        </GlassCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="!p-7">
          <div className="mb-4 font-display text-lg font-semibold">{t("hr.avgReadiness")}</div>
          <div className="flex items-center justify-center">
            <Donut value={data?.avg_completion_pct ?? 0} label={t("hr.readinessLabel")} size={180} />
          </div>
        </GlassCard>
        <GlassCard className="!p-7">
          <div className="mb-4 font-display text-lg font-semibold">{t("hr.an.note.title")}</div>
          <ul className="space-y-3 text-sm text-navy-900/80 dark:text-white/80">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
              <div>
                <strong>{t("hr.an.note1Title")}</strong> {t("hr.an.note1Body")}
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-gold-500" />
              <div>
                <strong>{t("hr.an.note2Title")}</strong> {t("hr.an.note2Body")}
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-navy-900/40 dark:bg-white/40" />
              <div>
                <strong>{t("hr.an.note3Title")}</strong> {t("hr.an.note3Body")}
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
