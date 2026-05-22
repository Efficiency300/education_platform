import { useEffect, useRef, useState } from "react";
import { api, User, Source } from "../api";

interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  pending?: boolean;
}

const SUGGESTIONS = [
  "Какой дресс-код по пятницам?",
  "Что делать, если я опаздываю?",
  "Какие шаги KYC при открытии счёта?",
  "Сколько дней отпуска у стажёра?",
];

export default function Chat({ user }: { user: User }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.history(user.id).then((h) => {
      setMessages(
        h.map((m) => ({ role: m.role, content: m.content }))
      );
    }).catch(console.error);
  }, [user.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "…", pending: true }]);
    setBusy(true);
    try {
      const resp = await api.ask(user.id, q);
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: resp.answer,
          sources: resp.sources,
        };
        return copy;
      });
    } catch (e: any) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: `Ошибка: ${e.message}` };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>AI-ассистент</h2>
          <p>Спросите про регламенты, дресс-код, процессы. Ответы основаны на загруженных документах.</p>
        </div>
      </div>

      <div className="chat-window">
        <div className="chat-messages" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="empty">
              <p>Задайте свой первый вопрос или попробуйте один из примеров:</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="btn btn-ghost btn-small" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.pending ? <span className="spinner" /> : m.content}
              {m.sources && m.sources.length > 0 && (
                <div className="msg-sources">
                  <details>
                    <summary>Источники ({m.sources.length})</summary>
                    <ul>
                      {m.sources.map((s, j) => (
                        <li key={j}>
                          <strong>{s.title}</strong> ({s.score})
                          <div style={{ color: "var(--muted)" }}>{s.snippet}…</div>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
        <form
          className="chat-form"
          onSubmit={(e) => { e.preventDefault(); send(); }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спросите что-нибудь о Turonbank…"
            disabled={busy}
          />
          <button type="submit" className="btn" disabled={busy || !input.trim()}>
            {busy ? "…" : "Отправить"}
          </button>
        </form>
      </div>
    </>
  );
}
