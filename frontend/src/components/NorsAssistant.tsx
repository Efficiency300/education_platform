import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Send, X, Sparkles, Move, ChevronDown, ChevronUp, RotateCw } from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useT, useLocale } from "../state/LocaleContext";
import {
 api,
 NorthState,
 NorthScenarioStep,
 NorthProgressPayload,
} from "../api";
import NorthMascot from "./north/NorthMascot";

/**
 * Global floating Nors assistant.
 *
 * Behaviour:
 * - Hidden by default; opens when the user clicks the Topbar Nors button
 *   (which dispatches a CustomEvent("nors:toggle")).
 * - The panel itself is draggable by its header (Move handle), so the user
 *   can park it anywhere on screen — position persists in localStorage.
 * - Content is module-aware: on each route we surface a 1-line intro about
 *   what this module is for plus quick-action navigation.
 * - The admin-authored Nors scenario (if any) is rendered inline so the
 *   newcomer flow still works without a dedicated dashboard panel.
 * - Free-form chat goes to /api/chat (Gemini); navigation commands are
 *   handled client-side without burning tokens.
 */

const TOGGLE_EVENT = "nors:toggle";
const POS_KEY = "ai_mentor_nors_pos_v2";

interface Msg {
 id: string;
 role: "north" | "user";
 text: string;
 navHint?: { path: string; label: string };
}

type NavTarget = { path: string; labelKey: string; intent: string };

const NAV_TARGETS: NavTarget[] = [
 { path: "/courses/python_backend_az", labelKey: "nors.nav.python", intent: "python" },
 { path: "/courses", labelKey: "nors.nav.courses", intent: "courses" },
 { path: "/simulator", labelKey: "nors.nav.sim", intent: "simulator" },
 { path: "/progress", labelKey: "nors.nav.progress", intent: "progress" },
 { path: "/chat", labelKey: "nors.nav.chat", intent: "assistant" },
 { path: "/teams", labelKey: "nors.nav.teams", intent: "teams" },
 { path: "/profile", labelKey: "nors.nav.profile", intent: "profile" },
];

