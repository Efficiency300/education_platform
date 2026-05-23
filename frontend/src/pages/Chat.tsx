import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, FileText, ChevronDown, Bot, User as UserIcon } from "lucide-react";
import { api, Source, streamChat } from "../api";
import { useProgress } from "../state/ProgressContext";
import { useT } from "../state/LocaleContext";

interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  streaming?: boolean;
}

export default function Chat() {
  const { user, refresh } = useProgress();
  const t = useT();
  const SUGGESTIONS = [
    { label: t("chat.sug.dress"), q: t("chat.sug.dressQ") },
    { label: t("chat.sug.aml"), q: t("chat.sug.amlQ") },
    { label: t("chat.sug.late"), q: t("chat.sug.lateQ") },
    { label: t("chat.sug.vacation"), q: t("chat.sug.vacationQ") },
  ];
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;
    api.history(user.id)
      .then((h) => setMessages(h.map((m) => ({ role: m.role, content: m.content }))))
      .catch(console.error);
  }, [user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text?: string) => {
    if (!user) return;
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", content: q },
      { role: "assistant", content: "", streaming: true },
    ]);
    setBusy(true);

    const cancel = streamChat(user.id, q, {
      onSources: (sources) => {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { ...copy[copy.length - 1], sources };
          return copy;
        });
      },
      onChunk: (chunk) => {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      },
      onDone: () => {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { ...copy[copy.length - 1], streaming: false };
          return copy;
        });
        setBusy(false);
        refresh();
      },
      onError: (msg) => {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: `${t("chat.errorPrefix")} ${msg}`, streaming: false };
          return copy;
        });
        setBusy(false);
      },
    });
    cancelRef.current = cancel;
  };

  const stop = () => {
    cancelRef.current?.();
    setBusy(false);
    setMessages((m) => {
      const copy = [...m];
      if (copy.length && copy[copy.length - 1].streaming) {
        copy[copy.length - 1] = { ...copy[copy.length - 1], streaming: false };
      }
      return copy;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <Sparkles size={14} className="text-gold-500" /> {t("chat.kicker")}
        </div>
        <h1 className="hero-text mt-2">{t("chat.title")}</h1>
        <p className="mt-3 max-w-xl text-base text-navy-900/60 dark:text-white/60">
          {t("chat.subtitle")}
        </p>
      </div>

      <div className="glass flex h-[calc(100vh-280px)] min-h-[480px] flex-col p-0">
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-6">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center gap-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-navy-900 to-navy-700 text-gold-500 shadow-glass dark:from-gold-500 dark:to-gold-700 dark:text-navy-900"
              >
                <Bot size={28} strokeWidth={2.2} />
              </motion.div>
              <div>
                <div className="font-display text-xl font-semibold">{t("chat.hello")}</div>
                <div className="mt-1 text-sm text-navy-900/50 dark:text-white/50">
                  {t("chat.pickOrAsk")}
                </div>
              </div>
              <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s.q}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => send(s.q)}
                    className="rounded-xl border border-navy-900/8 bg-white/50 px-4 py-3 text-left text-sm font-medium text-navy-900/80 transition hover:border-gold-500/40 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                  >
                    {s.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.role === "user"
                      ? "bg-navy-900 text-white dark:bg-white dark:text-navy-900"
                      : "bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900"
                  }`}
                >
                  {m.role === "user" ? <UserIcon size={14} /> : <Bot size={14} />}
                </div>
                <div className={`max-w-[78%] ${m.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-tr-md bg-navy-900 text-white dark:bg-white dark:text-navy-900"
                        : "rounded-tl-md border border-navy-900/8 bg-white/70 text-navy-900 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white"
                    }`}
                  >
                    <div className={m.streaming && m.content ? "streaming-cursor whitespace-pre-wrap" : "whitespace-pre-wrap"}>
                      {m.content || (m.streaming && (
                        <span className="inline-flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60" style={{ animationDelay: "0.15s" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60" style={{ animationDelay: "0.3s" }} />
                        </span>
                      ))}
                    </div>
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <details className="mt-2 inline-block max-w-full text-left">
                      <summary className="cursor-pointer list-none">
                        <span className="chip">
                          <FileText size={11} /> {t("chat.sources", { n: m.sources.length })}
                          <ChevronDown size={11} />
                        </span>
                      </summary>
                      <div className="mt-2 space-y-2">
                        {m.sources.map((s, j) => (
                          <div
                            key={j}
                            className="rounded-xl border border-navy-900/8 bg-white/50 p-3 text-xs dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="mb-1 flex items-center justify-between font-semibold">
                              <span>{s.title}</span>
                              <span className="text-navy-900/40 dark:text-white/40">★ {s.score}</span>
                            </div>
                            <div className="text-navy-900/60 dark:text-white/60">{s.snippet}…</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-navy-900/8 p-3 dark:border-white/8"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder")}
            disabled={busy}
            className="input"
          />
          {busy ? (
            <button type="button" onClick={stop} className="btn-ghost">
              {t("chat.stop")}
            </button>
          ) : (
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              disabled={!input.trim()}
              className="btn-primary !rounded-full"
            >
              <Send size={14} />
            </motion.button>
          )}
        </form>
      </div>
    </div>
  );
}
