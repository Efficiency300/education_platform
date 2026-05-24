import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
 ArrowUpRight,
 BookOpen,
 CheckCircle2,
 FileText,
 Layers,
 Users,
} from "lucide-react";
import { api, AdminStats } from "../../api";
import GlassCard from "../../components/GlassCard";
import { useT } from "../../state/LocaleContext";

export default function AdminDashboard() {
 const t = useT();
 const [stats, setStats] = useState<AdminStats | null>(null);
 useEffect(() => {
 api.adminStats().then(setStats).catch(console.error);
 }, []);

 return (
 <div className="flex flex-col gap-6">
 <header>
 <h1 className="hero-text mt-2">{t("admin.title")}</h1>
 <p className="mt-2 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
 {t("admin.subtitle")}
 </p>
 </header>

 <section className="grid gap-5 md:grid-cols-4">
 <KPI label={t("admin.kpi.users")} value={stats?.users_total ?? 0} icon={<Users size={18} />} />
 <KPI label={t("admin.kpi.courses")} value={`${(stats?.courses_built_in ?? 0) + (stats?.courses_custom ?? 0)}`} sub={t("admin.kpi.coursesSub", { a: stats?.courses_built_in ?? 0, b: stats?.courses_custom ?? 0 })} icon={<BookOpen size={18} />} />
 <KPI label={t("admin.kpi.regs")} value={stats?.regulations_count ?? 0} sub={t("admin.kpi.regsSub", { n: stats?.rag_chunks ?? 0 })} icon={<FileText size={18} />} />
 <KPI label={t("admin.kpi.completed")} value={stats?.completed_courses_total ?? 0} sub={t("admin.kpi.completedSub", { n: stats?.completed_scenarios_total ?? 0 })} icon={<CheckCircle2 size={18} className="text-emerald-500" />} />
 </section>

 <section className="grid gap-5 md:grid-cols-3">
 <Card to="/admin/courses" title={t("admin.cards.coursesTitle")} subtitle={t("admin.cards.coursesSub")} icon={<BookOpen size={20} />} />
 <Card to="/admin/regulations" title={t("admin.cards.regsTitle")} subtitle={t("admin.cards.regsSub")} icon={<FileText size={20} />} />
 <Card to="/admin/users" title={t("admin.cards.usersTitle")} subtitle={t("admin.cards.usersSub")} icon={<Users size={20} />} />
 </section>

 <section>
 <GlassCard className="!p-7">
 <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
 <Layers size={18} className="text-gold-500" /> {t("admin.rolesComposition")}
 </div>
 <div className="grid grid-cols-3 gap-3 text-center">
 {(["user", "hr", "admin"] as const).map((r) => (
 <div key={r} className="rounded-2xl border border-navy-900/8 bg-white/40 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]">
 <div className="text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">{r}</div>
 <div className="mt-1 font-display text-2xl font-semibold tabular-nums">
 {stats?.users_by_role?.[r] ?? 0}
 </div>
 </div>
 ))}
 </div>
 </GlassCard>
 </section>
 </div>
 );
}

function KPI({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
 return (
 <GlassCard interactive>
 <div className="flex items-start justify-between">
 <div>
 <div className="text-xs uppercase tracking-wider text-navy-900/50 dark:text-white/50">{label}</div>
 <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
 {sub && <div className="mt-1 text-[11px] text-navy-900/40 dark:text-white/40">{sub}</div>}
 </div>
 <div className="rounded-full bg-navy-900/8 p-2.5 dark:bg-white/10">{icon}</div>
 </div>
 </GlassCard>
 );
}

function Card({ to, title, subtitle, icon }: { to: string; title: string; subtitle: string; icon: React.ReactNode }) {
 return (
 <Link to={to} className="glass group flex h-full flex-col gap-4 p-6 transition hover:-translate-y-1 hover:shadow-glass-lg">
 <div className="flex items-start justify-between">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white dark: dark: dark:text-navy-900">
 {icon}
 </div>
 <ArrowUpRight size={16} className="text-navy-900/30 transition group-hover:text-navy-900 dark:text-white/30 dark:group-hover:text-white" />
 </div>
 <div>
 <h3 className="font-display text-lg font-semibold leading-tight">{title}</h3>
 <p className="mt-1 text-sm text-navy-900/60 dark:text-white/60">{subtitle}</p>
 </div>
 </Link>
 );
}

