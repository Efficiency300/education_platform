import { motion } from "framer-motion";
import { Rocket, Sparkles, Trophy, Medal, GraduationCap, Award, BookOpen } from "lucide-react";
import { Badge } from "../api";

const ICONS: Record<string, any> = {
  rocket: Rocket,
  sparkles: Sparkles,
  trophy: Trophy,
  medal: Medal,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
};

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {badges.map((b, i) => {
        const Icon = ICONS[b.icon] ?? Award;
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i, type: "spring", stiffness: 220, damping: 22 }}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
            className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-300 ${
              b.earned
                ? "border-gold-500/30 bg-gradient-to-br from-gold-50/80 to-white/40 shadow-soft dark:from-gold-500/15 dark:to-transparent"
                : "border-navy-900/8 bg-white/40 opacity-50 dark:border-white/8 dark:bg-white/[0.03]"
            }`}
            title={b.description}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                b.earned
                  ? "bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 shadow-soft"
                  : "bg-navy-900/5 text-navy-900/40 dark:bg-white/5 dark:text-white/30"
              }`}
            >
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="text-xs font-semibold leading-tight">{b.title}</div>
            <div className="text-[10px] leading-tight text-navy-900/50 dark:text-white/40">
              {b.description}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
