import { motion } from "framer-motion";
import { LevelInfo } from "../api";
import { Sparkles } from "lucide-react";

export default function XPBar({ level }: { level: LevelInfo }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 shadow-soft">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">
              Уровень {level.level}
            </div>
            <div className="font-display text-lg font-semibold">{level.title}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-semibold tabular-nums">{level.xp} XP</div>
          {level.xp_to_next > 0 && (
            <div className="text-xs text-navy-900/50 dark:text-white/50">
              до следующего: {level.xp_to_next}
            </div>
          )}
        </div>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
          initial={{ width: 0 }}
          animate={{ width: `${level.progress_pct}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.2 }}
        />
      </div>
    </div>
  );
}
