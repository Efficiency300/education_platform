import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Send,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  api,
  TeamMember,
  TeamMessage,
  TeamSeniority,
  TeamSummary,
} from "../api";
import { useAuth } from "../state/AuthContext";
import { useT } from "../state/LocaleContext";

export default function TeamsPage() {
  const { user } = useAuth();
  const t = useT();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [activeTeam, setActiveTeam] = useState<TeamSummary | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = useCallback(async () => {
    const list = await api.listTeams();
    setTeams(list);
    if (!activeTeam && list.length) setActiveTeam(list[0]);
  }, [activeTeam]);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  const canCreate = user && (user.role === "admin" || user.role === "hr");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="hero-text">{t("nav.teamChat")}</h1>
          <p className="mt-2 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
            {t("teams.subtitle")}
          </p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> {t("teams.create")}
          </button>
        )}
      </header>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "minmax(0, 240px) minmax(0, 1fr)" }}
      >
        {/* Team list */}
        <aside
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: 8,
            minHeight: 480,
            maxHeight: "calc(100vh - 220px)",
            overflowY: "auto",
          }}
        >
          {teams.length === 0 && (
            <div
              className="text-center"
              style={{ padding: 24, fontSize: 13, color: "var(--text-tertiary)" }}
            >
              {t("teams.empty")}
            </div>
          )}
          <ul className="flex flex-col gap-1">
            {teams.map((team) => {
              const active = activeTeam?.id === team.id;
              return (
                <li key={team.id}>
                  <button
                    onClick={() => setActiveTeam(team)}
                    className="kp-team-row"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: active ? "var(--brand)" : "transparent",
                      color: active ? "#FFFFFF" : "var(--text-primary)",
                      border: "0.5px solid transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                      fontFamily: "var(--font-kompas)",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{team.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: active ? "rgba(255,255,255,0.85)" : "var(--text-tertiary)",
                      }}
                    >
                      {team.member_count} · {seniorityLabel(team.my_role, t)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <style>{`
            .kp-team-row:hover:not([style*="var(--brand)"]) {
              background: var(--bg-hover);
            }
          `}</style>
        </aside>

        {/* Active team chat */}
        <div>
          {activeTeam ? (
            <TeamChat team={activeTeam} key={activeTeam.id} />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{
                minHeight: 360,
                background: "var(--bg-card)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-tertiary)",
                fontSize: 13,
              }}
            >
              {t("teams.empty")}
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <CreateTeamModal
          onClose={() => setCreateOpen(false)}
          onCreated={(team) => {
            setTeams((prev) => [...prev, team]);
            setActiveTeam(team);
            setCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}

function seniorityLabel(s: TeamSummary["my_role"], t: (k: string) => string): string {
  if (s === "senior") return t("teams.role.senior");
  if (s === "newcomer") return t("teams.role.newcomer");
  if (s === "member") return t("teams.role.member");
  return "—";
}

// ---------------------------------------------------------------------------
// TeamChat
// ---------------------------------------------------------------------------

function TeamChat({ team }: { team: TeamSummary }) {
  const { user } = useAuth();
  const t = useT();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [input, setInput] = useState("");
  const [kind, setKind] = useState<"message" | "question">("message");
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<TeamMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [msgs, mem] = await Promise.all([
      api.teamMessages(team.id),
      api.teamMembers(team.id).catch(() => [] as TeamMember[]),
    ]);
    setMessages(msgs);
    setMembers(mem);
  }, [team.id]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const canMarkCanonical = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "hr") return true;
    return team.my_role === "senior";
  }, [user, team.my_role]);

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;
    setBusy(true);
    try {
      const msg = await api.postTeamMessage(team.id, {
        content,
        parent_id: replyTo?.id,
        kind,
      });
      setMessages((prev) => [...prev, msg]);
      setInput("");
      setKind("message");
      setReplyTo(null);
    } finally {
      setBusy(false);
    }
  };

  const markCanonical = async (m: TeamMessage) => {
    try {
      const res = await api.markCanonical(team.id, m.id);
      setMessages((prev) =>
        prev.map((p) =>
          p.id === m.id ? { ...p, canonical: true, knowledge_filename: res.knowledge_filename } : p,
        ),
      );
    } catch (e: any) {
      alert(e?.detail || e?.message || "—");
    }
  };

  if (team.my_role === "none" && user?.role !== "admin" && user?.role !== "hr") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 text-center"
        style={{
          minHeight: 360,
          background: "var(--bg-card)",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          color: "var(--text-secondary)",
          fontSize: 13,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 16, color: "var(--text-primary)", fontWeight: 600 }}>
          {team.name}
        </div>
        {team.description && <div style={{ maxWidth: 360 }}>{team.description}</div>}
        <p>{t("teams.notMember")}</p>
        <button
          className="btn-primary"
          onClick={async () => {
            try {
              await api.joinTeam(team.id);
              // Force a parent refresh by reloading the page-level list.
              window.location.reload();
            } catch (e: any) {
              alert(e?.detail || e?.message || "—");
            }
          }}
        >
          {t("teams.join")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        background: "var(--bg-card)",
        border: "0.5px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        minHeight: 480,
        maxHeight: "calc(100vh - 220px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 18px", borderBottom: "0.5px solid var(--border)" }}
      >
        <div className="min-w-0">
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            {team.name}
          </div>
          {team.description && (
            <div className="truncate" style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {team.description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="chip" title={t("teams.members")}>
            {members.length || team.member_count}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ padding: 16 }}>
        {messages.length === 0 && (
          <div className="text-center" style={{ padding: 24, color: "var(--text-tertiary)", fontSize: 13 }}>
            {t("teams.askQuestion")}
          </div>
        )}
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <TeamBubble
              key={m.id}
              msg={m}
              parent={m.parent_id ? messages.find((p) => p.id === m.parent_id) ?? null : null}
              canMarkCanonical={canMarkCanonical && m.parent_id !== null && !m.canonical}
              canDelete={user?.role === "admin"}
              onReply={() => setReplyTo(m)}
              onMarkCanonical={() => markCanonical(m)}
              onDelete={async () => {
                if (!confirm(t("teams.confirmDelete"))) return;
                try {
                  await api.adminDeleteTeamMessage(team.id, m.id);
                  setMessages((prev) => prev.filter((p) => p.id !== m.id));
                } catch (e: any) {
                  alert(e?.detail || e?.message || "—");
                }
              }}
            />
          ))}
        </ul>
      </div>

      {/* Composer */}
      <div style={{ padding: 12, borderTop: "0.5px solid var(--border)" }}>
        {replyTo && (
          <div
            className="flex items-center justify-between"
            style={{
              marginBottom: 8,
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border)",
              fontSize: 11,
              color: "var(--text-secondary)",
            }}
          >
            <span className="truncate" style={{ maxWidth: 480 }}>
              ↳ {replyTo.author_name}: {replyTo.content.slice(0, 80)}
            </span>
            <button
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
              style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKind((k) => (k === "question" ? "message" : "question"))}
            className={kind === "question" ? "btn-primary" : "btn-ghost"}
            style={{ padding: "8px 12px", fontSize: 12 }}
            title={t("teams.askQuestion")}
          >
            <HelpCircle size={13} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("teams.sendMessage")}
            className="input"
            disabled={busy}
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="btn-primary"
            style={{ padding: "9px 12px" }}
          >
            <Send size={14} />
            {kind === "question" ? t("teams.send_question") : t("teams.send")}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamBubble({
  msg,
  parent,
  canMarkCanonical,
  canDelete,
  onReply,
  onMarkCanonical,
  onDelete,
}: {
  msg: TeamMessage;
  parent: TeamMessage | null;
  canMarkCanonical: boolean;
  canDelete: boolean;
  onReply: () => void;
  onMarkCanonical: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const isQuestion = msg.kind === "question";
  const seniorIcon =
    msg.author_seniority === "senior" ? (
      <ShieldCheck size={11} style={{ color: "var(--brand)" }} />
    ) : null;
  const positionLabel = msg.author_position ? t(`position.${msg.author_position}`) : "";
  const roleLabel = msg.author_role ? t(`role.${msg.author_role}`) : "";
  const jobBits = [positionLabel, msg.author_job_title || roleLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="flex gap-3"
    >
      <Avatar name={msg.author_name} url={msg.author_avatar} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {msg.author_name}
          </span>
          {seniorIcon}
          {jobBits && (
            <span
              style={{
                fontSize: 10,
                padding: "1px 6px",
                background: "var(--bg-card)",
                border: "0.5px solid var(--border)",
                borderRadius: 99,
                color: "var(--text-tertiary)",
              }}
            >
              {jobBits}
            </span>
          )}
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isQuestion && (
            <span className="badge badge-brand" style={{ marginLeft: 4 }}>
              <HelpCircle size={10} /> ?
            </span>
          )}
          {msg.canonical && (
            <span
              className="badge badge-success"
              style={{ marginLeft: 4 }}
              title={t("teams.canonicalNotice")}
            >
              <Sparkles size={10} /> {t("teams.canonicalBadge")}
            </span>
          )}
        </div>
        {parent && (
          <div
            style={{
              marginTop: 4,
              padding: "4px 8px",
              borderLeft: "2px solid var(--border-emphasis)",
              fontSize: 11,
              color: "var(--text-tertiary)",
            }}
          >
            ↳ {parent.author_name}: {parent.content.slice(0, 120)}
          </div>
        )}
        <div
          className="whitespace-pre-wrap"
          style={{
            marginTop: 4,
            padding: "10px 14px",
            background: isQuestion ? "var(--brand-subtle)" : "var(--bg-elevated)",
            border: `0.5px solid ${isQuestion ? "var(--border-brand)" : "var(--border-emphasis)"}`,
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--text-primary)",
          }}
        >
          {msg.content}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={onReply}
            className="btn-ghost"
            style={{ padding: "4px 10px", fontSize: 11 }}
          >
            {t("teams.reply")}
          </button>
          {canMarkCanonical && (
            <button
              onClick={onMarkCanonical}
              className="btn-secondary"
              style={{ padding: "4px 10px", fontSize: 11 }}
              title={t("teams.canonicalNotice")}
            >
              <CheckCircle2 size={12} /> {t("teams.markCanonical")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="btn-ghost"
              style={{ padding: "4px 10px", fontSize: 11, color: "var(--danger)" }}
              title={t("teams.confirmDelete")}
            >
              <Trash2 size={11} /> {t("teams.delete")}
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function Avatar({ name, url }: { name: string; url?: string }) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center"
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--brand)",
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Create team modal (admin / HR only)
// ---------------------------------------------------------------------------

function CreateTeamModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (t: TeamSummary) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const team = await api.createTeam({ name, description });
      onCreated(team);
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full"
        style={{
          maxWidth: 420,
          padding: 24,
          borderRadius: "var(--radius-xl)",
          background: "var(--bg-elevated)",
          border: "0.5px solid var(--border-emphasis)",
          display: "grid",
          gap: 14,
        }}
      >
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t("teams.create")}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              background: "transparent",
              border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("teams.namePh")}
          className="input"
          required
          minLength={2}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("teams.descPh")}
          className="input"
          rows={3}
        />
        {err && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "rgba(240,62,62,0.08)",
              border: "0.5px solid rgba(240,62,62,0.3)",
              color: "var(--danger)",
              fontSize: 13,
            }}
          >
            {err}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
            {busy ? t("teams.creating") : t("teams.create")}
          </button>
        </div>
      </form>
    </div>
  );
}

// Re-export the type for the section header label helper (kept inline to avoid
// pulling lucide-react types into the API client).
export type { TeamSeniority };
