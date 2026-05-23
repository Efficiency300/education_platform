import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";
import { api, LeaderboardItem } from "../../api";
import GlassCard from "../../components/GlassCard";
import { useT } from "../../state/LocaleContext";

export default function HRLeaderboard() {
 const t = useT();
 const [items, setItems] = useState<LeaderboardItem[]>([]);
 useEffect(() => {
 api.hrLeaderboard(50).then(setItems).catch(console.error);
 }, []);

 return (
 <div className="flex flex-col gap-6">
 <header>
 <h1 className="hero-text mt-2">{t("hr.lb.title")}</h1>
 <p className="mt-2 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
 {t("hr.lb.subtitle")}
 </p>
 </header>

 {items[0] && (
 <section className="grid gap-4 md:grid-cols-3">
 {items.slice(0, 3).map((m, i) => (
 <motion.div
 key={m.user_id}
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.05 * i, type: "spring", stiffness: 220, damping: 22 }}
 >
 <Link
 to={`/hr/users/${m.user_id}`}
 className="glass group flex h-full flex-col gap-4 p-6 transition hover:-translate-y-1 hover:shadow-glass-lg"
 >
 <div className="flex items-start justify-between">
 <div
 className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold ${
 i === 0
 ? "bg-brand text-white"
 : i === 1
 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-navy-900"
 : "bg-gradient-to-br from-amber-700/80 to-amber-900/80 text-white"
 }`}
 >
 #{m.rank}
 </div>
 <Trophy
 size={20}
 className={i === 0 ? "text-gold-500" : i === 1 ? "text-slate-400" : "text-amber-700"}
 />
 </div>
 <div>
 <h3 className="font-display text-lg font-semibold leading-tight">{m.full_name}</h3>
 <p className="text-sm text-navy-900/60 dark:text-white/60">{m.department || "—"} · L{m.level}</p>
 </div>
 <div className="flex items-end justify-between border-t border-navy-900/8 pt-4 dark:border-white/8">
 <div>
 <div className="text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">XP</div>
 <div className="font-display text-2xl font-semibold tabular-nums text-gold-700 dark:text-gold-300">
 {m.total_xp}
 </div>
 </div>
 <div className="text-right text-xs text-navy-900/60 dark:text-white/60">
 {t("hr.lbCounts", { c: m.courses_done, s: m.scenarios_done })}
 </div>
 </div>
 </Link>
 </motion.div>
 ))}
 </section>
 )}

 <GlassCard className="!p-0 overflow-hidden">
 <div className="grid grid-cols-[60px_1.6fr_1fr_100px_120px_140px] items-center gap-4 border-b border-navy-900/8 bg-navy-900/[0.02] px-6 py-3 text-[10px] uppercase tracking-widest text-navy-900/50 dark:border-white/8 dark:bg-white/[0.02] dark:text-white/50">
 <div>{t("hr.lb.colRank")}</div>
 <div>{t("hr.team.colEmployee")}</div>
 <div>{t("hr.team.colDepartment")}</div>
 <div>{t("hr.lb.colLevel")}</div>
 <div>{t("hr.team.colModules")}</div>
 <div className="text-right">XP</div>
 </div>
 <div className="divide-y divide-navy-900/8 dark:divide-white/8">
 {items.map((m) => (
 <Link
 key={m.user_id}
 to={`/hr/users/${m.user_id}`}
 className="grid grid-cols-[60px_1.6fr_1fr_100px_120px_140px] items-center gap-4 px-6 py-3 transition hover:bg-white/40 dark:hover:bg-white/[0.03]"
 >
 <div className="font-display text-sm font-semibold tabular-nums">#{m.rank}</div>
 <div className="flex items-center gap-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-xs font-bold text-navy-900">
 {m.full_name.slice(0, 1)}
 </div>
 <div className="truncate text-sm font-semibold">{m.full_name}</div>
 </div>
 <div className="truncate text-xs text-navy-900/70 dark:text-white/70">{m.department || "—"}</div>
 <div className="text-xs">
 <span className="rounded-full bg-navy-900/8 px-2 py-0.5 text-[10px] font-semibold dark:bg-white/10">
 L{m.level}
 </span>
 </div>
 <div className="text-xs tabular-nums text-navy-900/70 dark:text-white/70">
 К {m.courses_done} · С {m.scenarios_done}
 </div>
 <div className="text-right">
 <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-700 dark:text-gold-300">
 <Sparkles size={11} /> {m.total_xp}
 </span>
 </div>
 </Link>
 ))}
 {items.length === 0 && (
 <div className="p-10 text-center text-sm text-navy-900/50 dark:text-white/50">
 {t("hr.lb.empty")}
 </div>
 )}
 </div>
 </GlassCard>
 </div>
 );
}
