import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { defaultRoute } from "./Login";

export default function RegisterPage() {
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();
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
      setErr(e?.detail || e?.message || "Не удалось зарегистрироваться");
    } finally {
      setBusy(false);
    }
  };

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="w-full max-w-lg"
      >
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-gold-500 dark:bg-white dark:text-navy-900">
            <Sparkles size={18} />
          </div>
          <div className="font-display text-lg font-semibold">AI-Mentor · Turonbank</div>
        </div>

        <h2 className="font-display text-3xl font-semibold tracking-tight">Регистрация</h2>
        <p className="mt-2 text-sm text-navy-900/60 dark:text-white/60">
          Создайте аккаунт сотрудника. HR и админ-роли назначаются администратором.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy-900/60 dark:text-white/60">
              ФИО
            </label>
            <input value={form.full_name} onChange={upd("full_name")} className="input" required minLength={2} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy-900/60 dark:text-white/60">
                Email
              </label>
              <input type="email" value={form.email} onChange={upd("email")} className="input" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy-900/60 dark:text-white/60">
                Пароль <span className="opacity-50">· ≥ 6 символов</span>
              </label>
              <input type="password" value={form.password} onChange={upd("password")} className="input" required minLength={6} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy-900/60 dark:text-white/60">
                Статус
              </label>
              <select value={form.position} onChange={upd("position")} className="input">
                <option value="intern">Стажёр</option>
                <option value="employee">Сотрудник</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy-900/60 dark:text-white/60">
                Подразделение
              </label>
              <input value={form.department} onChange={upd("department")} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy-900/60 dark:text-white/60">
                Программа
              </label>
              <input value={form.program} onChange={upd("program")} className="input" />
            </div>
          </div>

          {err && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
              {err}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full !justify-center !py-3">
            {busy ? "Создание…" : (<>Создать аккаунт <ArrowRight size={14} /></>)}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-navy-900/60 dark:text-white/60">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-medium text-gold-700 hover:underline dark:text-gold-300">
            Войти
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
