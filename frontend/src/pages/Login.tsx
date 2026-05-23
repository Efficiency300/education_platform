import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useT } from "../state/LocaleContext";
import { LanguageInline } from "../components/LanguageSwitcher";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return null;
  if (user) {
    const to = (loc.state as any)?.from ?? defaultRoute(user.role);
    return <Navigate to={to} replace />;
  }

  const demo = [
    { label: "User", email: "user@kompas.uz", password: "user12345", role: t("auth.demo.userRole") },
    { label: "HR", email: "hr@kompas.uz", password: "hr12345", role: t("auth.demo.hrRole") },
    { label: "Admin", email: "admin@kompas.uz", password: "admin12345", role: t("auth.demo.adminRole") },
  ];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const u = await login(email, password);
      navigate(defaultRoute(u.role), { replace: true });
    } catch (e: any) {
      setErr(e?.detail || e?.message || t("auth.login.errorDefault"));
    } finally {
      setBusy(false);
    }
  };

  const quickFill = (e: { email: string; password: string }) => {
    setEmail(e.email);
    setPassword(e.password);
    setErr(null);
  };

  return (
    <div
      className="grid lg:grid-cols-[1fr_1.1fr]"
      style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Hero panel */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden lg:flex"
        style={{
          padding: 48,
          background: "var(--bg-elevated)",
          borderRight: "0.5px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between">
          <img src="/logo-full.svg" alt="KOMPAS" style={{ height: 32, width: "auto" }} />
          <LanguageInline />
        </div>

        <div className="space-y-6">
          <h1
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "var(--text-primary)",
            }}
          >
            {t("auth.login.heroTitle1")}
            <br />
            <span style={{ color: "var(--brand)" }}>
              {t("auth.login.heroTitle2")}
            </span>
          </h1>
          <p
            style={{
              maxWidth: 480,
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {t("auth.login.heroDesc")}
          </p>
          <ul className="space-y-2.5" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            <li className="flex items-center gap-2">
              <ShieldCheck size={16} style={{ color: "var(--brand)" }} />
              {t("auth.login.heroBullet1")}
            </li>
            <li className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: "var(--brand)" }} />
              {t("auth.login.heroBullet2")}
            </li>
          </ul>
        </div>

        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          v0.4
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full"
          style={{ maxWidth: 420 }}
        >
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <img src="/logo-full.svg" alt="KOMPAS" style={{ height: 22, width: "auto" }} />
            <LanguageInline />
          </div>

          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            {t("auth.login.title")}
          </h2>
          <p className="mt-2" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {t("auth.login.subtitle")}
          </p>

          <form onSubmit={submit} className="mt-7" style={{ display: "grid", gap: 16 }}>
            <div>
              <label
                className="block"
                style={{
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                {t("auth.login.emailLabel")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@kompany.uz"
                className="input"
                autoFocus
                autoComplete="username"
              />
            </div>
            <div>
              <label
                className="block"
                style={{
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                {t("auth.login.passwordLabel")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                autoComplete="current-password"
              />
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
              {busy ? t("auth.login.submitting") : (<>{t("auth.login.submit")} <ArrowRight size={14} /></>)}
            </button>
          </form>

          <div
            className="my-6 flex items-center gap-3"
            style={{
              fontSize: 10,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            {t("auth.login.demoSeparator")}
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {demo.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => quickFill(d)}
                className="group kp-demo-row"
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-card)",
                  border: "0.5px solid var(--border)",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-kompas)",
                  color: "var(--text-primary)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {d.label}{" "}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-tertiary)" }}>
                      {d.role}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    {d.email} · {d.password}
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-tertiary)" }} />
              </button>
            ))}
          </div>
          <style>{`
            .kp-demo-row:hover {
              border-color: var(--border-brand) !important;
              background: var(--bg-hover) !important;
            }
          `}</style>

          <p
            className="mt-7 text-center"
            style={{ fontSize: 13, color: "var(--text-secondary)" }}
          >
            {t("auth.login.noAccount")}{" "}
            <Link to="/register" style={{ color: "var(--brand)", fontWeight: 500 }}>
              {t("auth.login.register")}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function defaultRoute(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "hr") return "/hr";
  return "/";
}
