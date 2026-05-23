import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { api, FlowProgress } from "../api";
import { useT } from "../state/LocaleContext";
import NorsMascot from "./NorsMascot";

const DISMISS_KEY = "kompas_nors_resume_dismissed_v1";

/**
 * "Привет, я Норс — продолжим с того места, где остановились" card.
 * Shown on the Dashboard once per session for users who have a flow
 * in progress. Dismissing it hides the card for the current login.
 */
export default function NorsResumeCard() {
  const t = useT();
  const [progress, setProgress] = useState<FlowProgress | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (dismissed) return;
    api.myFlow().then(setProgress).catch(() => setProgress(null));
  }, [dismissed]);

  if (dismissed) return null;
  if (!progress?.flow) return null;
  if (progress.is_completed) return null;
  if (progress.total_steps === 0) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const stepNo = Math.min(progress.current_step + 1, progress.total_steps);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-4 card-brand card"
      style={{ padding: 16 }}
    >
      <NorsMascot size={56} />
      <div className="min-w-0 flex-1">
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          {t("nors.resume.title", { name: t("nors.name") })}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {t("nors.resume.body", {
            flow: progress.flow.name,
            step: stepNo,
            total: progress.total_steps,
          })}
        </div>
      </div>
      <Link to="/chat" className="btn-primary" onClick={dismiss}>
        {t("nors.resume.cta")} <ArrowRight size={14} />
      </Link>
      <button
        onClick={dismiss}
        aria-label={t("common.cancel")}
        style={{
          width: 28,
          height: 28,
          background: "transparent",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-tertiary)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}
