import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, RotateCw, Sparkles } from "lucide-react";
import { api, FlowProgress, FlowStep } from "../api";
import { useT } from "../state/LocaleContext";
import NorsMascot from "./NorsMascot";

/**
 * Storyteller view for Норс. Loads the current user's flow on mount, walks
 * them through narrative / question / course-link steps, persists each
 * advance to the backend, and surfaces a "restart" button once everything is
 * done. Designed to live inside the Chat page tab system or as a standalone
 * widget on the dashboard.
 */
export default function NorsView({
  onAdvance,
}: {
  onAdvance?: (next: FlowProgress) => void;
}) {
  const t = useT();
  const [progress, setProgress] = useState<FlowProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<
    null | { kind: "ok" | "warn"; text: string }
  >(null);
  const [revealedHint, setRevealedHint] = useState(false);

  const load = useCallback(async () => {
    const next = await api.myFlow();
    setProgress(next);
    setFeedback(null);
    setRevealedHint(false);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const advance = useCallback(
    async (answer?: Record<string, unknown>) => {
      if (!progress?.flow) return;
      setBusy(true);
      try {
        const next = await api.advanceFlow(progress.flow.id, answer);
        setProgress(next);
        setFeedback(null);
        setRevealedHint(false);
        onAdvance?.(next);
      } finally {
        setBusy(false);
      }
    },
    [progress, onAdvance],
  );

  const restart = useCallback(async () => {
    if (!progress?.flow) return;
    setBusy(true);
    try {
      const next = await api.resetFlow(progress.flow.id);
      setProgress(next);
      setFeedback(null);
      setRevealedHint(false);
    } finally {
      setBusy(false);
    }
  }, [progress]);

  const step = progress?.next_step ?? null;
  const pct = useMemo(() => {
    if (!progress || progress.total_steps === 0) return 0;
    return Math.round((progress.current_step / progress.total_steps) * 100);
  }, [progress]);

  // ── Empty state ────────────────────────────────────────────────────────
  if (!progress || !progress.flow) {
    return (
      <NorsShell pct={0}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
            {t("nors.empty.title")}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 420 }}>
            {t("nors.empty.body")}
          </p>
        </div>
      </NorsShell>
    );
  }

  // ── Completed state ────────────────────────────────────────────────────
  if (progress.is_completed || !step) {
    return (
      <NorsShell pct={100}>
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={32} style={{ color: "var(--success)" }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
            {t("nors.completed.title")}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 440 }}>
            {t("nors.completed.body")}
          </p>
          <button onClick={restart} disabled={busy} className="btn-secondary">
            <RotateCw size={14} /> {t("nors.restart")}
          </button>
        </div>
      </NorsShell>
    );
  }

  // ── Active step ────────────────────────────────────────────────────────
  const handleQuestion = (opt: { id: string; label: string }) => {
    const correct = step.correct_option_id == null || step.correct_option_id === opt.id;
    setFeedback(
      correct
        ? { kind: "ok", text: t("nors.feedback.correct") }
        : { kind: "warn", text: t("nors.feedback.tryAgain") },
    );
    if (correct) {
      // Auto-advance after a short pause so the feedback can render.
      window.setTimeout(() => {
        advance({ option_id: opt.id, correct: true });
      }, 700);
    }
  };

  return (
    <NorsShell pct={pct}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-4"
        >
          {/* Narrator bubble */}
          <div
            style={{
              padding: 18,
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border-emphasis)",
              borderRadius: "var(--radius-lg)",
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {step.text}
          </div>

          {/* Question options */}
          {step.kind === "question" && step.options.length > 0 && (
            <QuestionBlock
              step={step}
              busy={busy}
              feedback={feedback}
              revealedHint={revealedHint}
              onPick={handleQuestion}
              onShowHint={() => setRevealedHint(true)}
            />
          )}

          {/* Course link */}
          {step.kind === "course" && step.course_slug && (
            <div className="flex justify-end">
              <Link to={`/courses/${step.course_slug}`} className="btn-secondary">
                <Sparkles size={14} /> {t("nors.openCourse")}
              </Link>
            </div>
          )}

          {/* Plain narrative → just "next" */}
          {step.kind === "narrative" && (
            <div className="flex justify-end">
              <button onClick={() => advance()} disabled={busy} className="btn-primary">
                {t("nors.next")} <ArrowRight size={14} />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </NorsShell>
  );
}

function NorsShell({ pct, children }: { pct: number; children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <NorsMascot size={64} />
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2"
            style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}
          >
            {t("nors.name")}
            <span className="badge badge-brand" style={{ marginLeft: 4 }}>
              {t("nors.role")}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {t("nors.tagline")}
          </div>
          <div className="mt-2 kp-progress-track">
            <div className="kp-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function QuestionBlock({
  step,
  busy,
  feedback,
  revealedHint,
  onPick,
  onShowHint,
}: {
  step: FlowStep;
  busy: boolean;
  feedback: null | { kind: "ok" | "warn"; text: string };
  revealedHint: boolean;
  onPick: (opt: { id: string; label: string }) => void;
  onShowHint: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2">
      {step.options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onPick(opt)}
          disabled={busy || feedback?.kind === "ok"}
          className="kp-nors-option"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "12px 14px",
            background: "var(--bg-card)",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-kompas)",
            fontSize: 13,
            fontWeight: 500,
            cursor: busy ? "wait" : "pointer",
            textAlign: "left",
            transition: "all 0.15s ease",
          }}
        >
          <span
            style={{
              minWidth: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--brand)",
              color: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {opt.id.toUpperCase()}
          </span>
          <span>{opt.label}</span>
        </button>
      ))}
      <style>{`
        .kp-nors-option:hover:not(:disabled) {
          border-color: var(--border-brand);
          background: var(--bg-hover);
        }
      `}</style>

      {feedback && (
        <div
          style={{
            marginTop: 4,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            fontSize: 12,
            background: feedback.kind === "ok"
              ? "rgba(62,207,142,0.10)"
              : "rgba(245,166,35,0.10)",
            border: `0.5px solid ${feedback.kind === "ok" ? "rgba(62,207,142,0.30)" : "rgba(245,166,35,0.30)"}`,
            color: feedback.kind === "ok" ? "var(--success)" : "var(--warning)",
          }}
        >
          {feedback.text}
        </div>
      )}

      {step.hint && !revealedHint && feedback?.kind !== "ok" && (
        <button
          onClick={onShowHint}
          className="btn-ghost"
          style={{ padding: "4px 10px", fontSize: 11, alignSelf: "flex-start", marginTop: 4 }}
        >
          {t("nors.showHint")}
        </button>
      )}
      {step.hint && revealedHint && feedback?.kind !== "ok" && (
        <div
          style={{
            marginTop: 4,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            background: "var(--brand-subtle)",
            border: "0.5px solid var(--border-brand)",
            color: "var(--brand)",
            fontSize: 12,
          }}
        >
          {step.hint}
        </div>
      )}
    </div>
  );
}
