import { useEffect, useState } from "react";
import { Activity, BookOpen, FileText, MessagesSquare, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import { api, AdminStats } from "../../api";
import GlassCard from "../../components/GlassCard";

export default function AdminSettings() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => {
    api.adminStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <Settings size={14} className="text-gold-500" /> Конфигурация
        </div>
        <h1 className="hero-text mt-2">Состояние системы</h1>
        <p className="mt-2 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
          Текущие режимы интеграций и количественные метрики платформы.
          Конфигурация задаётся через `.env` и переменные окружения.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles size={18} className="text-gold-500" /> Интеграции
          </div>
          <div className="space-y-3">
            <ModeRow
              label="Anthropic Claude"
              mode={stats?.llm_mode ?? "mock"}
              note="При наличии ANTHROPIC_API_KEY — реальный LLM для чата и AI-оценки. Иначе mock."
            />
            <ModeRow
              label="iSpring LMS"
              mode={stats?.ispring_mode ?? "mock"}
              note="При наличии ISPRING_BASE_URL — POST реальных результатов. Иначе mock."
            />
          </div>
        </GlassCard>

        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <ShieldCheck size={18} className="text-gold-500" /> Контент и пользователи
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric icon={<Users size={14} />} label="Пользователей" value={stats?.users_total ?? 0} />
            <Metric icon={<BookOpen size={14} />} label="Курсов всего" value={(stats?.courses_built_in ?? 0) + (stats?.courses_custom ?? 0)} />
            <Metric icon={<FileText size={14} />} label="Регламентов" value={stats?.regulations_count ?? 0} />
            <Metric icon={<ShieldCheck size={14} />} label="RAG-фрагментов" value={stats?.rag_chunks ?? 0} />
            <Metric icon={<MessagesSquare size={14} />} label="Сообщений в чате" value={stats?.chat_messages_total ?? 0} />
            <Metric icon={<Activity size={14} />} label="Событий в журнале" value={stats?.activity_events_total ?? 0} />
          </div>
        </GlassCard>
      </section>

      <GlassCard className="!p-7">
        <div className="mb-3 font-display text-lg font-semibold">Демо-аккаунты</div>
        <div className="overflow-hidden rounded-2xl border border-navy-900/8 dark:border-white/8">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-navy-900/5 dark:bg-white/5 text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">
              <tr>
                <th className="px-4 py-2">Роль</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Пароль</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/8 dark:divide-white/8">
              <tr><td className="px-4 py-2 font-semibold">User</td><td className="px-4 py-2 font-mono">user@turonbank.uz</td><td className="px-4 py-2 font-mono">user12345</td></tr>
              <tr><td className="px-4 py-2 font-semibold">HR</td><td className="px-4 py-2 font-mono">hr@turonbank.uz</td><td className="px-4 py-2 font-mono">hr12345</td></tr>
              <tr><td className="px-4 py-2 font-semibold">Admin</td><td className="px-4 py-2 font-mono">admin@turonbank.uz</td><td className="px-4 py-2 font-mono">admin12345</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-navy-900/50 dark:text-white/50">
          Демо-аккаунты пересоздаются (с обновлением пароля) при каждом старте бекенда — удобно для презентаций.
          В продакшене смените `JWT_SECRET` и отключите автопересоздание.
        </p>
      </GlassCard>
    </div>
  );
}

function ModeRow({ label, mode, note }: { label: string; mode: "live" | "mock"; note: string }) {
  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white/40 p-4 dark:border-white/8 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
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
      </div>
      <div className="mt-1 text-xs text-navy-900/60 dark:text-white/60">{note}</div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white/40 p-3 text-center dark:border-white/8 dark:bg-white/[0.03]">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-navy-900/50 dark:text-white/50">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
