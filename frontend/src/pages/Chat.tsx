import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, FileText, ChevronDown, Bot, User as UserIcon, Plus, MessageSquare } from "lucide-react";
import { api, Source, streamChat } from "../api";
import { useProgress } from "../state/ProgressContext";
import { useLocale, useT } from "../state/LocaleContext";

interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  streaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: number;
  messages: Msg[];
}

const STORAGE_KEY_PREFIX = "kompas_chat_history_v1_";

function loadConversations(userId: number): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(userId: number, convs: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(convs.slice(0, 40)));
  } catch {
    /* quota */
  }
}

function makeTitle(text: string, fallback: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return fallback;
  return trimmed.length > 48 ? trimmed.slice(0, 48) + "…" : trimmed;
}

export default function Chat() {
  const { user, refresh } = useProgress();
  const t = useT();
  const { locale } = useLocale();
  const SUGGESTIONS = [
    { label: t("chat.sug.dress"), q: t("chat.sug.dressQ") },
    { label: t("chat.sug.aml"), q: t("chat.sug.amlQ") },
    { label: t("chat.sug.late"), q: t("chat.sug.lateQ") },
    { label: t("chat.sug.vacation"), q: t("chat.sug.vacationQ") },
  ];

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // Load persisted conversation list + the canonical chat history from the API
  // once on user change. The API history becomes the "current" conversation.
  useEffect(() => {
    if (!user) return;
    const stored = loadConversations(user.id);
    setConversations(stored);

    api
      .history(user.id)
      .then((h) => {
        const apiMessages: Msg[] = h.map((m) => ({ role: m.role, content: m.content }));
        if (apiMessages.length > 0) {
          const id = "current";
          const firstUser = apiMessages.find((m) => m.role === "user");
          const conv: Conversation = {
            id,
            title: makeTitle(firstUser?.content ?? t("chat.newChat"), t("chat.newChat")),
            updated_at: Date.now(),
            messages: apiMessages,
          };
          setActiveId(id);
          setMessages(apiMessages);
          // merge "current" into the stored list (replace if exists)
          setConversations((prev) => {
            const others = prev.filter((c) => c.id !== id);
            const next = [conv, ...others];
            saveConversations(user.id, next);
            return next;
          });
        } else if (stored.length > 0) {
          setActiveId(stored[0].id);
          setMessages(stored[0].messages);
        }
      })
      .catch(console.error);
  }, [user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Persist active conversation when messages change. The title is always
  // derived from the first user message so the sidebar gets a real label as
  // soon as someone sends something — never a sea of "Новый чат".
  useEffect(() => {
    if (!user || !activeId) return;
    if (messages.length === 0) return; // don't persist empty new-chat shells
    const firstUser = messages.find((m) => m.role === "user");
    if (!firstUser) return;
    const title = makeTitle(firstUser.content, t("chat.newChat"));
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === activeId);
      const updated: Conversation = {
        id: activeId,
        title,
        updated_at: Date.now(),
        messages,
      };
      const next =
        idx >= 0
          ? [updated, ...prev.filter((c) => c.id !== activeId)]
          : [updated, ...prev];
      saveConversations(user.id, next);
      return next;
    });
  }, [messages, activeId, user?.id]);

  const startNewChat = () => {
    cancelRef.current?.();
    const id = `c-${Date.now()}`;
    setActiveId(id);
    setMessages([]);
    setInput("");
  };

  const selectConversation = (id: string) => {
    if (id === activeId) return;
    cancelRef.current?.();
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    setActiveId(id);
    setMessages(conv.messages);
  };

  const send = (text?: string) => {
    if (!user) return;
    const q = (text ?? input).trim();
    if (!q || busy) return;

    // Ensure we have an active conversation id.
    if (!activeId) {
      const id = `c-${Date.now()}`;
      setActiveId(id);
    }

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
    }, locale);
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

  const sortedHistory = useMemo(
    () => [...conversations].sort((a, b) => b.updated_at - a.updated_at),
    [conversations],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="hero-text mt-2">{t("chat.title")}</h1>
        <p className="mt-3 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
          {t("chat.subtitle")}
        </p>
      </div>

      {/* North now lives on the dashboard as its own panel — no more tab here. */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "minmax(0, 260px) minmax(0, 1fr)" }}
      >
        {/* History sidebar */}
        <aside
          className="hidden md:flex flex-col"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: 10,
            height: "calc(100vh - 280px)",
            minHeight: 480,
          }}
        >
          <button
            onClick={startNewChat}
            className="btn-primary"
            style={{ width: "100%", marginBottom: 10 }}
          >
            <Plus size={14} /> {t("chat.newChat")}
          </button>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              fontWeight: 500,
              padding: "4px 8px",
            }}
          >
            {t("chat.history")}
          </div>
          <div className="flex-1 overflow-y-auto" style={{ marginTop: 4 }}>
            {sortedHistory.length === 0 ? (
              <div
                className="text-center"
                style={{ padding: "24px 8px", fontSize: 12, color: "var(--text-tertiary)" }}
              >
                {t("chat.emptyHistory")}
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {sortedHistory.map((c) => {
                  const active = c.id === activeId;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => selectConversation(c.id)}
                        className="kp-history-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "var(--radius-sm)",
                          background: active ? "var(--brand)" : "transparent",
                          color: active ? "#FFFFFF" : "var(--text-secondary)",
                          border: "0.5px solid transparent",
                          fontFamily: "var(--font-kompas)",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <MessageSquare
                          size={13}
                          style={{ color: active ? "#FFFFFF" : "var(--text-tertiary)", flexShrink: 0 }}
                        />
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <style>{`
            .kp-history-row:hover {
              background: var(--bg-hover);
              color: var(--text-primary);
            }
            .kp-history-row[style*="var(--brand)"]:hover {
              background: var(--brand-dim);
              color: #FFFFFF !important;
            }
          `}</style>
        </aside>

        {/* Conversation panel */}
        <div
          className="flex flex-col"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            height: "calc(100vh - 280px)",
            minHeight: 480,
          }}
        >
          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-6">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full flex-col items-center justify-center gap-6 text-center"
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--radius-lg)",
                    background: "var(--brand)",
                    color: "#FFFFFF",
                  }}
                >
                  <Bot size={26} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                    {t("chat.hello")}
                  </div>
                  <div className="mt-1" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {t("chat.pickOrAsk")}
                  </div>
                </div>
                <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <motion.button
                      key={s.q}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => send(s.q)}
                      className="kp-suggest"
                      style={{
                        padding: "12px 14px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-elevated)",
                        border: "0.5px solid var(--border-emphasis)",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-kompas)",
                        fontSize: 13,
                        fontWeight: 500,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s.label}
                    </motion.button>
                  ))}
                </div>
                <style>{`.kp-suggest:hover { border-color: var(--border-brand); background: var(--bg-hover); }`}</style>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: m.role === "user" ? "var(--bg-hover)" : "var(--brand)",
                      color: m.role === "user" ? "var(--text-primary)" : "#FFFFFF",
                    }}
                  >
                    {m.role === "user" ? <UserIcon size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`max-w-[78%] ${m.role === "user" ? "text-right" : ""}`}>
                    <div
                      className="inline-block"
                      style={{
                        padding: "10px 14px",
                        fontSize: 14,
                        lineHeight: 1.5,
                        borderRadius: 14,
                        background: m.role === "user" ? "var(--brand)" : "var(--bg-elevated)",
                        color: m.role === "user" ? "#FFFFFF" : "var(--text-primary)",
                        border: m.role === "user" ? "none" : "0.5px solid var(--border-emphasis)",
                      }}
                    >
                      <div className={m.streaming && m.content ? "streaming-cursor whitespace-pre-wrap" : "whitespace-pre-wrap"}>
                        {m.content || (m.streaming && (
                          <span className="inline-flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "currentColor", opacity: 0.7 }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "currentColor", opacity: 0.7, animationDelay: "0.15s" }} />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "currentColor", opacity: 0.7, animationDelay: "0.3s" }} />
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
                              style={{
                                padding: 12,
                                borderRadius: "var(--radius-md)",
                                background: "var(--bg-elevated)",
                                border: "0.5px solid var(--border)",
                                fontSize: 12,
                              }}
                            >
                              <div className="mb-1 flex items-center justify-between" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                <span>{s.title}</span>
                                <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>{s.score}</span>
                              </div>
                              <div style={{ color: "var(--text-secondary)" }}>{s.snippet}…</div>
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
            className="flex items-center gap-2"
            style={{ borderTop: "0.5px solid var(--border)", padding: 12 }}
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
              <button
                type="submit"
                disabled={!input.trim()}
                className="btn-primary"
                style={{ padding: "9px 12px" }}
              >
                <Send size={14} />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