function detectIntent(raw: string): NavTarget | null {
 const text = raw.toLowerCase().trim();
 if (text.includes("?")) return null;
 if (/^(что|почему|как|зачем|когда|where|why|what|how|when|nima|qachon|qanday|qaysi|qayer)/i.test(text)) return null;
 const wordCount = text.split(/\s+/).length;
 const navVerb = /(открой|открыть|перейди|перейти|покажи|показать|зайди|давай|пойдём|пошли|och|olib bor|ber|kir|ket|open|show|go|take me|let'?s go|navigate)/i.test(text);
 const isCommand = wordCount <= 4 || navVerb;
 if (!isCommand) return null;
 if (/(python|питон|пайтон|piton|backend|бэкенд|бекенд)/.test(text)) return NAV_TARGETS[0];
 if (/(симул|simul|simulyator|sandbox|amaliyot)/.test(text)) return NAV_TARGETS[2];
 if (/(прогресс|progress|yutuq|achievement|статистик|statistik|natija)/.test(text)) return NAV_TARGETS[3];
 if (/(чат|chat|assistant|yordamchi|ассистент|suhbat)/.test(text)) return NAV_TARGETS[4];
 if (/(команд|team|jamoa)/.test(text)) return NAV_TARGETS[5];
 if (/(профил|profil|profile|настройк|sozlam)/.test(text)) return NAV_TARGETS[6];
 if (/(курс|course|kurs|katalog|каталог)/.test(text)) return NAV_TARGETS[1];
 return null;
}

/** What page is the user on, expressed as a context key for the module intro. */
function pageContext(pathname: string): string {
 if (pathname === "/" || pathname === "") return "home";
 if (pathname.startsWith("/courses/python_backend_az")) return "course.python";
 if (pathname.startsWith("/courses/")) return "course.detail";
 if (pathname.startsWith("/courses")) return "courses";
 if (pathname.startsWith("/simulator")) return "simulator";
 if (pathname.startsWith("/progress")) return "progress";
 if (pathname.startsWith("/chat")) return "chat";
 if (pathname.startsWith("/teams")) return "teams";
 if (pathname.startsWith("/profile")) return "profile";
 if (pathname.startsWith("/hr")) return "hr";
 if (pathname.startsWith("/admin")) return "admin";
 return "home";
}

/** Per-module intro the mascot greets you with when you land on a page. */
function moduleIntro(ctx: string, t: (k: string, p?: any) => string, userName: string): string {
 const name = userName || t("common.you");
 switch (ctx) {
 case "course.python":
 return t("nors.module.python", { name });
 case "course.detail":
 return t("nors.module.courseDetail", { name });
 case "courses":
 return t("nors.module.courses", { name });
 case "simulator":
 return t("nors.module.simulator", { name });
 case "progress":
 return t("nors.module.progress", { name });
 case "chat":
 return t("nors.module.chat", { name });
 case "teams":
 return t("nors.module.teams", { name });
 case "profile":
 return t("nors.module.profile", { name });
 case "hr":
 return t("nors.module.hr", { name });
 case "admin":
 return t("nors.module.admin", { name });
 default:
 return t("nors.module.home", { name });
 }
}

interface Position {
 x: number; // distance from right edge
 y: number; // distance from bottom edge
}

function loadPosition(): Position {
 try {
 const raw = localStorage.getItem(POS_KEY);
 if (raw) {
 const p = JSON.parse(raw);
 if (typeof p?.x === "number" && typeof p?.y === "number") return p;
 }
 } catch {
 /* ignore */
 }
 return { x: 24, y: 24 };
}

function savePosition(p: Position): void {
 try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch {}
}

export default function NorsAssistant() {
 const { user } = useAuth();
 const t = useT();
 const { locale } = useLocale();
 const navigate = useNavigate();
 const location = useLocation();
 const [open, setOpen] = useState(false);
 const [collapsed, setCollapsed] = useState(false);
 const [msgs, setMsgs] = useState<Msg[]>([]);
 const [input, setInput] = useState("");
 const [busy, setBusy] = useState(false);
 const [state, setState] = useState<NorthState>("hyped");
 const [pos, setPos] = useState<Position>(() => loadPosition());
 const [scenario, setScenario] = useState<NorthProgressPayload | null>(null);
 const scrollRef = useRef<HTMLDivElement | null>(null);

 // Listen for the global toggle event fired by the Topbar button.
 useEffect(() => {
 const onToggle = () => setOpen((v) => !v);
 window.addEventListener(TOGGLE_EVENT, onToggle);
 return () => window.removeEventListener(TOGGLE_EVENT, onToggle);
 }, []);

 // Persist position whenever it changes.
 useEffect(() => { savePosition(pos); }, [pos]);

 // Module-aware greeting: when the route changes (or panel opens), inject
 // a single "module intro" bubble from Nors. We don't clear prior chat —
 // the intro just stacks on top so the user can scroll back.
 const lastIntroRouteRef = useRef<string>("");
 useEffect(() => {
 if (!open || !user) return;
 const ctx = pageContext(location.pathname);
 const key = ctx + "|" + location.pathname;
 if (lastIntroRouteRef.current === key) return;
 lastIntroRouteRef.current = key;
 const firstName = (user.full_name || "").trim().split(/\s+/)[0] || "";
 const intro = moduleIntro(ctx, t, firstName);
 setMsgs((prev) => [
 ...prev,
 { id: `intro-${Date.now()}`, role: "north", text: intro },
 ]);
 setState("waiting");
 }, [open, location.pathname, user, t]);

 // Fetch the admin-authored scenario the first time the panel opens.
 useEffect(() => {
 if (!open || !user || scenario !== null) return;
 (async () => {
 try {
 const p = await api.northProgress();
 setScenario(p);
 } catch {
 /* no scenario assigned — fine, panel still works */
 }
 })();
 }, [open, user, scenario]);

 // Auto-scroll on new messages.
 useEffect(() => {
 const el = scrollRef.current;
 if (!el) return;
 el.scrollTop = el.scrollHeight;
 }, [msgs, busy, scenario]);

 if (!user) return null;

 const push = (m: Msg) => setMsgs((prev) => [...prev, m]);

 const navigateAndAnnounce = (target: NavTarget) => {
 push({
 id: `nav-${Date.now()}`,
 role: "north",
 text: t("nors.assistant.routing", { target: t(target.labelKey) }),
 });
 setState("celebrating");
 window.setTimeout(() => {
 navigate(target.path);
 setState("waiting");
 }, 400);
 };

 const submit = async (raw: string) => {
 const text = raw.trim();
 if (!text || busy) return;
 push({ id: `u-${Date.now()}`, role: "user", text });
 setInput("");
 setState("thinking");

 const intent = detectIntent(text);
 if (intent) {
 navigateAndAnnounce(intent);
 return;
 }

 setBusy(true);
 try {
 const res = await api.ask(user.id, text, locale);
 push({ id: `a-${Date.now()}`, role: "north", text: res.answer });
 setState("celebrating");
 window.setTimeout(() => setState("waiting"), 1200);
 } catch {
 push({ id: `e-${Date.now()}`, role: "north", text: t("nors.assistant.error") });
 setState("surprised");
 } finally {
 setBusy(false);
 }
 };

 // -------- Drag handling --------
 const dragRef = useRef<{ startX: number; startY: number; startPos: Position } | null>(null);
 const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
 const point = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
 dragRef.current = { startX: point.clientX, startY: point.clientY, startPos: { ...pos } };
 const onMove = (ev: MouseEvent | TouchEvent) => {
 if (!dragRef.current) return;
 const p = "touches" in ev ? ev.touches[0] : (ev as MouseEvent);
 const dx = p.clientX - dragRef.current.startX;
 const dy = p.clientY - dragRef.current.startY;
 setPos({
 x: Math.max(8, Math.min(window.innerWidth - 340, dragRef.current.startPos.x - dx)),
 y: Math.max(8, Math.min(window.innerHeight - 140, dragRef.current.startPos.y - dy)),
 });
 };
 const onUp = () => {
 dragRef.current = null;
 window.removeEventListener("mousemove", onMove);
 window.removeEventListener("mouseup", onUp);
 window.removeEventListener("touchmove", onMove);
 window.removeEventListener("touchend", onUp);
 };
 window.addEventListener("mousemove", onMove);
 window.addEventListener("mouseup", onUp);
 window.addEventListener("touchmove", onMove);
 window.addEventListener("touchend", onUp);
 }, [pos]);

 if (!open) return null;

 const ctxKey = pageContext(location.pathname);
 const currentStep: NorthScenarioStep | null = scenario?.next_step ?? null;

 return (
 <div
 className="nors-panel"
 role="dialog"
 aria-modal="false"
 style={{ right: pos.x, bottom: pos.y }}
 >
 {/* Drag handle / header */}
 <div className="nors-panel-head" onMouseDown={onDragStart} onTouchStart={onDragStart}>
 <div className="flex items-center gap-2" style={{ pointerEvents: "none" }}>
 <Move size={12} style={{ color: "var(--text-tertiary)" }} />
 <Sparkles size={12} style={{ color: "var(--brand)" }} />
 <span style={{ fontSize: 13, fontWeight: 600 }}>{t("nors.name")}</span>
 <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>· {pageLabel(location.pathname, t)}</span>
 </div>
 <div className="flex items-center gap-1" style={{ pointerEvents: "auto" }}>
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}
 onMouseDown={(e) => e.stopPropagation()}
 className="nors-icon-btn"
 aria-label={collapsed ? t("common.open") : t("common.continue")}
 >
 {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
 </button>
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); setOpen(false); }}
 onMouseDown={(e) => e.stopPropagation()}
 className="nors-icon-btn"
 aria-label={t("common.cancel")}
 >
 <X size={14} />
 </button>
 </div>
 </div>

 {!collapsed && (
 <>
 <div className="nors-panel-mascot">
 <NorthMascot state={state} height={110} />
 </div>

 <div ref={scrollRef} className="nors-panel-scroll">
 {msgs.map((m) => (
 <div key={m.id} className={`nors-bubble nors-bubble-${m.role}`}>{m.text}</div>
 ))}
 {busy && <div className="nors-typing">{t("nors.assistant.typing")}</div>}

 {scenario && scenario.scenario && scenario.completed && (
 <div className="nors-scenario-card">
 <div className="nors-step-msg">{t("nors.completed.body")}</div>
 <div className="nors-step-actions">
 <button
 type="button"
 className="nors-step-btn"
 onClick={async () => {
 setBusy(true);
 try {
 const p = await api.northReset();
 setScenario(p);
 setState(p.next_step?.north_state ?? "hyped");
 } finally {
 setBusy(false);
 }
 }}
 >
 <RotateCw size={12} style={{ marginRight: 4, display: "inline" }} />
 {t("nors.restart")}
 </button>
 </div>
 </div>
 )}
 {currentStep && (
 <ScenarioStepCard
 step={currentStep}
 progress={scenario!}
 t={t}
 onAdvance={async (response) => {
 setBusy(true);
 try {
 const res = await api.northRespond(currentStep.id, response ?? null);
 setScenario((prev) => prev ? {
 ...prev,
 current_step: res.current_step,
 total_steps: res.total_steps,
 completed: res.completed,
 next_step: res.next_step,
 } : prev);
 if (res.is_correct === false) {
 setState("surprised");
 // Surface the per-step explanation as a follow-up Nors bubble.
 if (res.feedback) {
 push({ id: `fb-${Date.now()}`, role: "north", text: res.feedback });
 }
 } else if (res.completed) {
 setState("celebrating");
 } else {
 setState(res.next_step?.north_state ?? "waiting");
 }
 // Navigation hint: courses go to /courses/<slug>, url-type to the raw
 // path (covers sim:* and route:* content_refs from the seeded scenario).
 if (res.navigate) {
 const targetLabel = res.navigate.label || res.navigate.target;
 push({
 id: `sc-nav-${Date.now()}`,
 role: "north",
 text: t("nors.assistant.routing", { target: targetLabel }),
 });
 const path = res.navigate.type === "course"
 ? `/courses/${res.navigate.target}`
 : res.navigate.target;
 window.setTimeout(() => navigate(path), 500);
 }
 } catch {
 setState("surprised");
 } finally {
 setBusy(false);
 }
 }}
 />
 )}
 </div>

 <div className="nors-quick">
 {moduleQuickActions(ctxKey).map((tg) => (
 <button
 key={tg.path}
 type="button"
 onClick={() => navigateAndAnnounce(tg)}
 className="nors-chip"
 >
 {t(tg.labelKey)}
 </button>
 ))}
 </div>

 <form
 onSubmit={(e) => { e.preventDefault(); submit(input); }}
 className="nors-input-row"
 >
 <input
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder={t("nors.assistant.placeholder")}
 disabled={busy}
 className="nors-input"
 autoFocus
 />
 <button
 type="submit"
 disabled={busy || !input.trim()}
 className="nors-send"
 aria-label={t("nors.assistant.send")}
 >
 <Send size={14} />
 </button>
 </form>
 </>
 )}

 <style>{`
 .nors-panel {
 position: fixed;
 width: 340px;
 max-height: min(72vh, 680px);
 background: var(--bg-elevated);
 border: 0.5px solid var(--border-emphasis);
 border-radius: 18px;
 z-index: 70;
 display: flex;
 flex-direction: column;
 overflow: hidden;
 box-shadow: 0 16px 48px rgba(0,0,0,0.28);
 }
 .nors-panel-head {
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 10px 12px;
 border-bottom: 0.5px solid var(--border);
 cursor: grab;
 user-select: none;
 }
 .nors-panel-head:active { cursor: grabbing; }
 .nors-icon-btn {
 width: 26px;
 height: 26px;
 background: transparent;
 border: 0.5px solid var(--border);
 border-radius: 7px;
 color: var(--text-secondary);
 cursor: pointer;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 }
 .nors-icon-btn:hover { background: var(--bg-hover); }
 .nors-panel-mascot { padding: 4px 0 0; }
 .nors-panel-scroll {
 flex: 1;
 overflow-y: auto;
 padding: 8px 14px 4px;
 display: flex;
 flex-direction: column;
 gap: 8px;
 min-height: 120px;
 }
 .nors-bubble {
 max-width: 88%;
 padding: 8px 12px;
 border-radius: 12px;
 font-size: 13px;
 line-height: 1.45;
 white-space: pre-wrap;
 word-wrap: break-word;
 }
 .nors-bubble-north {
 align-self: flex-start;
 background: var(--brand-subtle);
 color: var(--text-primary);
 border-top-left-radius: 4px;
 }
 .nors-bubble-user {
 align-self: flex-end;
 background: var(--brand);
 color: #fff;
 border-top-right-radius: 4px;
 }
 .nors-typing {
 align-self: flex-start;
 font-size: 12px;
 color: var(--text-tertiary);
 font-style: italic;
 padding: 4px 8px;
 }
 .nors-quick {
 display: flex;
 flex-wrap: wrap;
 gap: 6px;
 padding: 8px 14px;
 border-top: 0.5px solid var(--border);
 }
 .nors-chip {
 font-size: 11px;
 padding: 5px 10px;
 border-radius: 12px;
 border: 0.5px solid var(--border-brand);
 background: var(--brand-subtle);
 color: var(--brand);
 cursor: pointer;
 transition: all 0.15s;
 }
 .nors-chip:hover { background: var(--brand); color: #fff; }
 .nors-input-row {
 display: flex;
 gap: 8px;
 padding: 10px 12px 12px;
 border-top: 0.5px solid var(--border);
 }
 .nors-input {
 flex: 1;
 background: var(--bg-base);
 border: 0.5px solid var(--border);
 border-radius: 10px;
 padding: 8px 12px;
 color: var(--text-primary);
 font-size: 13px;
 outline: none;
 }
 .nors-input:focus { border-color: var(--brand); }
 .nors-send {
 background: var(--brand);
 color: #fff;
 border: none;
 border-radius: 10px;
 padding: 0 12px;
 cursor: pointer;
 }
 .nors-send:disabled { opacity: 0.5; cursor: not-allowed; }
 .nors-scenario-card {
 border: 0.5px solid var(--border-brand);
 background: var(--brand-subtle);
 border-radius: 12px;
 padding: 10px 12px;
 display: flex;
 flex-direction: column;
 gap: 8px;
 align-self: stretch;
 }
 .nors-scenario-card .nors-step-msg {
 font-size: 13px;
 color: var(--text-primary);
 white-space: pre-wrap;
 }
 .nors-scenario-card .nors-step-counter {
 font-size: 10px;
 color: var(--text-tertiary);
 text-transform: uppercase;
 letter-spacing: 0.08em;
 }
 .nors-scenario-card .nors-step-actions {
 display: flex;
 flex-wrap: wrap;
 gap: 6px;
 }
 .nors-step-btn {
 font-size: 12px;
 padding: 6px 12px;
 border-radius: 10px;
 background: var(--brand);
 color: #fff;
 border: none;
 cursor: pointer;
 }
 .nors-step-btn:disabled { opacity: 0.5; cursor: not-allowed; }
 .nors-step-link {
 font-size: 12px;
 padding: 6px 12px;
 border-radius: 10px;
 background: transparent;
 color: var(--brand);
 border: 0.5px solid var(--border-brand);
 text-decoration: none;
 }
 @media (max-width: 640px) {
 .nors-panel { right: 12px !important; left: 12px; bottom: 88px !important; width: auto; }
 }
 `}</style>
 </div>
 );
}

