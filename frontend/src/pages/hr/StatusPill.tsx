import { TeamMember } from "../../api";

export const STATUS_META: Record<TeamMember["status"], { label: string; cls: string }> = {
  not_started: { label: "Не начал", cls: "bg-navy-900/8 text-navy-900/70 dark:bg-white/10 dark:text-white/70" },
  onboarding: { label: "Онбординг", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  progressing: { label: "В процессе", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  ready: { label: "Готов к работе", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  excellent: { label: "Образцовый", cls: "bg-gradient-to-r from-gold-400/30 to-gold-600/30 text-gold-800 dark:text-gold-200" },
};

export default function StatusPill({ status }: { status: TeamMember["status"] }) {
  const m = STATUS_META[status] ?? STATUS_META.not_started;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}
