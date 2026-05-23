import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Gamepad2,
  Layers,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { api, AdminStats } from "../../api";
import GlassCard from "../../components/GlassCard";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => {
    api.adminStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <ShieldCheck size={14} className="text-gold-500" /> Admin Console
        </div>
        <h1 className="hero-text mt-2">Управление системой</h1>
        <p className="mt-2 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
          Управление курсами, регламентами, пользователями. Доступ только для роли admin.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-4">
        <KPI label="Пользователей" value={stats?.users_total ?? 0} icon={<Users size={18} />} />
        <KPI label="Курсов" value={`${(stats?.courses_built_in ?? 0) + (stats?.courses_custom ?? 0)}`} sub={`built-in ${stats?.courses_built_in ?? 0} · custom ${stats?.courses_custom ?? 0}`} icon={<BookOpen size={18} />} />
        <KPI label="Регламентов / RAG-фрагментов" value={stats?.regulations_count ?? 0} sub={`${stats?.rag_chunks ?? 0} chunks`} icon={<FileText size={18} />} />
        <KPI label="Завершённых курсов" value={stats?.completed_courses_total ?? 0} sub={`${stats?.completed_scenarios_total ?? 0} сценариев`} icon={<CheckCircle2 size={18} className="text-emerald-500" />} />
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Card to="/admin/courses" title="Курсы" subtitle="Создать, удалить, просмотреть весь каталог" icon={<BookOpen size={20} />} />
        <Card to="/admin/regulations" title="Регламенты" subtitle="Загрузка markdown, переиндексация RAG" icon={<FileText size={20} />} />
        <Card to="/admin/users" title="Пользователи" subtitle="Управление ролями (user · hr · admin)" icon={<Users size={20} />} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Layers size={18} className="text-gold-500" /> Состав пользователей по ролям
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {(["user", "hr", "admin"] as const).map((r) => (
              <div key={r} className="rounded-2xl border border-navy-900/8 bg-white/40 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">{r}</div>
                <div className="mt-1 font-display text-2xl font-semibold tabular-nums">
                  {stats?.users_by_role?.[r] ?? 0}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Settings size={18} className="text-gold-500" /> Режимы интеграций
          </div>
          <div className="space-y-3">
            <Row icon={<Sparkles size={14} />} label="LLM (Anthropic Claude)" mode={stats?.llm_mode ?? "mock"} />
            <Row icon={<FileText size={14} />} label="iSpring LMS" mode={stats?.ispring_mode ?? "mock"} />
            <Row icon={<MessagesSquare size={14} />} label="Сообщений в чате" value={`${stats?.chat_messages_total ?? 0}`} />
            <Row icon={<Gamepad2 size={14} />} label="Событий в журнале" value={`${stats?.activity_events_total ?? 0}`} />
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

function KPI({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <GlassCard interactive>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
          {sub && <div className="mt-1 text-[11px] text-navy-900/40 dark:text-white/40">{sub}</div>}
        </div>
        <div className="rounded-full bg-navy-900/8 p-2.5 dark:bg-white/10">{icon}</div>
      </div>
    </GlassCard>
  );
}

function Card({ to, title, subtitle, icon }: { to: string; title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="glass group flex h-full flex-col gap-4 p-6 transition hover:-translate-y-1 hover:shadow-glass-lg">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-gold-500 shadow-soft dark:from-gold-500 dark:to-gold-700 dark:text-navy-900">
          {icon}
        </div>
        <ArrowUpRight size={16} className="text-navy-900/30 transition group-hover:text-navy-900 dark:text-white/30 dark:group-hover:text-white" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold leading-tight">{title}</h3>
        <p className="mt-1 text-sm text-navy-900/60 dark:text-white/60">{subtitle}</p>
      </div>
    </Link>
  );
}

function Row({ icon, label, mode, value }: { icon: React.ReactNode; label: string; mode?: "live" | "mock"; value?: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-navy-900/8 bg-white/40 px-4 py-2.5 dark:border-white/8 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-navy-900/50 dark:text-white/50">{icon}</span>
        {label}
      </div>
      {mode ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            mode === "live"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${mode === "live" ? "bg-emerald-500" : "bg-amber-500"}`} />
          {mode}
        </span>
      ) : (
        <span className="font-display text-sm font-semibold tabular-nums">{value}</span>
      )}
    </div>
  );
}
