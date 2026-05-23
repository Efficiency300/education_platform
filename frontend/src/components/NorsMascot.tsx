import { motion } from "framer-motion";

/**
 * Норс — the brand mascot. A stylised compass head reusing the brand purple
 * so it sits naturally next to the rest of the KOMPAS UI without adding a new
 * accent colour. The SVG is intentionally small (single visual layer) so it
 * stays sharp at every size we render it at.
 */
export default function NorsMascot({
  size = 96,
  animated = true,
  label,
}: {
  size?: number;
  animated?: boolean;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label ?? "Норс"}
      style={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      {/* soft glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -size * 0.18,
          borderRadius: "50%",
          background: "var(--brand-glow)",
          filter: `blur(${size * 0.22}px)`,
          opacity: animated ? 0.9 : 0.6,
          pointerEvents: "none",
        }}
      />
      <motion.svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        initial={animated ? { rotate: -4 } : undefined}
        animate={animated ? { rotate: [-4, 4, -4] } : undefined}
        transition={animated ? { duration: 8, ease: "easeInOut", repeat: Infinity } : undefined}
        style={{ display: "block", position: "relative" }}
      >
        {/* head — outer ring */}
        <circle cx="60" cy="60" r="56" fill="#1F1F1F" stroke="#994BFF" strokeWidth="3" />
        {/* compass dial */}
        <circle cx="60" cy="60" r="44" fill="#262626" stroke="rgba(153,75,255,0.4)" strokeWidth="1" />
        {/* cardinal ticks */}
        {[0, 90, 180, 270].map((deg) => (
          <line
            key={deg}
            x1="60"
            y1="20"
            x2="60"
            y2="26"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${deg} 60 60)`}
          />
        ))}
        {/* needle — north (brand) */}
        <polygon points="60,22 54,60 60,56 66,60" fill="#994BFF" />
        {/* needle — south */}
        <polygon points="60,98 54,60 60,64 66,60" fill="#F5F5F5" />
        {/* center cap */}
        <circle cx="60" cy="60" r="5" fill="#FFFFFF" />
        {/* eyes — set at NW/NE of centre so the mascot reads as friendly */}
        <circle cx="48" cy="72" r="2.5" fill="#1F1F1F" />
        <circle cx="72" cy="72" r="2.5" fill="#1F1F1F" />
        {/* tiny smile */}
        <path
          d="M52 84 Q60 90 68 84"
          stroke="#1F1F1F"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        {/* "N" badge */}
        <text
          x="60"
          y="44"
          textAnchor="middle"
          fontFamily="Wix Madefor Display, sans-serif"
          fontSize="11"
          fontWeight="700"
          fill="#FFFFFF"
          opacity="0.85"
        >
          N
        </text>
      </motion.svg>
    </div>
  );
}
