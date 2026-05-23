import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SortAsc } from "lucide-react";
import { api, TeamMember } from "../../api";
import GlassCard from "../../components/GlassCard";
import StatusPill, { STATUS_META } from "./StatusPill";

type SortBy = "name" | "xp" | "completion" | "activity";

export default function HRTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<TeamMember["status"] | "all">("all");
  const [sort, setSort] = useState<SortBy>("xp");

  useEffect(() => {
    api.hrTeam().then(setTeam).catch(console.error);
  }, []);

  const visible = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = team.filter((m) =>
      filter === "all" ? true : m.status === filter,
    );
    if (qq) {
      list = list.filter(
        (m) =>
          m.full_name.toLowerCase().includes(qq) ||
          m.email.toLowerCase().includes(qq) ||
          m.department.toLowerCase().includes(qq),
      );
    }
    const cmp: Record<SortBy, (a: TeamMember, b: TeamMember) => number> = {
      name: (a, b) => a.full_name.localeCompare(b.full_name, "ru"),
      xp: (a, b) => b.total_xp - a.total_xp,
      completion: (a, b) => b.overall_completion_pct - a.overall_completion_pct,
      activity: (a, b) =>
        (b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0) -
        (a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0),
    };
    return [...list].sort(cmp[sort]);
  }, [team, q, filter, sort]);

  const totalCount = team.length;
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of team) c[m.status] = (c[m.status] ?? 0) + 1;
    return c;
  }, [team]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="hero-text">Команда</h1>
        <p className="mt-2 text-base text-navy-900/60 dark:text-white/60">
          Всего сотрудников с ролью «user»: <strong>{totalCount}</strong>
        </p>
      </header>

      <GlassCard className="!p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-900/40 dark:text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по имени, email или подразделению"
              className="input !pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <SortAsc size={14} className="text-navy-900/50 dark:text-white/50" />
            <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortBy)}>
              <option value="xp">По XP</option>
              <option value="completion">По прогрессу</option>
              <option value="activity">По активности</option>
              <option value="name">По имени</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label={`Все · ${totalCount}`} />
          {(["not_started", "onboarding", "progressing", "ready", "excellent"] as const).map((s) => (
            <FilterChip
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              label={`${STATUS_META[s].label} · ${statusCounts[s] ?? 0}`}
            />
          ))}
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_120px_120px_140px] items-center gap-4 border-b border-navy-900/8 bg-navy-900/[0.02] px-6 py-3 text-[10px] uppercase tracking-widest text-navy-900/50 dark:border-white/8 dark:bg-white/[0.02] dark:text-white/50">
          <div>Сотрудник</div>
          <div>Подразделение</div>
          <div>Прогресс</div>
          <div>Модули</div>
          <div className="text-right">Статус</div>
        </div>
        <div className="divide-y divide-navy-900/8 dark:divide-white/8">
          {visible.map((m) => (
            <Link
              key={m.id}
              to={`/hr/users/${m.id}`}
              className="grid grid-cols-[1.4fr_1fr_120px_120px_140px] items-center gap-4 px-6 py-3 transition hover:bg-white/40 dark:hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-xs font-bold text-navy-900">
                  {m.full_name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{m.full_name}</div>
                  <div className="truncate text-[11px] text-navy-900/50 dark:text-white/50">{m.email}</div>
                </div>
              </div>
              <div className="text-xs text-navy-900/70 dark:text-white/70">
                <div>{m.department || "—"}</div>
                <div className="text-[10px] text-navy-900/40 dark:text-white/40">{m.program || "—"}</div>
              </div>
              <div className="text-xs">
                <div className="font-semibold tabular-nums">{m.overall_completion_pct}%</div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                    style={{ width: `${m.overall_completion_pct}%` }}
                  />
                </div>
                <div className="mt-0.5 text-[10px] text-navy-900/40 dark:text-white/40">{m.total_xp} XP · L{m.level}</div>
              </div>
              <div className="text-xs tabular-nums">
                <div>К {m.courses_done}/{m.courses_total}</div>
                <div className="text-[10px] text-navy-900/40 dark:text-white/40">С {m.scenarios_done}/{m.scenarios_total}</div>
              </div>
              <div className="text-right">
                <StatusPill status={m.status} />
                {m.last_activity_at && (
                  <div className="mt-1 text-[10px] text-navy-900/40 dark:text-white/40">
                    {new Date(m.last_activity_at).toLocaleDateString("ru-RU")}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {visible.length === 0 && (
            <div className="p-10 text-center text-sm text-navy-900/50 dark:text-white/50">
              Никого не нашлось по выбранному фильтру.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
        active
          ? "bg-navy-900 text-white dark:bg-white dark:text-navy-900"
          : "bg-navy-900/5 text-navy-900/70 hover:bg-navy-900/10 dark:bg-white/8 dark:text-white/70 dark:hover:bg-white/15"
      }`}
    >
      {label}
    </button>
  );
}
