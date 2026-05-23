import { useEffect, useRef, useState } from "react";
import { NorthState } from "../../api";

import chillingUrl from "../../assets/north/chilling.svg";
import codingUrl from "../../assets/north/coding.svg";
import inLoveUrl from "../../assets/north/in-love.svg";
import shockUrl from "../../assets/north/shock.svg";
import stoneedUrl from "../../assets/north/stoneed.svg";
import tooMuchSauceUrl from "../../assets/north/too-much-sauce.svg";
import watchingUrl from "../../assets/north/watching.svg";

/** Visual state → asset URL. */
const STATE_TO_SVG: Record<NorthState, string> = {
  idle: chillingUrl,
  thinking: codingUrl,
  celebrating: inLoveUrl,
  surprised: shockUrl,
  waiting: stoneedUrl,
  hyped: tooMuchSauceUrl,
  listening: watchingUrl,
};

interface Props {
  state: NorthState;
  /** Container height; mascot scales to fit while preserving aspect ratio. */
  height?: number;
  /** Render the mascot smaller (e.g. for the mobile floating button). */
  size?: "default" | "small";
}

/**
 * Render the current North mascot SVG, crossfading from the previous state
 * via opacity. Both states sit absolutely-positioned in the same container,
 * so the layout never jumps even though the SVG aspect ratios differ.
 */
export default function NorthMascot({ state, height = 200, size = "default" }: Props) {
  // Track the previous state so we can render both at once during the fade.
  const [renderedStates, setRenderedStates] = useState<NorthState[]>([state]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setRenderedStates((prev) => {
      if (prev[prev.length - 1] === state) return prev;
      return [...prev, state];
    });
    // After the crossfade completes, drop any stale states so the DOM stays light.
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setRenderedStates([state]);
    }, 320);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [state]);

  return (
    <div
      className="north-mascot-wrap"
      style={{
        position: "relative",
        height,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {renderedStates.map((s, idx) => {
        const isCurrent = idx === renderedStates.length - 1;
        return (
          <img
            key={`${s}-${idx}`}
            src={STATE_TO_SVG[s]}
            alt={`North — ${s}`}
            style={{
              position: "absolute",
              bottom: 0,
              maxHeight: height,
              maxWidth: size === "small" ? height : "85%",
              width: "auto",
              opacity: isCurrent ? 1 : 0,
              transition: "opacity 0.3s ease",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </div>
  );
}
