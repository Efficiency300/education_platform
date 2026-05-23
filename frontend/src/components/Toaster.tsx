import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { useProgress } from "../state/ProgressContext";

const STYLES: Record<string, { color: string; icon: any }> = {
  ok:   { color: "var(--success)", icon: CheckCircle2 },
  info: { color: "var(--brand)", icon: Info },
  warn: { color: "var(--warning)", icon: AlertTriangle },
  err:  { color: "var(--danger)", icon: AlertTriangle },
};

export default function Toaster() {
  const { toasts, dismissToast } = useProgress();
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:translate-x-0">
      <AnimatePresence>
        {toasts.map((tItem) => {
          const s = STYLES[tItem.kind] ?? STYLES.info;
          const Icon = s.icon;
          return (
            <motion.div
              key={tItem.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="pointer-events-auto flex items-start gap-3"
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-elevated)",
                border: `0.5px solid ${s.color}`,
                color: "var(--text-primary)",
                fontSize: 13,
              }}
            >
              <Icon size={16} className="mt-0.5 shrink-0" style={{ color: s.color }} />
              <div className="flex-1 leading-relaxed">{tItem.text}</div>
              <button
                onClick={() => dismissToast(tItem.id)}
                aria-label="Закрыть"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  padding: 2,
                  borderRadius: 6,
                }}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
