import { useT } from "../../state/LocaleContext";

interface Props {
  current: number;
  total: number;
}

/** Step dots + "Step X of Y" counter, used at the bottom of the North panel. */
export default function NorthProgress({ current, total }: Props) {
  const t = useT();
  if (total <= 0) return null;
  // Clamp so a freshly-completed scenario reads "X of X" rather than "X+1 of X".
  const shown = Math.max(1, Math.min(current + 1, total));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="north-dots">
        {Array.from({ length: total }).map((_, idx) => (
          <span
            key={idx}
            className={`north-dot ${idx < current ? "north-dot-done" : idx === current ? "north-dot-active" : ""}`}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {t("nors.stepCounter", { n: shown, total })}
      </div>
      <style>{`
        .north-dots {
          display: flex;
          gap: 4px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .north-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--border-emphasis);
          transition: background 0.2s, transform 0.2s;
        }
        .north-dot-active {
          background: var(--brand);
          transform: scale(1.3);
        }
        .north-dot-done { background: var(--brand-dim); }
      `}</style>
    </div>
  );
}
