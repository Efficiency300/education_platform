import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Search, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { api, AdminUser, Role } from "../../api";
import GlassCard from "../../components/GlassCard";
import { useAuth } from "../../state/AuthContext";

const ROLE_META: Record<Role, { label: string; icon: any; cls: string }> = {
  user: { label: "User", icon: UserIcon, cls: "bg-navy-900/8 text-navy-900/70 dark:bg-white/10 dark:text-white/70" },
  hr: { label: "HR", icon: Shield, cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  admin: { label: "Admin", icon: ShieldCheck, cls: "bg-gradient-to-r from-gold-400/30 to-gold-600/30 text-gold-800 dark:text-gold-200" },
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

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
      alert(e?.detail || e?.message || "Не удалось");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <Users size={14} className="text-gold-500" /> Управление доступом
        </div>
        <h1 className="hero-text mt-2">Пользователи и роли</h1>
        <p className="mt-2 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
          Меняйте роли сотрудников: <strong>user</strong> (проходит обучение),{" "}
          <strong>hr</strong> (видит аналитику), <strong>admin</strong> (полный доступ).
        </p>
      </header>

      <GlassCard className="!p-5">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-900/40 dark:text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск: имя, email, подразделение"
            className="input !pl-9"
          />
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_140px] items-center gap-4 border-b border-navy-900/8 bg-navy-900/[0.02] px-6 py-3 text-[10px] uppercase tracking-widest text-navy-900/50 dark:border-white/8 dark:bg-white/[0.02] dark:text-white/50">
          <div>Сотрудник</div>
          <div>Подразделение</div>
          <div>Создан</div>
          <div>Роль</div>
        </div>
        <div className="divide-y divide-navy-900/8 dark:divide-white/8">
          {filtered.map((u) => {
            const isSelf = me?.id === u.id;
            const meta = ROLE_META[u.role];
            const Icon = meta.icon;
            return (
              <div key={u.id} className="grid grid-cols-[1.5fr_1fr_1fr_140px] items-center gap-4 px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-xs font-bold text-navy-900">
                    {u.full_name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {u.full_name} {isSelf && <span className="text-[10px] text-gold-700 dark:text-gold-300">(вы)</span>}
                    </div>
                    <div className="truncate text-[11px] text-navy-900/50 dark:text-white/50">{u.email}</div>
                  </div>
                </div>
                <div className="text-xs text-navy-900/70 dark:text-white/70">
                  <div>{u.department || "—"}</div>
                  <div className="text-[10px] text-navy-900/40 dark:text-white/40">{u.position}</div>
                </div>
                <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                  {new Date(u.created_at).toLocaleDateString("ru-RU")}
                </div>
                <div>
                  <div className="mb-1 inline-flex items-center gap-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
                      <Icon size={10} /> {meta.label}
                    </span>
                  </div>
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value as Role)}
                    disabled={busyId === u.id || (isSelf && u.role === "admin")}
                    className="input !py-1.5 text-xs"
                    title={isSelf && u.role === "admin" ? "Нельзя понизить свою роль" : ""}
                  >
                    <option value="user">user</option>
                    <option value="hr">hr</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
