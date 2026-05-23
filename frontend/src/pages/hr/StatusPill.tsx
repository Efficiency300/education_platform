import { TeamMember } from "../../api";
import { useT } from "../../state/LocaleContext";

export const STATUS_CLS: Record<TeamMember["status"], string> = {
  not_started: "bg-navy-900/8 text-navy-900/70 dark:bg-white/10 dark:text-white/70",
  onboarding: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  progressing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  excellent: "bg-gradient-to-r from-gold-400/30 to-gold-600/30 text-gold-800 dark:text-gold-200",
};

export function useStatusLabel() {
  const t = useT();
  return (status: TeamMember["status"]) => t(`status.${status}`);
}

export default function StatusPill({ status }: { status: TeamMember["status"] }) {
  const label = useStatusLabel()(status);
  const cls = STATUS_CLS[status] ?? STATUS_CLS.not_started;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}
