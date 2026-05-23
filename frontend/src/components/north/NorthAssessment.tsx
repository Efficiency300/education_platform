import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, RotateCw, Sparkles } from "lucide-react";
import {
  api,
  NorthAssessSubmit,
  NorthAssessmentQuestion,
} from "../../api";
import { useLocale, useT } from "../../state/LocaleContext";
import NorthBubble from "./NorthBubble";
import NorthMascot from "./NorthMascot";
import NorthProgress from "./NorthProgress";

type Phase =
  | { kind: "loading" }
  | { kind: "ready"; intro: string; questions: NorthAssessmentQuestion[]; cursor: number; picked: Record<string, string> }
  | { kind: "submitting" }
  | { kind: "result"; result: NorthAssessSubmit };

/**
 * Mini skill-check driven by the LangGraph agent on the backend. Three phases:
 *   1. Loading — fetch the generated questions from /north/assess/start.
 *   2. Ready — walk through the questions one by one (one choice per step).
 *   3. Result — North summarises the score and offers to open the recommended
 *      course. We navigate after a short delay so the celebrate animation
 *      gets to play.
 */
export default function NorthAssessment({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  const begin = useCallback(async () => {
    setPhase({ kind: "loading" });
    try {
      const data = await api.northAssessStart(locale);
      setPhase({
        kind: "ready",
        intro: data.intro,
        questions: data.questions,
        cursor: 0,
        picked: {},
      });
    } catch (e) {
      console.error(e);
      onClose();
    }
  }, [onClose, locale]);

  useEffect(() => {
    begin().catch(console.error);
  }, [begin]);

  // ---- phase: loading ---------------------------------------------------
  if (phase.kind === "loading" || phase.kind === "submitting") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <NorthMascot state="thinking" height={160} />
        <NorthBubble
          message={phase.kind === "loading" ? t("nors.assess.preparing") : t("nors.assess.evaluating")}
        />
      </div>
    );
  }

  // ---- phase: result ---------------------------------------------------
  if (phase.kind === "result") {
    const { result } = phase;
    const passed = result.correct_pct >= 50;
    return (
      <div className="flex flex-col gap-4">
        <NorthMascot state={passed ? "celebrating" : "thinking"} height={180} />
        <NorthBubble message={result.message} />
        <div
          style={{
            padding: 12,
            background: "var(--bg-card)",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-secondary)" }}>
              {t("nors.assess.score")}
            </span>
            <strong style={{ color: "var(--brand)" }}>
              {result.score} / {result.max} · {result.correct_pct}%
            </strong>
          </div>
          {result.gaps.length > 0 && (
            <div className="mt-2" style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {t("nors.assess.gaps")}: {result.gaps.join(", ")}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={begin} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
            <RotateCw size={12} /> {t("nors.assess.retry")}
          </button>
          {result.navigate?.type === "course" ? (
            <button
              className="btn-primary"
              onClick={() => {
                onClose();
                // Tiny delay so the celebrate animation gets to play.
                window.setTimeout(() => {
                  navigate(`/courses/${result.navigate!.target}`);
                }, 350);
              }}
            >
              <Sparkles size={14} /> {t("nors.assess.openCourse")}
            </button>
          ) : (
            <button className="btn-secondary" onClick={onClose}>
              {t("common.cancel")}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- phase: ready -----------------------------------------------------
  const { questions, cursor, picked, intro } = phase;
  const q = questions[cursor];

  const submitAll = async (finalPicked: Record<string, string>) => {
    setPhase({ kind: "submitting" });
    try {
      const result = await api.northAssessSubmit(questions, finalPicked, locale);
      setPhase({ kind: "result", result });
    } catch (e) {
      console.error(e);
      onClose();
    }
  };

  const pick = async (optionId: string) => {
    const next = { ...picked, [q.id]: optionId };
    if (cursor < questions.length - 1) {
      setPhase({ ...phase, cursor: cursor + 1, picked: next });
    } else {
      await submitAll(next);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <NorthMascot state="listening" height={180} />

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          {cursor === 0 && (
            <div
              style={{
                padding: "6px 12px",
                background: "var(--brand-subtle)",
                border: "0.5px solid var(--border-brand)",
                borderRadius: 99,
                color: "var(--brand)",
                fontSize: 11,
                fontWeight: 500,
                alignSelf: "flex-start",
              }}
            >
              {intro}
            </div>
          )}
          <NorthBubble message={q.question} speed={20} />
          <div className="flex flex-col gap-2">
            {q.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => pick(opt.id)}
                className="north-choice"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "0.5px solid var(--border-brand)",
                  background: "var(--brand-subtle)",
                  color: "var(--brand)",
                  fontFamily: "var(--font-kompas)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
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
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <NorthProgress current={cursor} total={questions.length} />
      <style>{`
        .north-choice:hover { background: var(--brand); color: #FFFFFF; }
      `}</style>
    </div>
  );
}
