import { motion } from "framer-motion";
import { AnalyticsBucket } from "../api";

/** Простой горизонтальный бар-чарт для процентов (0..100). */
export function HBarChart({ data, max = 100, suffix = "%" }: { data: AnalyticsBucket[]; max?: number; suffix?: string }) {
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = Math.min(100, Math.max(0, (d.value / max) * 100));
        return (
          <div key={d.key + i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-navy-900/70 dark:text-white/70">{d.label}</span>
              <span className="font-semibold tabular-nums">
                {d.value}
                {suffix}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-navy-900/8 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.05 * i, type: "spring", stiffness: 70, damping: 18 }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
              />
            </div>
          </div>
        );
      })}
      {data.length === 0 && (
        <div className="py-6 text-center text-xs text-navy-900/40 dark:text-white/40">Нет данных</div>
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
                  transition={{ delay: 0.05 * i, type: "spring", stiffness: 80, damping: 18 }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-gold-400 to-gold-600"
                  title={`${d.label}: ${d.value}`}
                />
              </div>
              <div className="w-full text-center text-[10px] leading-tight text-navy-900/60 dark:text-white/60">
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
  const w = 100; // viewBox единицы
  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * w;
    const y = height - (d.value / max) * (height - 8) - 4;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${path} L ${w} ${height} L 0 ${height} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#spark-grad)" />
        <path d={path} stroke="#C9A84C" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.4" fill="#C9A84C" />
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] text-navy-900/40 dark:text-white/40">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** Donut с одним значением (для overall %). */
export function Donut({ value, label, color = "#C9A84C", size = 120 }: { value: number; label?: string; color?: string; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c * (1 - pct / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-navy-900/8 dark:text-white/10" />
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
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-2xl font-semibold tabular-nums">{Math.round(pct)}%</div>
        {label && <div className="text-[10px] uppercase tracking-wider text-navy-900/50 dark:text-white/50">{label}</div>}
      </div>
    </div>
  );
}
