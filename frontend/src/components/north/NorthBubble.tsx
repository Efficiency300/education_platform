import { useEffect, useRef, useState } from "react";

interface Props {
  /** Final text to type out. Triggers a fresh typewriter on every change. */
  message: string;
  /** Skip the animation and render immediately (e.g. when restoring history). */
  instant?: boolean;
  /** How long each character takes, in ms. */
  speed?: number;
  /** Optional callback fired once the typewriter has finished revealing. */
  onDone?: () => void;
}

/**
 * Typewriter speech bubble. Replays from scratch each time ``message``
 * changes; cancels any in-flight animation so two rapid changes don't
 * interleave characters from both messages.
 */
export default function NorthBubble({ message, instant = false, speed = 30, onDone }: Props) {
  const [shown, setShown] = useState<string>(instant ? message : "");
  const timer = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (instant) {
      setShown(message);
      onDoneRef.current?.();
      return;
    }
    setShown("");
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(message.slice(0, i));
      if (i >= message.length) {
        onDoneRef.current?.();
        timer.current = null;
        return;
      }
      timer.current = window.setTimeout(tick, speed);
    };
    timer.current = window.setTimeout(tick, speed);
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [message, speed, instant]);

  const isTyping = shown.length < message.length;

  return (
    <div className="north-bubble" aria-live="polite">
      <span style={{ whiteSpace: "pre-wrap" }}>{shown}</span>
      {isTyping && <span className="north-bubble-cursor">█</span>}
      <style>{`
        .north-bubble {
          position: relative;
          background: var(--brand-subtle);
          border: 0.5px solid var(--border-brand);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary);
          /* Pointer toward the mascot. */
        }
        .north-bubble::before {
          content: "";
          position: absolute;
          top: -8px;
          left: 28px;
          width: 14px;
          height: 14px;
          background: var(--brand-subtle);
          border-left: 0.5px solid var(--border-brand);
          border-top: 0.5px solid var(--border-brand);
          transform: rotate(45deg);
        }
        .north-bubble-cursor {
          display: inline-block;
          margin-left: 2px;
          color: var(--brand);
          animation: north-bubble-blink 0.9s steps(1) infinite;
        }
        @keyframes north-bubble-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
