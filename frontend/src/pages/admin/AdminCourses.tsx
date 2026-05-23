import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  X,
  Lock,
  CheckCircle2,
  Clock,
  Hash,
} from "lucide-react";
import { api, AdminCourse, AdminCourseCreate, ScenarioSummary } from "../../api";
import GlassCard from "../../components/GlassCard";
import { useProgress } from "../../state/ProgressContext";
import { useT } from "../../state/LocaleContext";

const DIFF_OPTIONS = ["easy", "medium", "hard"] as const;

const BLANK: AdminCourseCreate = {
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  icon: "book",
  difficulty: "easy",
  estimated_minutes: 15,
  target_scenario_id: "",
  tags: [],
  lessons: [
    { slug: "l1", title: "Урок 1", summary: "", duration_min: 5, body_md: "## Введение\n\nТекст урока." },
  ],
  quiz: [
    {
      id: "q1",
      question: "Образец вопроса?",
      options: [
        { id: "a", text: "Неверный ответ", correct: false },
        { id: "b", text: "Правильный ответ", correct: true },
      ],
      explanation: "Пояснение к правильному ответу.",
    },
  ],
};

export default function AdminCourses() {
  const t = useT();
  const { scenarios } = useProgress();
  const [items, setItems] = useState<AdminCourse[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    api.adminCourses().then(setItems).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const onDelete = async (id: number) => {
    if (!confirm(t("admin.courses.confirmDelete"))) return;
    try {
      await api.adminDeleteCourse(id);
      load();
    } catch (e: any) {
      alert(e?.detail || e?.message || t("admin.courses.deleteFailed"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
            <BookOpen size={14} className="text-gold-500" /> {t("admin.courses.kicker")}
          </div>
          <h1 className="hero-text mt-2">{t("admin.courses.title")}</h1>
          <p className="mt-2 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
            {t("admin.courses.subtitle")}
          </p>
        </div>
        <button className="btn-gold" onClick={() => setOpen(true)}>
          <Plus size={14} /> {t("admin.courses.create")}
        </button>
      </header>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_120px_140px_80px] items-center gap-4 border-b border-navy-900/8 bg-navy-900/[0.02] px-6 py-3 text-[10px] uppercase tracking-widest text-navy-900/50 dark:border-white/8 dark:bg-white/[0.02] dark:text-white/50">
          <div>{t("admin.courses.colCourse")}</div>
          <div>{t("admin.courses.colType")}</div>
          <div>{t("admin.courses.colLessons")}</div>
          <div>{t("admin.courses.colScenario")}</div>
          <div className="text-right">{t("admin.courses.colActions")}</div>
        </div>
        <div className="divide-y divide-navy-900/8 dark:divide-white/8">
          {items.map((c) => {
            const scenarioTitle = scenarios.find((s) => s.id === c.target_scenario_id)?.title;
            return (
              <motion.div
                key={`${c.source}-${c.slug}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-[1.5fr_1fr_120px_140px_80px] items-center gap-4 px-6 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{c.title}</span>
                    {c.source === "built_in" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy-900/8 px-2 py-0.5 text-[9px] uppercase tracking-wider text-navy-900/60 dark:bg-white/10 dark:text-white/60">
                        <Lock size={9} /> built-in
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                    <Hash size={9} className="inline" />{c.slug} · {c.subtitle}
                  </div>
                </div>
                <div className="text-xs">
                  <div className={c.source === "custom" ? "font-semibold text-gold-700 dark:text-gold-300" : ""}>
                    {c.source === "custom" ? "Custom" : "Built-in"}
                  </div>
                  <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                    {c.created_by_name ?? t("common.system")}
                  </div>
                </div>
                <div className="text-xs tabular-nums">
                  <div>{c.lessons_count} {t("common.lessons")}</div>
                  <div className="text-[11px] text-navy-900/50 dark:text-white/50">
                    <Clock size={9} className="inline" /> {c.estimated_minutes} {t("common.minutes")} · {t("admin.courses.editor.quiz")}: {c.quiz_count}
                  </div>
                </div>
                <div className="text-xs text-navy-900/70 dark:text-white/70">
                  {c.target_scenario_id ? (
                    <>
                      <CheckCircle2 size={11} className="mr-1 inline text-emerald-500" />
                      {scenarioTitle ?? c.target_scenario_id}
                    </>
                  ) : (
                    <span className="text-navy-900/40 dark:text-white/40">—</span>
                  )}
                </div>
                <div className="text-right">
                  {c.source === "custom" ? (
                    <button
                      onClick={() => onDelete(c.id)}
                      className="rounded-full p-2 text-rose-600 transition hover:bg-rose-500/10"
                      title={t("common.delete")}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <span className="text-[10px] text-navy-900/30 dark:text-white/30">—</span>
                  )}
                </div>
              </motion.div>
            );
          })}
          {items.length === 0 && (
            <div className="p-10 text-center text-sm text-navy-900/50 dark:text-white/50">
              {t("common.loading")}
            </div>
          )}
        </div>
      </GlassCard>

      <AnimatePresence>
        {open && (
          <CourseEditor scenarios={scenarios} onClose={() => setOpen(false)} onCreated={load} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CourseEditor({
  scenarios,
  onClose,
  onCreated,
}: {
  scenarios: ScenarioSummary[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<AdminCourseCreate>(structuredClone(BLANK));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upd = <K extends keyof AdminCourseCreate>(k: K, v: AdminCourseCreate[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const addLesson = () => {
    const idx = draft.lessons.length + 1;
    upd("lessons", [
      ...draft.lessons,
      { slug: `l${idx}`, title: `Урок ${idx}`, summary: "", duration_min: 5, body_md: "" },
    ]);
  };
  const removeLesson = (i: number) => upd("lessons", draft.lessons.filter((_, j) => j !== i));
  const updLesson = (i: number, patch: Partial<typeof draft.lessons[number]>) =>
    upd(
      "lessons",
      draft.lessons.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    );

  const addQuestion = () => {
    const idx = draft.quiz.length + 1;
    upd("quiz", [
      ...draft.quiz,
      {
        id: `q${idx}`,
        question: "",
        options: [
          { id: "a", text: "", correct: false },
          { id: "b", text: "", correct: true },
        ],
        explanation: "",
      },
    ]);
  };
  const removeQuestion = (i: number) => upd("quiz", draft.quiz.filter((_, j) => j !== i));
  const updQuestion = (i: number, patch: Partial<typeof draft.quiz[number]>) =>
    upd(
      "quiz",
      draft.quiz.map((q, j) => (j === i ? { ...q, ...patch } : q)),
    );
  const updOption = (qi: number, oi: number, patch: { text?: string; correct?: boolean }) =>
    updQuestion(qi, {
      options: draft.quiz[qi].options.map((o, j) => (j === oi ? { ...o, ...patch } : o)),
    });
  const setCorrect = (qi: number, oi: number) =>
    updQuestion(qi, {
      options: draft.quiz[qi].options.map((o, j) => ({ ...o, correct: j === oi })),
    });

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.adminCreateCourse(draft);
      onCreated();
      onClose();
    } catch (e: any) {
      setErr(e?.detail || e?.message || t("admin.courses.deleteFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-3xl rounded-3xl border border-white/20 bg-white/95 p-7 shadow-glass-lg backdrop-blur-2xl dark:border-white/10 dark:bg-navy-900/95"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
              <Plus size={14} className="text-gold-500" /> {t("admin.courses.editor.kicker")}
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight">{t("admin.courses.editor.title")}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-navy-900/60 hover:bg-navy-900/8 dark:text-white/60 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("admin.courses.editor.slug")} required>
              <input
                value={draft.slug}
                onChange={(e) => upd("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="input"
                placeholder="my_new_course"
              />
            </Field>
            <Field label={t("admin.courses.editor.icon")}>
              <select value={draft.icon} onChange={(e) => upd("icon", e.target.value)} className="input">
                <option value="book">{t("admin.courses.iconBook")}</option>
                <option value="wallet">{t("admin.courses.iconWallet")}</option>
                <option value="headphones">{t("admin.courses.iconHeadphones")}</option>
                <option value="shield">{t("admin.courses.iconShield")}</option>
              </select>
            </Field>
          </div>

          <Field label={t("admin.courses.editor.titleField")} required>
            <input value={draft.title} onChange={(e) => upd("title", e.target.value)} className="input" />
          </Field>
          <Field label={t("admin.courses.editor.subtitle")}>
            <input value={draft.subtitle ?? ""} onChange={(e) => upd("subtitle", e.target.value)} className="input" />
          </Field>
          <Field label={t("admin.courses.editor.description")}>
            <textarea
              value={draft.description ?? ""}
              onChange={(e) => upd("description", e.target.value)}
              className="input"
              rows={3}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t("admin.courses.editor.difficulty")}>
              <select
                value={draft.difficulty}
                onChange={(e) => upd("difficulty", e.target.value as any)}
                className="input"
              >
                {DIFF_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label={t("admin.courses.editor.duration")}>
              <input
                type="number"
                min={1}
                value={draft.estimated_minutes ?? 15}
                onChange={(e) => upd("estimated_minutes", Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label={t("admin.courses.editor.targetScenario")}>
              <select
                value={draft.target_scenario_id ?? ""}
                onChange={(e) => upd("target_scenario_id", e.target.value)}
                className="input"
              >
                <option value="">{t("admin.courses.editor.targetNone")}</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t("admin.courses.editor.tags")}>
            <input
              value={(draft.tags ?? []).join(", ")}
              onChange={(e) => upd("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              className="input"
            />
          </Field>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">{t("admin.courses.editor.lessons")}</h3>
            <button onClick={addLesson} className="btn-ghost !px-3 !py-1.5 text-xs">
              <Plus size={12} /> {t("admin.courses.editor.add")}
            </button>
          </div>
          <div className="space-y-3">
            {draft.lessons.map((l, i) => (
              <div key={i} className="rounded-2xl border border-navy-900/8 bg-white/40 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="grid gap-2 sm:grid-cols-[100px_1fr_90px_36px]">
                  <input
                    value={l.slug}
                    onChange={(e) => updLesson(i, { slug: e.target.value })}
                    placeholder="slug"
                    className="input !py-2"
                  />
                  <input
                    value={l.title}
                    onChange={(e) => updLesson(i, { title: e.target.value })}
                    placeholder={t("admin.courses.editor.lessonName")}
                    className="input !py-2"
                  />
                  <input
                    type="number"
                    min={1}
                    value={l.duration_min}
                    onChange={(e) => updLesson(i, { duration_min: Number(e.target.value) })}
                    className="input !py-2"
                  />
                  <button
                    onClick={() => removeLesson(i)}
                    disabled={draft.lessons.length <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-500/10 disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={l.summary}
                  onChange={(e) => updLesson(i, { summary: e.target.value })}
                  placeholder={t("admin.courses.editor.lessonSummaryPh")}
                  className="input mt-2 !py-2"
                />
                <textarea
                  value={l.body_md}
                  onChange={(e) => updLesson(i, { body_md: e.target.value })}
                  placeholder={t("admin.courses.editor.lessonBodyPh")}
                  className="input mt-2 font-mono !text-[12.5px]"
                  rows={4}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Квиз */}
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">{t("admin.courses.editor.quiz")}</h3>
            <button onClick={addQuestion} className="btn-ghost !px-3 !py-1.5 text-xs">
              <Plus size={12} /> {t("admin.courses.editor.addQuestion")}
            </button>
          </div>
          <div className="space-y-3">
            {draft.quiz.map((q, qi) => (
              <div key={qi} className="rounded-2xl border border-navy-900/8 bg-white/40 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="grid gap-2 sm:grid-cols-[80px_1fr_36px]">
                  <input
                    value={q.id}
                    onChange={(e) => updQuestion(qi, { id: e.target.value })}
                    placeholder="id"
                    className="input !py-2"
                  />
                  <input
                    value={q.question}
                    onChange={(e) => updQuestion(qi, { question: e.target.value })}
                    placeholder={t("admin.courses.editor.questionTextPh")}
                    className="input !py-2"
                  />
                  <button
                    onClick={() => removeQuestion(qi)}
                    disabled={draft.quiz.length <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-500/10 disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={o.correct}
                        onChange={() => setCorrect(qi, oi)}
                        className="h-4 w-4 accent-gold-500"
                        title="Правильный ответ"
                      />
                      <span className="w-6 text-center text-xs font-semibold">{o.id.toUpperCase()}</span>
                      <input
                        value={o.text}
                        onChange={(e) => updOption(qi, oi, { text: e.target.value })}
                        placeholder="Вариант ответа"
                        className="input !py-1.5 flex-1"
                      />
                    </div>
                  ))}
                </div>
                <input
                  value={q.explanation ?? ""}
                  onChange={(e) => updQuestion(qi, { explanation: e.target.value })}
                  placeholder="Пояснение (показывается после ответа)"
                  className="input mt-2 !py-2"
                />
              </div>
            ))}
          </div>
        </div>

        {err && (
          <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
            {err}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Отмена</button>
          <button onClick={save} disabled={busy || !draft.slug || !draft.title} className="btn-primary">
            {busy ? "Сохранение…" : "Опубликовать курс"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy-900/60 dark:text-white/60">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
