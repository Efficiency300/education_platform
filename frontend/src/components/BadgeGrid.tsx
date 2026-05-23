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
        const earned = b.earned;
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.04 * i, duration: 0.2, ease: "easeOut" }}
            whileHover={{ y: -2, transition: { duration: 0.12 } }}
            className="flex flex-col items-center gap-2 p-4 text-center"
            style={{
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-card)",
              border: `0.5px solid ${earned ? "var(--border-brand)" : "var(--border)"}`,
              opacity: earned ? 1 : 0.5,
              filter: earned ? "none" : "grayscale(0.6)",
              transition: "all 0.15s ease",
            }}
            title={b.description}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: earned ? "var(--brand)" : "var(--bg-hover)",
                color: earned ? "#FFFFFF" : "var(--text-tertiary)",
              }}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
              {b.title}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", lineHeight: 1.3 }}>
              {b.description}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