/** Quick actions are tailored per module — surface the next-step buttons that
 * make sense given where the user is right now. Always include "home" so the
 * panel never feels stuck. */
function moduleQuickActions(ctx: string): NavTarget[] {
 const home: NavTarget = { path: "/", labelKey: "nav.home", intent: "home" };
 const all = NAV_TARGETS;
 switch (ctx) {
 case "home":
 return [all[0], all[1], all[2], all[3]];
 case "courses":
 return [all[0], all[2], all[3], home];
 case "course.python":
 return [all[2], all[3], all[1], home];
 case "course.detail":
 return [all[1], all[2], all[3], home];
 case "simulator":
 return [all[1], all[3], all[4], home];
 case "progress":
 return [all[0], all[1], all[2], home];
 case "chat":
 return [all[0], all[1], all[2], home];
 case "teams":
 return [all[1], all[3], all[6], home];
 case "profile":
 return [home, all[1], all[2], all[3]];
 default:
 return [home, all[1], all[2], all[3]];
 }
}

function pageLabel(pathname: string, t: (k: string) => string): string {
 if (pathname.startsWith("/courses/python_backend_az")) return t("nors.nav.python");
 if (pathname.startsWith("/courses/")) return t("nors.nav.courses");
 if (pathname.startsWith("/courses")) return t("nors.nav.courses");
 if (pathname.startsWith("/simulator")) return t("nors.nav.sim");
 if (pathname.startsWith("/progress")) return t("nors.nav.progress");
 if (pathname.startsWith("/chat")) return t("nors.nav.chat");
 if (pathname.startsWith("/teams")) return t("nors.nav.teams");
 if (pathname.startsWith("/profile")) return t("nors.nav.profile");
 return t("nav.home");
}

