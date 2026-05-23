import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  FileText,
  MessagesSquare,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { api, AdminStats, DirectionItem, KnowledgeInstructionItem } from "../../api";
import GlassCard from "../../components/GlassCard";
import { useT } from "../../state/LocaleContext";

export default function AdminSettings() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => {
    api.adminStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <Settings size={14} className="text-gold-500" /> Конфигурация
        </div>
        <h1 className="hero-text mt-2">Состояние системы</h1>
        <p className="mt-2 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
          Текущие режимы интеграций и количественные метрики платформы.
          Конфигурация задаётся через `.env` и переменные окружения.
        </p>
      </header>

      <section>
        <GlassCard className="!p-7">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <ShieldCheck size={18} className="text-gold-500" /> Контент и пользователи
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Metric icon={<Users size={14} />} label="Пользователей" value={stats?.users_total ?? 0} />
            <Metric icon={<BookOpen size={14} />} label="Курсов всего" value={(stats?.courses_built_in ?? 0) + (stats?.courses_custom ?? 0)} />
            <Metric icon={<FileText size={14} />} label="Файлов" value={stats?.regulations_count ?? 0} />
            <Metric icon={<MessagesSquare size={14} />} label="Сообщений в чате" value={stats?.chat_messages_total ?? 0} />
            <Metric icon={<Activity size={14} />} label="Событий в журнале" value={stats?.activity_events_total ?? 0} />
          </div>
        </GlassCard>
      </section>

      <DirectionsAdmin />
      <KnowledgeInstructionsAdmin />

      <GlassCard className="!p-7">
        <div className="mb-3 font-display text-lg font-semibold">Демо-аккаунты</div>
        <div className="overflow-hidden rounded-2xl border border-navy-900/8 dark:border-white/8">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-navy-900/5 dark:bg-white/5 text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">
              <tr>
                <th className="px-4 py-2">Роль</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Пароль</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/8 dark:divide-white/8">
              <tr><td className="px-4 py-2 font-semibold">User</td><td className="px-4 py-2 font-mono">user@kompas.uz</td><td className="px-4 py-2 font-mono">user12345</td></tr>
              <tr><td className="px-4 py-2 font-semibold">HR</td><td className="px-4 py-2 font-mono">hr@kompas.uz</td><td className="px-4 py-2 font-mono">hr12345</td></tr>
              <tr><td className="px-4 py-2 font-semibold">Admin</td><td className="px-4 py-2 font-mono">admin@kompas.uz</td><td className="px-4 py-2 font-mono">admin12345</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-navy-900/50 dark:text-white/50">
          Демо-аккаунты пересоздаются (с обновлением пароля) при каждом старте бекенда — удобно для презентаций.
          В продакшене смените `JWT_SECRET` и отключите автопересоздание.
        </p>
      </GlassCard>
    </div>
  );
}

function DirectionsAdmin() {
  const t = useT();
  const [items, setItems] = useState<DirectionItem[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    api.listDirections().then(setItems).catch(console.error);
  };
  useEffect(load, []);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await api.adminCreateDirection({ name: name.trim(), description: desc.trim() });
      setName("");
      setDesc("");
      load();
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить?")) return;
    try {
      await api.adminDeleteDirection(id);
      load();
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    }
  };

  return (
    <GlassCard className="!p-7">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-semibold">
            {t("admin.settings.directions.title")}
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {t("admin.settings.directions.subtitle")}
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("admin.settings.directions.namePh")}
          className="input"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t("admin.settings.directions.descPh")}
          className="input"
        />
        <button onClick={add} disabled={busy || !name.trim()} className="btn-primary">
          <Plus size={14} /> {t("admin.settings.directions.add")}
        </button>
      </div>
      {err && (
        <div
          className="mb-3"
          style={{
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(240,62,62,0.08)",
            color: "var(--danger)",
            fontSize: 12,
          }}
        >
          {err}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-3 rounded-2xl border border-navy-900/8 bg-white/40 p-3 dark:border-white/8 dark:bg-white/[0.03]"
          >
            <div className="min-w-0 flex-1">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                {d.description || "—"}
              </div>
            </div>
            <button
              onClick={() => remove(d.id)}
              style={{
                padding: "6px 10px",
                background: "transparent",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "inline-flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              <Trash2 size={12} />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <div
            className="text-center"
            style={{ padding: 14, fontSize: 12, color: "var(--text-tertiary)" }}
          >
            —
          </div>
        )}
      </ul>
    </GlassCard>
  );
}

function KnowledgeInstructionsAdmin() {
  const t = useT();
  const [items, setItems] = useState<KnowledgeInstructionItem[]>([]);

  const load = () => {
    api.adminListKnowledgeInstructions().then(setItems).catch(console.error);
  };
  useEffect(load, []);

  const remove = async (id: number) => {
    if (!confirm(t("chat.kb.remove"))) return;
    try {
      await api.adminDeleteKnowledgeInstruction(id);
      load();
    } catch (e: any) {
      alert(e?.detail || e?.message || "—");
    }
  };

  const verify = async (id: number) => {
    try {
      await api.adminVerifyKnowledgeInstruction(id);
      load();
    } catch (e: any) {
      alert(e?.detail || e?.message || "—");
    }
  };

  return (
    <GlassCard className="!p-7">
      <div className="mb-3">
        <div className="font-display text-lg font-semibold">{t("admin.kb.title")}</div>
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {t("admin.kb.subtitle")}
        </div>
      </div>
      {items.length === 0 && (
        <div className="text-center" style={{ padding: 14, fontSize: 13, color: "var(--text-tertiary)" }}>
          {t("admin.kb.empty")}
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {items.map((it) => (
          <li
            key={it.id}
            style={{
              padding: 12,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-card)",
              border: "0.5px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: 13, fontWeight: 600 }}>{it.question}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                  {new Date(it.created_at).toLocaleString()}{" "}
                  {it.direction && <>· {it.direction}</>}
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background:
                    it.verification_status === "verified"
                      ? "rgba(62,207,142,0.12)"
                      : "rgba(245,158,11,0.12)",
                  color:
                    it.verification_status === "verified"
                      ? "var(--success)"
                      : "var(--warning)",
                  fontWeight: 600,
                }}
              >
                {it.verification_status === "verified"
                  ? t("admin.kb.verified")
                  : t("admin.kb.unverified")}
              </span>
            </div>
            <div
              className="mt-2 whitespace-pre-wrap"
              style={{ fontSize: 12, color: "var(--text-secondary)" }}
            >
              {it.answer.slice(0, 320)}
              {it.answer.length > 320 && "…"}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {it.verification_status !== "verified" && (
                <button
                  onClick={() => verify(it.id)}
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                >
                  <CheckCircle2 size={12} /> {t("admin.kb.verify")}
                </button>
              )}
              <button
                onClick={() => remove(it.id)}
                className="btn-ghost"
                style={{ padding: "4px 10px", fontSize: 11, color: "var(--danger)" }}
              >
                <Trash2 size={12} /> {t("common.delete")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white/40 p-3 text-center dark:border-white/8 dark:bg-white/[0.03]">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-navy-900/50 dark:text-white/50">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
