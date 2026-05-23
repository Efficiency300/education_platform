import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { useProgress } from "../state/ProgressContext";

const STYLES: Record<string, { bg: string; icon: any }> = {
  ok: {
    bg: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    icon: CheckCircle2,
  },
  info: {
    bg: "border-navy-900/15 bg-white/80 text-navy-900 dark:border-white/10 dark:bg-white/10 dark:text-white",
    icon: Info,
  },
  warn: {
    bg: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
    icon: AlertTriangle,
  },
  err: {
    bg: "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100",
    icon: AlertTriangle,
  },
};

export default function Toaster() {
  const { toasts, dismissToast } = useProgress();
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:translate-x-0">
      <AnimatePresence>
        {toasts.map((t) => {
          const s = STYLES[t.kind] ?? STYLES.info;
          const Icon = s.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-glass-lg backdrop-blur-xl ${s.bg}`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <div className="flex-1 leading-relaxed">{t.text}</div>
              <button
                onClick={() => dismissToast(t.id)}
                className="rounded-full p-0.5 opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
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
