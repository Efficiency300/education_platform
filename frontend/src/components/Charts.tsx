import { motion } from "framer-motion";
import { AnalyticsBucket } from "../api";

const BRAND = "#994BFF";

/** Простой горизонтальный бар-чарт для процентов (0..100). */
export function HBarChart({ data, max = 100, suffix = "%" }: { data: AnalyticsBucket[]; max?: number; suffix?: string }) {
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = Math.min(100, Math.max(0, (d.value / max) * 100));
        return (
          <div key={d.key + i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate" style={{ color: "var(--text-secondary)" }}>{d.label}</span>
              <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {d.value}
                {suffix}
              </span>
            </div>
            <div
              className="relative h-2 overflow-hidden rounded-full"
              style={{ background: "var(--bg-hover)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.05 * i, duration: 0.25, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: BRAND }}
              />
            </div>
          </div>
        );
      })}
      {data.length === 0 && (
        <div className="py-6 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          —
        </div>
      )}
    </div>
  );
}

/** Вертикальные столбики для распределения (XP buckets и т.п.). */
export function VBarChart({ data, height = 140 }: { data: AnalyticsBucket[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * height);
          return (
            <div key={d.key + i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-full w-full items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ delay: 0.05 * i, duration: 0.25, ease: "easeOut" }}
                  className="w-full rounded-t-md"
                  style={{ background: BRAND }}
                  title={`${d.label}: ${d.value}`}
                />
              </div>
              <div
                className="w-full text-center text-[10px] leading-tight"
                style={{ color: "var(--text-tertiary)" }}
              >
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Линия активности по дням (SVG, без зависимостей). */
export function Sparkline({ data, height = 80 }: { data: AnalyticsBucket[]; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100;
  // Inset chart by 2 units left/right and 6 px top/bottom so the line and
  // dots never get clipped by the SVG bounding box.
  const padX = 2;
  const padTop = 6;
  const padBottom = 6;
  const innerW = w - padX * 2;
  const innerH = height - padTop - padBottom;
  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * innerW;
    const y = padTop + (1 - d.value / max) * innerH;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${path} L ${points[points.length - 1][0]} ${height} L ${points[0][0]} ${height} Z`;
  return (
    <div className="w-full" style={{ overflow: "hidden" }}>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity="0.30" />
            <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#spark-grad)" />
        <path
          d={path}
          stroke={BRAND}
          strokeWidth="1.5"
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.4" fill={BRAND} />
        ))}
      </svg>
      <div
        className="mt-2 flex items-center justify-between text-[10px]"
        style={{ color: "var(--text-tertiary)" }}
      >
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** Donut с одним значением (для overall %). */
export function Donut({ value, label, color = BRAND, size = 120 }: { value: number; label?: string; color?: string; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c * (1 - pct / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-hover)"
          strokeWidth="8"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="tabular-nums"
          style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}
        >
          {Math.round(pct)}%
        </div>
        {label && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginTop: 2,
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
