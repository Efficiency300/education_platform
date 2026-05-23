import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useT } from "../state/LocaleContext";
import { LanguageInline } from "../components/LanguageSwitcher";
import { defaultRoute } from "./Login";

export default function RegisterPage() {
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    position: "intern",
    department: "Розничный блок",
    program: "Kelajakka qadam",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to={defaultRoute(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const u = await register(form);
      navigate(defaultRoute(u.role), { replace: true });
    } catch (e: any) {
      setErr(e?.detail || e?.message || t("auth.register.errorDefault"));
    } finally {
      setBusy(false);
    }
  };

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 500,
    color: "var(--text-secondary)",
  };

  return (
    <div
      className="flex items-center justify-center px-6 py-12"
      style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full"
        style={{ maxWidth: 520 }}
      >
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="KOMPAS" style={{ width: 30, height: 30 }} />
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
              KOMPAS
            </span>
          </div>
          <LanguageInline />
        </div>

        <h2
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          {t("auth.register.title")}
        </h2>
        <p className="mt-2" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {t("auth.register.subtitle")}
        </p>

        <form onSubmit={submit} className="mt-7" style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={labelStyle}>{t("auth.register.fullName")}</label>
            <input value={form.full_name} onChange={upd("full_name")} className="input" required minLength={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label style={labelStyle}>{t("auth.login.emailLabel")}</label>
              <input type="email" value={form.email} onChange={upd("email")} className="input" required />
            </div>
            <div>
              <label style={labelStyle}>
                {t("auth.login.passwordLabel")}{" "}
                <span style={{ opacity: 0.5 }}>· {t("auth.register.passwordHint")}</span>
              </label>
              <input type="password" value={form.password} onChange={upd("password")} className="input" required minLength={6} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label style={labelStyle}>{t("auth.register.status")}</label>
              <select value={form.position} onChange={upd("position")} className="input">
                <option value="intern">{t("position.intern")}</option>
                <option value="employee">{t("position.employee")}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t("auth.register.department")}</label>
              <input value={form.department} onChange={upd("department")} className="input" />
            </div>
            <div>
              <label style={labelStyle}>{t("auth.register.program")}</label>
              <input value={form.program} onChange={upd("program")} className="input" />
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

          <button
            type="submit"
            disabled={busy}
            className="btn-primary"
            style={{ width: "100%", padding: "12px 18px", fontSize: 14 }}
          >
            {busy ? t("auth.register.submitting") : (<>{t("auth.register.submit")} <ArrowRight size={14} /></>)}
          </button>
        </form>

        <p
          className="mt-7 text-center"
          style={{ fontSize: 13, color: "var(--text-secondary)" }}
        >
          {t("auth.register.hasAccount")}{" "}
          <Link to="/login" style={{ color: "var(--brand)", fontWeight: 500 }}>
            {t("auth.register.login")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
