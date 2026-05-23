import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Building2, ChevronRight } from "lucide-react";
import { useAuth } from "../state/AuthContext";

const DEMO = [
  { label: "User", email: "user@turonbank.uz", password: "user12345", role: "стажёр" },
  { label: "HR", email: "hr@turonbank.uz", password: "hr12345", role: "HR" },
  { label: "Admin", email: "admin@turonbank.uz", password: "admin12345", role: "админ" },
];

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return null;
  if (user) {
    const to = (loc.state as any)?.from ?? defaultRoute(user.role);
    return <Navigate to={to} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const u = await login(email, password);
      navigate(defaultRoute(u.role), { replace: true });
    } catch (e: any) {
      setErr(e?.detail || e?.message || "Не удалось войти");
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
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* левая колонка — brand */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold-500 text-navy-900">
            <Sparkles size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">AI-Mentor</div>
            <div className="text-[10px] uppercase tracking-widest text-white/60">Turonbank</div>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight">
            Онбординг с AI
            <br />
            <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
              для каждого сотрудника
            </span>
          </h1>
          <p className="max-w-md text-white/70">
            Курсы, симулятор АБС/CRM, ассистент 24/7 и аналитика готовности.
            Apple-вдохновлённый интерфейс, корпоративная безопасность.
          </p>
          <ul className="space-y-2.5 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-gold-400" />
              Safe sandbox · DLP-метки · изолированная БД
            </li>
            <li className="flex items-center gap-2">
              <Building2 size={16} className="text-gold-400" />
              Три роли: сотрудник · HR · администратор
            </li>
          </ul>
        </div>

        <div className="text-[11px] text-white/40">v0.3 · production-ready</div>

        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
      </div>

      {/* правая колонка — форма */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-gold-500 dark:bg-white dark:text-navy-900">
                <Sparkles size={18} />
              </div>
              <div className="font-display text-lg font-semibold">AI-Mentor · Turonbank</div>
            </div>
          </div>

          <h2 className="font-display text-3xl font-semibold tracking-tight">Вход</h2>
          <p className="mt-2 text-sm text-navy-900/60 dark:text-white/60">
            Войдите в свой корпоративный аккаунт.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy-900/60 dark:text-white/60">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@turonbank.uz"
                className="input"
                autoFocus
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy-900/60 dark:text-white/60">
                Пароль
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
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
                {err}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full !justify-center !py-3">
              {busy ? "Вход…" : (<>Войти <ArrowRight size={14} /></>)}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-navy-900/40 dark:text-white/40">
            <span className="h-px flex-1 bg-navy-900/10 dark:bg-white/10" /> Demo-аккаунты
            <span className="h-px flex-1 bg-navy-900/10 dark:bg-white/10" />
          </div>

          <div className="space-y-1.5">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => quickFill(d)}
                className="group flex w-full items-center justify-between rounded-2xl border border-navy-900/8 bg-white/40 px-4 py-2.5 text-left text-sm transition hover:border-gold-500/40 hover:bg-white/70 dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/8"
              >
                <div>
                  <div className="font-semibold">{d.label} <span className="ml-1 text-[11px] font-normal text-navy-900/50 dark:text-white/50">{d.role}</span></div>
                  <div className="text-[11px] text-navy-900/50 dark:text-white/50">{d.email} · {d.password}</div>
                </div>
                <ChevronRight size={14} className="text-navy-900/40 transition-transform group-hover:translate-x-0.5 dark:text-white/40" />
              </button>
            ))}
          </div>

          <p className="mt-7 text-center text-sm text-navy-900/60 dark:text-white/60">
            Ещё нет аккаунта?{" "}
            <Link to="/register" className="font-medium text-gold-700 hover:underline dark:text-gold-300">
              Зарегистрироваться
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