/** Renders the current admin-authored scenario step inside the chat scroll. */
function ScenarioStepCard({
 step,
 progress,
 t,
 onAdvance,
}: {
 step: NorthScenarioStep;
 progress: NorthProgressPayload;
 t: (k: string, p?: any) => string;
 onAdvance: (response: string | null) => Promise<void>;
}) {
 const [text, setText] = useState("");
 return (
 <div className="nors-scenario-card">
 <div className="nors-step-counter">
 {t("nors.stepCounter", { n: progress.current_step + 1, total: progress.total_steps })}
 </div>
 <div className="nors-step-msg">{step.north_message}</div>
 {step.content_ref && (() => {
 const ref = step.content_ref.trim();
 if (ref.startsWith("sim:")) {
 const sid = ref.slice(4);
 return (
 <Link to={`/simulator/${sid}`} className="nors-step-link">
 {t("nors.nav.sim")}
 </Link>
 );
 }
 if (ref.startsWith("route:")) {
 const path = ref.slice(6);
 return (
 <Link to={path} className="nors-step-link">
 {t("common.open")}
 </Link>
 );
 }
 return (
 <Link to={`/courses/${ref}`} className="nors-step-link">
 {t("nors.openCourse")}
 </Link>
 );
 })()}
 {step.input_type === "none" && (
 <div className="nors-step-actions">
 <button type="button" className="nors-step-btn" onClick={() => onAdvance(null)}>
 {t("nors.next")}
 </button>
 </div>
 )}
 {step.input_type === "choice" && (
 <div className="nors-step-actions">
 {(step.choices ?? []).map((c) => (
 <button
 key={c}
 type="button"
 className="nors-step-btn"
 onClick={() => onAdvance(c)}
 >
 {c}
 </button>
 ))}
 </div>
 )}
 {step.input_type === "text" && (
 <form
 onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onAdvance(text.trim()); setText(""); } }}
 className="flex gap-2"
 >
 <input
 value={text}
 onChange={(e) => setText(e.target.value)}
 placeholder={t("nors.placeholder")}
 className="nors-input"
 />
 <button type="submit" className="nors-step-btn" disabled={!text.trim()}>
 {t("nors.next")}
 </button>
 </form>
 )}
 </div>
 );
}

/** Helper for the Topbar button — fires the global open/close event. */
export function toggleNors(): void {
 window.dispatchEvent(new CustomEvent(TOGGLE_EVENT));
}
