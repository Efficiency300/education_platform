import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Gamepad2,
  GraduationCap,
  MessagesSquare,
  PlayCircle,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { ActivityItem } from "../api";
import { useT } from "../state/LocaleContext";

const KIND_META: Record<string, { icon: any; color: string }> = {
  lesson_completed: { icon: BookOpen, color: "bg-sky-500/15 text-sky-600 dark:text-sky-300" },
  course_started: { icon: PlayCircle, color: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  course_completed: { icon: GraduationCap, color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  quiz_passed: { icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  quiz_failed: { icon: XCircle, color: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
  scenario_started: { icon: PlayCircle, color: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  scenario_completed: { icon: Trophy, color: "bg-gold-500/15 text-gold-700 dark:text-gold-300" },
  chat_asked: { icon: MessagesSquare, color: "bg-navy-900/8 text-navy-900 dark:bg-white/10 dark:text-white" },
  badge_earned: { icon: Sparkles, color: "bg-gold-500/15 text-gold-700 dark:text-gold-300" },
};

const FALLBACK = { icon: Activity, color: "bg-navy-900/8 text-navy-900 dark:bg-white/10 dark:text-white" };

function useRelativeTime() {
  const t = useT();
  return (iso: string): string => {
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - then);
    const min = Math.floor(diff / 60000);
    if (min < 1) return t("common.timeAgoNow");
    if (min < 60) return t("common.timeAgoMin", { n: min });
    const hr = Math.floor(min / 60);
    if (hr < 24) return t("common.timeAgoHr", { n: hr });
    const d = Math.floor(hr / 24);
    if (d < 7) return t("common.timeAgoDay", { n: d });
    return new Date(iso).toLocaleDateString();
  };
}

export default function ActivityFeed({
  items,
  emptyHint,
  limit,
}: {
  items: ActivityItem[];
  emptyHint?: string;
  limit?: number;
}) {
  const t = useT();
  const relativeTime = useRelativeTime();
  const list = limit ? items.slice(0, limit) : items;
  const empty = emptyHint ?? t("act.empty");

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-navy-900/15 p-8 text-center text-sm text-navy-900/50 dark:border-white/15 dark:text-white/50">
        <Gamepad2 size={20} className="mx-auto mb-2 opacity-50" />
        {empty}
      </div>
    );
  }

  return (
    <ol className="relative space-y-1 border-l border-navy-900/10 pl-4 dark:border-white/10">
      {list.map((item, i) => {
        const meta = KIND_META[item.kind] ?? FALLBACK;
        const Icon = meta.icon;
        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.03 * i }}
            className="relative py-2"
          >
            <span className="absolute -left-[22px] top-3 flex h-4 w-4 items-center justify-center">
              <span className={`h-4 w-4 rounded-full border-2 border-white dark:border-navy-950 ${meta.color.replace(/text-\S+/g, "").replace("bg-", "bg-")}`} />
            </span>
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-navy-900/50 dark:text-white/50">
                      {t(`act.${item.kind}`)}
                    </div>
                    <div className="text-sm font-semibold">{item.title}</div>
                  </div>
                  <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                    {relativeTime(item.created_at)}
                  </div>
                </div>
                {item.detail && (
                  <div className="mt-0.5 truncate text-xs text-navy-900/60 dark:text-white/60">
                    {item.detail}
                  </div>
                )}
                {item.points > 0 && (
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-gold-700 dark:text-gold-300">
                    +{item.points} XP
                  </div>
                )}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
