import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AnalyticsBucket } from "../api";
import { useT } from "../state/LocaleContext";

const BRAND = "#994BFF";

type Period = "7" | "14" | "30";

interface Props {
  /** Daily buckets from the backend, oldest → newest. */
  data: AnalyticsBucket[];
  /** Initial period (in days). */
  initialPeriod?: Period;
}

/**
 * Self-contained activity chart with a period picker. Sizes itself to its
 * card so it never overflows.
 */
export default function ActivityChart({ data, initialPeriod = "14" }: Props) {
  const t = useT();
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const sliced = useMemo<AnalyticsBucket[]>(() => {
    if (period === "30") return data;
    const days = parseInt(period, 10);
    return data.slice(-days);
  }, [data, period]);

  const max = Math.max(1, ...sliced.map((d) => d.value));
  const periods: { id: Period; label: string }[] = [
    { id: "7", label: t("chart.period7") },
    { id: "14", label: t("chart.period14") },
    { id: "30", label: t("chart.period30") },
  ];

  // Drawing constants.
  const VB_W = 320;
  const VB_H = 120;
  const padX = 8;
  const padTop = 10;
  const padBottom = 22;
  const innerW = VB_W - padX * 2;
  const innerH = VB_H - padTop - padBottom;

  const points = sliced.map((d, i) => {
    const x =
      sliced.length === 1
        ? padX + innerW / 2
        : padX + (i / (sliced.length - 1)) * innerW;
    const y = padTop + (1 - d.value / max) * innerH;
    return { x, y, value: d.value, label: d.label };
  });

  const path =
    points.length === 0
      ? ""
      : points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
          .join(" ");
  const baselineY = padTop + innerH;
  const areaPath =
    points.length === 0
      ? ""
      : `${path} L ${points[points.length - 1].x.toFixed(2)} ${baselineY} L ${points[0].x.toFixed(2)} ${baselineY} Z`;

  // Pick a sparse subset of x-axis labels so the line stays readable.
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));

  return (
    <div className="flex flex-col gap-3" style={{ minWidth: 0 }}>
      <div className="flex justify-end">
        <div className="lang-wrap lang-wrap-inline" role="group" aria-label="Period">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`lang-btn ${period === p.id ? "lang-btn-active" : ""}`}
              style={{ flex: "0 0 auto" }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", overflow: "hidden" }}>
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", width: "100%", height: "auto", maxHeight: 200 }}
          aria-label="Activity over time"
        >
          <defs>
            <linearGradient id="activity-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity="0.28" />
              <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Baseline */}
          <line
            x1={padX}
            x2={VB_W - padX}
            y1={baselineY}
            y2={baselineY}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />

          {points.length > 0 && (
            <>
              <motion.path
                d={areaPath}
                fill="url(#activity-area)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.path
                d={path}
                stroke={BRAND}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2" fill={BRAND} />
              ))}
            </>
          )}

          {/* x-axis labels */}
          {points.map((p, i) =>
            i % labelEvery === 0 || i === points.length - 1 ? (
              <text
                key={`l${i}`}
                x={p.x}
                y={VB_H - 6}
                fontSize="8"
                fontFamily="Wix Madefor Display, sans-serif"
                fill="rgba(199,199,199,0.7)"
                textAnchor="middle"
              >
                {p.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>
    </div>
  );
}
