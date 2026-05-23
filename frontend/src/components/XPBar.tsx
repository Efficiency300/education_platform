import { motion } from "framer-motion";
import { LevelInfo } from "../api";
import { Sparkles } from "lucide-react";
import { useT } from "../state/LocaleContext";

export default function XPBar({ level }: { level: LevelInfo }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "var(--brand)",
              color: "#FFFFFF",
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                fontWeight: 500,
              }}
            >
              {t("common.level")} {level.level}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {level.title}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className="tabular-nums"
            style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}
          >
            {level.xp} {t("common.xp")}
          </div>
          {level.xp_to_next > 0 && (
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
              +{level.xp_to_next} {t("common.xp")}
            </div>
          )}
        </div>
      </div>
      <div className="kp-progress-track" style={{ height: 6 }}>
        <motion.div
          className="kp-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${level.progress_pct}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
