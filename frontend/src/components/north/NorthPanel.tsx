import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RotateCw, X } from "lucide-react";
import { useAuth } from "../../state/AuthContext";
import { useT } from "../../state/LocaleContext";
import NorthBubble from "./NorthBubble";
import NorthInput from "./NorthInput";
import NorthMascot from "./NorthMascot";
import NorthProgress from "./NorthProgress";
import { useNorth } from "./useNorth";

/**
 * North lives in two places:
 *   - As a 320px sticky right column on the dashboard (≥ 768px).
 *   - As a floating mascot button that opens a bottom sheet on mobile.
 *
 * The same hook drives both — only the chrome around the inner column differs.
 */
export default function NorthPanel() {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isMobile) return <MobileNorth />;
  return (
    <aside
      className="north-panel"
      style={{
        width: 320,
        flexShrink: 0,
        background: "var(--bg-elevated)",
        borderLeft: "0.5px solid var(--border)",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "sticky",
        top: 52,
        alignSelf: "flex-start",
        height: "calc(100vh - 52px)",
        overflowY: "auto",
      }}
    >
      <NorthInner />
    </aside>
  );
}

function MobileNorth() {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <>
      <button
        type="button"
        aria-label={t("nors.open")}
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 16,
          bottom: 84, // sit above the existing mobile nav
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "0.5px solid var(--border-brand)",
          background: "var(--bg-elevated)",
          padding: 0,
          cursor: "pointer",
          zIndex: 40,
          overflow: "hidden",
        }}
      >
        <NorthMascot state="hyped" height={56} size="small" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-elevated)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderTop: "0.5px solid var(--border-emphasis)",
              padding: "20px 18px 28px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{t("nors.name")}</span>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("common.cancel")}
                style={{
                  width: 32,
                  height: 32,
                  background: "transparent",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>
            <NorthInner />
          </div>
        </div>
      )}
    </>
  );
}

function NorthInner() {
  const { user } = useAuth();
  const t = useT();
  const {
    progress,
    currentStep,
    state,
    isTyping,
    busy,
    onBubbleDone,
    submit,
    reset,
  } = useNorth();

  const firstName = (user?.full_name || "").trim().split(/\s+/)[0] || "";

  // ----- empty state (no scenario published for the user's department) ----
  if (!progress?.scenario) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <NorthMascot state="idle" height={160} />
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          {t("nors.empty.title")}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {t("nors.empty.body", { name: firstName })}
        </p>
      </div>
    );
  }

  // ----- completed state -------------------------------------------------
  if (progress.completed || !currentStep) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <NorthMascot state="celebrating" height={180} />
        <ConfettiBurst />
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          {t("nors.completed.title", { name: firstName })}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {t("nors.completed.body")}
        </p>
        <button onClick={reset} disabled={busy} className="btn-secondary">
          <RotateCw size={14} /> {t("nors.restart")}
        </button>
      </div>
    );
  }

  // ----- active step ------------------------------------------------------
  const messageWithName = currentStep.north_message.replace(/\{name\}/g, firstName || "friend");

  return (
    <div className="flex flex-col gap-4">
      <NorthMascot state={state} height={200} />

      <NorthBubble
        key={currentStep.id}
        message={messageWithName}
        onDone={onBubbleDone}
      />

      {/* Course link (rendered alongside the input rather than as the input). */}
      {currentStep.content_ref && (
        <Link
          to={`/courses/${currentStep.content_ref}`}
          className="btn-secondary"
          style={{ alignSelf: "flex-start" }}
        >
          {t("nors.openCourse")}
        </Link>
      )}

      <NorthInputWithLabels
        type={currentStep.input_type}
        choices={currentStep.choices}
        hidden={isTyping}
        disabled={busy}
        onSubmit={submit}
      />

      <NorthProgress current={progress.current_step} total={progress.total_steps} />
    </div>
  );
}

/** Renders the input + the matching CTA label ("Got it", "Continue"). */
function NorthInputWithLabels(props: React.ComponentProps<typeof NorthInput>) {
  const t = useT();
  if (props.type === "none") {
    return (
      <button
        type="button"
        className="btn-primary"
        disabled={props.disabled || props.hidden}
        onClick={() => props.onSubmit(null)}
        style={{ alignSelf: "flex-end", opacity: props.hidden ? 0 : 1, transition: "opacity 0.2s" }}
      >
        {t("nors.next")}
      </button>
    );
  }
  return <NorthInput {...props} />;
}

/** CSS-only confetti shower used on the completed screen. */
function ConfettiBurst() {
  return (
    <div aria-hidden style={{ position: "relative", width: "100%", height: 0 }}>
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="north-confetti"
          style={{
            left: `${(i * 137) % 100}%`,
            animationDelay: `${(i % 7) * 0.18}s`,
            background: i % 3 === 0 ? "var(--brand)" : i % 3 === 1 ? "var(--success)" : "var(--warning)",
          }}
        />
      ))}
      <style>{`
        .north-confetti {
          position: absolute;
          top: -8px;
          width: 6px;
          height: 10px;
          border-radius: 1px;
          opacity: 0;
          animation: north-confetti-fall 1.6s ease-in forwards;
        }
        @keyframes north-confetti-fall {
          0%   { opacity: 0; transform: translateY(-12px) rotate(0deg); }
          10%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(160px) rotate(420deg); }
        }
      `}</style>
    </div>
  );
}
