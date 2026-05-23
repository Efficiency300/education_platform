import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, ShieldCheck, User as UserIcon, Plus, X } from "lucide-react";
import { api, AdminUser, AdminUserCreate, Role } from "../../api";
import GlassCard from "../../components/GlassCard";
import { useAuth } from "../../state/AuthContext";
import { useT } from "../../state/LocaleContext";

const ROLE_META: Record<Role, { label: string; icon: any; color: string }> = {
  user: { label: "User", icon: UserIcon, color: "var(--text-secondary)" },
  hr: { label: "HR", icon: Shield, color: "#3b82f6" },
  admin: { label: "Admin", icon: ShieldCheck, color: "var(--brand)" },
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const t = useT();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => {
    api.adminListUsers().then(setUsers).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(qq) ||
        u.email.toLowerCase().includes(qq) ||
        u.department.toLowerCase().includes(qq),
    );
  }, [users, q]);

  const setRole = async (uid: number, role: Role) => {
    setBusyId(uid);
    try {
      await api.adminUpdateRole(uid, role);
      load();
    } catch (e: any) {
      alert(e?.detail || e?.message || t("admin.courses.deleteFailed"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="hero-text">{t("admin.users.title")}</h1>
          <p className="mt-2 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
            {t("admin.users.subtitle")}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> {t("admin.users.create")}
        </button>
      </header>

      <GlassCard className="!p-5">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.users.searchPh")}
            className="input"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div
          className="grid grid-cols-[1.5fr_1fr_1fr_160px] items-center gap-4 px-6 py-3"
          style={{
            borderBottom: "0.5px solid var(--border)",
            background: "var(--bg-elevated)",
            fontSize: 10,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            fontWeight: 500,
          }}
        >
          <div>{t("admin.users.colEmployee")}</div>
          <div>{t("admin.users.colDept")}</div>
          <div>{t("admin.users.colCreated")}</div>
          <div>{t("admin.users.colRole")}</div>
        </div>
        <div>
          {filtered.map((u, i) => {
            const isSelf = me?.id === u.id;
            const meta = ROLE_META[u.role];
            const Icon = meta.icon;
            return (
              <div
                key={u.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_160px] items-center gap-4 px-6 py-3"
                style={{
                  borderTop: i === 0 ? "none" : "0.5px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--brand)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {u.full_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                      {u.full_name}{" "}
                      {isSelf && <span style={{ fontSize: 10, color: "var(--brand)" }}>({t("common.you")})</span>}
                    </div>
                    <div className="truncate" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  <div>{u.department || "—"}</div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{u.position}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  {new Date(u.created_at).toLocaleDateString("ru-RU")}
                </div>
                <div>
                  <div
                    className="mb-1 inline-flex items-center gap-1"
                    style={{
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "var(--bg-card)",
                      border: `0.5px solid ${meta.color}`,
                      color: meta.color,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    <Icon size={10} /> {meta.label}
                  </div>
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value as Role)}
                    disabled={busyId === u.id || (isSelf && u.role === "admin")}
                    className="input"
                    style={{ padding: "6px 10px", fontSize: 12 }}
                    title={isSelf && u.role === "admin" ? t("admin.users.cantDemote") : ""}
                  >
                    <option value="user">user</option>
                    <option value="hr">hr</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              —
            </div>
          )}
        </div>
      </GlassCard>

      <AnimatePresence>
        {createOpen && (
          <CreateUserModal
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useT();
  const [form, setForm] = useState<AdminUserCreate>({
    email: "",
    password: "",
    full_name: "",
    role: "user",
    position: "intern",
    department: "",
    program: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upd = <K extends keyof AdminUserCreate>(k: K, v: AdminUserCreate[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await api.adminCreateUser(form);
      onCreated();
    } catch (e: any) {
      setErr(e?.detail || e?.message || t("admin.users.createFailed"));
    } finally {
      setBusy(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 500,
    color: "var(--text-secondary)",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.98, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.98, y: 6 }}
        transition={{ duration: 0.15 }}
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full"
        style={{
          maxWidth: 480,
          padding: 28,
          borderRadius: "var(--radius-xl)",
          background: "var(--bg-elevated)",
          border: "0.5px solid var(--border-emphasis)",
          color: "var(--text-primary)",
          display: "grid",
          gap: 16,
        }}
      >
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {t("admin.users.create")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.cancel")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              background: "transparent",
              border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <label style={labelStyle}>{t("auth.register.fullName")}</label>
          <input
            value={form.full_name}
            onChange={(e) => upd("full_name", e.target.value)}
            className="input"
            required
            minLength={2}
          />
        </div>
        <div>
          <label style={labelStyle}>{t("auth.login.emailLabel")}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => upd("email", e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label style={labelStyle}>
            {t("auth.login.passwordLabel")}{" "}
            <span style={{ opacity: 0.6 }}>· {t("auth.register.passwordHint")}</span>
          </label>
          <input
            type="text"
            value={form.password}
            onChange={(e) => upd("password", e.target.value)}
            className="input"
            required
            minLength={6}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label style={labelStyle}>{t("admin.users.colRole")}</label>
            <select
              value={form.role}
              onChange={(e) => upd("role", e.target.value as Role)}
              className="input"
            >
              <option value="user">user</option>
              <option value="hr">hr</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t("auth.register.status")}</label>
            <select
              value={form.position}
              onChange={(e) => upd("position", e.target.value)}
              className="input"
            >
              <option value="intern">{t("position.intern")}</option>
              <option value="employee">{t("position.employee")}</option>
            </select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label style={labelStyle}>{t("auth.register.department")}</label>
            <input
              value={form.department ?? ""}
              onChange={(e) => upd("department", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label style={labelStyle}>{t("auth.register.program")}</label>
            <input
              value={form.program ?? ""}
              onChange={(e) => upd("program", e.target.value)}
              className="input"
            />
          </div>
        </div>

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

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? t("admin.users.creating") : t("admin.users.create")}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
