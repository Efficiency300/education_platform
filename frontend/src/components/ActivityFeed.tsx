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

type Meta = { icon: any; color: string };

const KIND_META: Record<string, Meta> = {
  lesson_completed: { icon: BookOpen, color: "var(--brand)" },
  course_started: { icon: PlayCircle, color: "var(--warning)" },
  course_completed: { icon: GraduationCap, color: "var(--success)" },
  quiz_passed: { icon: CheckCircle2, color: "var(--success)" },
  quiz_failed: { icon: XCircle, color: "var(--danger)" },
  scenario_started: { icon: PlayCircle, color: "var(--warning)" },
  scenario_completed: { icon: Trophy, color: "var(--brand)" },
  chat_asked: { icon: MessagesSquare, color: "var(--text-secondary)" },
  badge_earned: { icon: Sparkles, color: "var(--brand)" },
};

const FALLBACK: Meta = { icon: Activity, color: "var(--text-secondary)" };

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
      <div
        className="text-center text-sm"
        style={{
          padding: "32px 16px",
          borderRadius: "var(--radius-lg)",
          border: "0.5px dashed var(--border-emphasis)",
          color: "var(--text-tertiary)",
        }}
      >
        <Gamepad2 size={20} className="mx-auto mb-2 opacity-60" />
        {empty}
      </div>
    );
  }

  return (
    <ol
      className="relative space-y-1 pl-4"
      style={{ borderLeft: "0.5px solid var(--border-emphasis)" }}
    >
      {list.map((item, i) => {
        const meta = KIND_META[item.kind] ?? FALLBACK;
        const Icon = meta.icon;
        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.02 * i, duration: 0.18, ease: "easeOut" }}
            className="relative py-2"
          >
            <span
              className="absolute flex items-center justify-center"
              style={{
                left: -22,
                top: 12,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: meta.color,
                border: "2px solid var(--bg-card)",
              }}
            />
            <div className="flex items-start gap-3">
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: meta.color === "var(--text-secondary)" ? "var(--bg-hover)" : meta.color,
                  color: "#FFFFFF",
                }}
              >
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div className="min-w-0">
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: "var(--text-tertiary)",
                        fontWeight: 500,
                      }}
                    >
                      {t(`act.${item.kind}`)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.title}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    {relativeTime(item.created_at)}
                  </div>
                </div>
                {item.detail && (
                  <div
                    className="mt-0.5 truncate"
                    style={{ fontSize: 12, color: "var(--text-secondary)" }}
                  >
                    {item.detail}
                  </div>
                )}
                {item.points > 0 && (
                  <div
                    className="mt-1 inline-flex items-center gap-1"
                    style={{
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "var(--brand-subtle)",
                      border: "0.5px solid var(--border-brand)",
                      color: "var(--brand)",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
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
