import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mic, Send } from "lucide-react";
import { NorthInputType } from "../../api";
import { useT } from "../../state/LocaleContext";

interface Props {
  type: NorthInputType;
  choices?: string[];
  disabled?: boolean;
  /** Hide the input entirely (e.g. while North is mid-typewriter). */
  hidden?: boolean;
  onSubmit: (value: string | null) => void;
}

/**
 * Renders the input control matching the current step's expected response.
 * "none" → just a Got-it button; "choice" → pill buttons; "text" → input + send;
 * "voice" → mic button (Web Speech API) with text-input fallback.
 */
export default function NorthInput({ type, choices = [], disabled, hidden, onSubmit }: Props) {
  if (hidden) return null;

  if (type === "none") {
    return (
      <button
        type="button"
        className="btn-primary"
        disabled={disabled}
        onClick={() => onSubmit(null)}
        style={{ alignSelf: "flex-end" }}
      >
        <ArrowRight size={14} /> {/* "Got it" — label provided by panel */}
      </button>
    );
  }

  if (type === "choice") {
    return (
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className="north-choice"
            disabled={disabled}
            onClick={() => onSubmit(choice)}
          >
            {choice}
          </button>
        ))}
        <style>{`
          .north-choice {
            padding: 8px 16px;
            border-radius: 20px;
            border: 0.5px solid var(--border-brand);
            background: var(--brand-subtle);
            color: var(--brand);
            font-family: var(--font-kompas);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
          }
          .north-choice:hover:not(:disabled) {
            background: var(--brand);
            color: #FFFFFF;
          }
          .north-choice:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  if (type === "voice") {
    return <VoiceInput disabled={disabled} onSubmit={onSubmit} />;
  }

  // text
  return <TextInput disabled={disabled} onSubmit={onSubmit} />;
}

function TextInput({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (value: string) => void;
}) {
  const t = useT();
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input"
        placeholder={t("nors.placeholder")}
        disabled={disabled}
        autoFocus
      />
      <button
        type="submit"
        className="btn-primary"
        disabled={disabled || !value.trim()}
        style={{ padding: "9px 12px" }}
      >
        <Send size={14} />
      </button>
    </form>
  );
}

// Minimal Web Speech API typings — the global is non-standard so we declare it.
type SpeechRecognition = any;
declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
}

function VoiceInput({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (value: string) => void;
}) {
  const t = useT();
  const [supported, setSupported] = useState<boolean>(true);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SpeechRecognition | null>(null);
  const silenceTimer = useRef<number | null>(null);

  useEffect(() => {
    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec: SpeechRecognition = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = (typeof document !== "undefined" ? document.documentElement.lang : "ru") || "ru";
    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript((prev) => (final ? prev + final : (prev.endsWith(" ") ? prev : prev) + interim));
      // Reset the silence timer on each result.
      if (silenceTimer.current !== null) window.clearTimeout(silenceTimer.current);
      silenceTimer.current = window.setTimeout(() => {
        // Auto-submit after 1.5 seconds of silence.
        rec.stop();
      }, 1500);
    };
    rec.onend = () => {
      setRecording(false);
      const text = transcriptRef.current.trim();
      if (text) onSubmit(text);
      setTranscript("");
    };
    rec.onerror = () => {
      setRecording(false);
      setTranscript("");
    };
    recRef.current = rec;
    return () => {
      if (silenceTimer.current !== null) window.clearTimeout(silenceTimer.current);
      try {
        rec.abort?.();
      } catch {
        /* ignore */
      }
    };
    // ``onSubmit`` is stable enough for our needs (closure captures latest via ref).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror the transcript into a ref so ``onend`` reads the latest value.
  const transcriptRef = useRef("");
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  if (!supported) {
    // Graceful fallback: drop to text input with a small note.
    return (
      <div className="flex flex-col gap-2">
        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          {t("nors.voiceUnsupported")}
        </div>
        <TextInput disabled={disabled} onSubmit={onSubmit} />
      </div>
    );
  }

  const toggle = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (recording) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      setRecording(false);
    } else {
      try {
        setTranscript("");
        rec.start();
        setRecording(true);
      } catch {
        /* ignore — Chrome throws if start() is called twice */
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={recording}
        className={`north-mic ${recording ? "north-mic-on" : ""}`}
      >
        <Mic size={22} />
      </button>
      {transcript && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", maxWidth: 280 }}>
          {transcript}
        </div>
      )}
      <style>{`
        .north-mic {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--brand);
          color: #FFFFFF;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .north-mic:hover:not(:disabled) { background: var(--brand-dim); }
        .north-mic-on {
          animation: north-mic-pulse 1.5s infinite;
        }
        @keyframes north-mic-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(153,75,255,0.4); }
          70%  { box-shadow: 0 0 0 14px rgba(153,75,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(153,75,255,0); }
        }
      `}</style>
    </div>
  );
}
