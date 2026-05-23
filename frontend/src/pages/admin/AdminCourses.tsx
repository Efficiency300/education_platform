import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  Lock,
  CheckCircle2,
  Clock,
  Hash,
  Pencil,
  Wand2,
} from "lucide-react";
import {
  api,
  AdminCourse,
  AdminCourseCreate,
  AdminCourseUpdate,
  ScenarioSummary,
} from "../../api";
import GlassCard from "../../components/GlassCard";
import { LessonAttachmentsEditor } from "../../components/LessonAttachments";
import { useProgress } from "../../state/ProgressContext";
import { useT } from "../../state/LocaleContext";

const DIFF_OPTIONS = ["easy", "medium", "hard"] as const;

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; course: AdminCourse };

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
  const [editor, setEditor] = useState<EditorState | null>(null);

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
          <h1 className="hero-text">{t("admin.courses.title")}</h1>
          <p className="mt-2 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
            {t("admin.courses.subtitle")}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditor({ mode: "create" })}>
          <Plus size={14} /> {t("admin.courses.create")}
        </button>
      </header>

      <GlassCard className="!p-0 overflow-hidden">
        <div
          className="grid grid-cols-[1.5fr_1fr_120px_140px_110px] items-center gap-4 px-6 py-3"
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
          <div>{t("admin.courses.colCourse")}</div>
          <div>{t("admin.courses.colType")}</div>
          <div>{t("admin.courses.colLessons")}</div>
          <div>{t("admin.courses.colScenario")}</div>
          <div className="text-right">{t("admin.courses.colActions")}</div>
        </div>
        <div>
          {items.map((c, idx) => {
            const scenarioTitle = scenarios.find((s) => s.id === c.target_scenario_id)?.title;
            return (
              <motion.div
                key={`${c.source}-${c.slug}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * idx }}
                className="grid grid-cols-[1.5fr_1fr_120px_140px_110px] items-center gap-4 px-6 py-3"
                style={{
                  borderTop: idx === 0 ? "none" : "0.5px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</span>
                    {c.source === "built_in" && (
                      <span
                        className="inline-flex items-center gap-1"
                        style={{
                          padding: "2px 6px",
                          borderRadius: 99,
                          background: "var(--bg-card)",
                          border: "0.5px solid var(--border)",
                          color: "var(--text-tertiary)",
                          fontSize: 9,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        <Lock size={9} /> built-in
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    <Hash size={9} className="inline" />{c.slug} · {c.subtitle}
                  </div>
                </div>
                <div style={{ fontSize: 12 }}>
                  <div style={{ color: c.source === "custom" ? "var(--brand)" : "var(--text-primary)", fontWeight: c.source === "custom" ? 600 : 500 }}>
                    {c.source === "custom" ? "Custom" : "Built-in"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    {c.created_by_name ?? t("common.system")}
                  </div>
                </div>
                <div className="tabular-nums" style={{ fontSize: 12 }}>
                  <div>{c.lessons_count} {t("common.lessons")}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    <Clock size={9} className="inline" /> {c.estimated_minutes} {t("common.minutes")} · {t("admin.courses.editor.quiz")}: {c.quiz_count}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {c.target_scenario_id ? (
                    <>
                      <CheckCircle2 size={11} className="mr-1 inline" style={{ color: "var(--success)" }} />
                      {scenarioTitle ?? c.target_scenario_id}
                    </>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1">
                  {c.source === "custom" ? (
                    <>
                      <button
                        onClick={() => setEditor({ mode: "edit", course: c })}
                        className="kp-icon-action"
                        title={t("common.edit")}
                        aria-label={t("common.edit")}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(c.id)}
                        className="kp-icon-action kp-icon-action-danger"
                        title={t("common.delete")}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>—</span>
                  )}
                </div>
              </motion.div>
            );
          })}
          {items.length === 0 && (
            <div className="p-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              {t("common.loading")}
            </div>
          )}
        </div>
        <style>{`
          .kp-icon-action {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            padding: 0;
            background: transparent;
            border: 0.5px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .kp-icon-action:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
            border-color: var(--border-emphasis);
          }
          .kp-icon-action-danger:hover {
            background: rgba(240,62,62,0.08);
            color: var(--danger);
            border-color: rgba(240,62,62,0.3);
          }
        `}</style>
      </GlassCard>

      <AnimatePresence>
        {editor && (
          <CourseEditor
            key={editor.mode === "edit" ? `edit-${editor.course.id}` : "create"}
            scenarios={scenarios}
            initial={editor.mode === "edit" ? courseToDraft(editor.course) : undefined}
            editingId={editor.mode === "edit" ? editor.course.id : null}
            onClose={() => setEditor(null)}
            onSaved={() => {
              load();
              setEditor(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function courseToDraft(c: AdminCourse): AdminCourseCreate {
  // The list endpoint doesn't return full lessons/quiz bodies — we hydrate the
  // editor with the metadata we know about and let the admin re-fetch via the
  // user-facing course endpoint if needed. For unsaved fields we use sensible
  // defaults so the editor stays useful even if hydration data is missing.
  return {
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    icon: c.icon,
    difficulty: c.difficulty,
    estimated_minutes: c.estimated_minutes,
    target_scenario_id: c.target_scenario_id,
    tags: c.tags,
    lessons: [
      { slug: "l1", title: "Урок 1", summary: "", duration_min: 5, body_md: "" },
    ],
    quiz: [
      {
        id: "q1",
        question: "Образец вопроса?",
        options: [
          { id: "a", text: "Неверный ответ", correct: false },
          { id: "b", text: "Правильный ответ", correct: true },
        ],
        explanation: "",
      },
    ],
  };
}

function CourseEditor({
  scenarios,
  onClose,
  onSaved,
  initial,
  editingId,
}: {
  scenarios: ScenarioSummary[];
  onClose: () => void;
  onSaved: () => void;
  initial?: AdminCourseCreate;
  editingId: number | null;
}) {
  const t = useT();
  const [draft, setDraft] = useState<AdminCourseCreate>(structuredClone(initial ?? BLANK));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const isEdit = editingId !== null;

  useEffect(() => {
    if (!isEdit) return;
    // Pull the full custom-course payload so the editor shows the actual
    // lessons / quiz content (the admin list endpoint only returns counts).
    api
      .course(initial?.slug ?? "")
      .then((c: any) => {
        const lessons = (c?.lessons ?? []) as AdminCourseCreate["lessons"];
        const quiz = (c?.quiz ?? []) as AdminCourseCreate["quiz"];
        setDraft((d) => ({
          ...d,
          lessons: lessons.length ? lessons : d.lessons,
          quiz: quiz.length ? quiz : d.quiz,
        }));
      })
      .catch(() => {
        /* keep default placeholders */
      });
  }, [isEdit, initial?.slug]);

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
    upd("lessons", draft.lessons.map((l, j) => (j === i ? { ...l, ...patch } : l)));

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
    upd("quiz", draft.quiz.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const updOption = (qi: number, oi: number, patch: { text?: string; correct?: boolean }) =>
    updQuestion(qi, {
      options: draft.quiz[qi].options.map((o, j) => (j === oi ? { ...o, ...patch } : o)),
    });
  const setCorrect = (qi: number, oi: number) =>
    updQuestion(qi, {
      options: draft.quiz[qi].options.map((o, j) => ({ ...o, correct: j === oi })),
    });

  const generateQuiz = async () => {
    if (generating) return;
    const hasMaterial = draft.lessons.some((l) => (l.body_md || l.summary || l.title).trim());
    if (!hasMaterial) {
      setErr(t("admin.courses.editor.quizGen.empty"));
      return;
    }
    setGenerating(true);
    setErr(null);
    try {
      const generated = await api.adminGenerateQuiz({
        lessons: draft.lessons,
        count: Math.min(8, Math.max(3, draft.lessons.length * 2)),
      });
      if (generated && generated.length) {
        upd("quiz", generated);
      } else {
        setErr(t("admin.courses.editor.quizGen.empty"));
      }
    } catch (e: any) {
      setErr(e?.detail || e?.message || t("admin.courses.editor.quizGen.failed"));
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (isEdit && editingId) {
        const { slug: _slug, ...update } = draft;
        await api.adminUpdateCourse(editingId, update as AdminCourseUpdate);
      } else {
        await api.adminCreateCourse(draft);
      }
      onSaved();
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.98, y: 6 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full"
        style={{
          maxWidth: 760,
          padding: 28,
          borderRadius: "var(--radius-xl)",
          background: "var(--bg-elevated)",
          border: "0.5px solid var(--border-emphasis)",
          color: "var(--text-primary)",
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {isEdit ? t("admin.courses.editor.editTitle") : t("admin.courses.editor.title")}
          </h2>
          <button
            onClick={onClose}
            className="kp-icon-action"
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

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("admin.courses.editor.slug")} required>
              <input
                value={draft.slug}
                onChange={(e) => upd("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="input"
                placeholder="my_new_course"
                disabled={isEdit}
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
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>{t("admin.courses.editor.lessons")}</h3>
            <button onClick={addLesson} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
              <Plus size={12} /> {t("admin.courses.editor.add")}
            </button>
          </div>
          <div className="space-y-3">
            {draft.lessons.map((l, i) => (
              <div
                key={i}
                style={{
                  padding: 14,
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-card)",
                  border: "0.5px solid var(--border)",
                }}
              >
                <div className="grid gap-2 sm:grid-cols-[100px_1fr_90px_36px]">
                  <input
                    value={l.slug}
                    onChange={(e) => updLesson(i, { slug: e.target.value })}
                    placeholder="slug"
                    className="input"
                    style={{ padding: "8px 12px" }}
                  />
                  <input
                    value={l.title}
                    onChange={(e) => updLesson(i, { title: e.target.value })}
                    placeholder={t("admin.courses.editor.lessonName")}
                    className="input"
                    style={{ padding: "8px 12px" }}
                  />
                  <input
                    type="number"
                    min={1}
                    value={l.duration_min}
                    onChange={(e) => updLesson(i, { duration_min: Number(e.target.value) })}
                    className="input"
                    style={{ padding: "8px 12px" }}
                  />
                  <button
                    onClick={() => removeLesson(i)}
                    disabled={draft.lessons.length <= 1}
                    className="kp-icon-action kp-icon-action-danger"
                    aria-label={t("common.delete")}
                    style={{ opacity: draft.lessons.length <= 1 ? 0.4 : 1 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={l.summary}
                  onChange={(e) => updLesson(i, { summary: e.target.value })}
                  placeholder={t("admin.courses.editor.lessonSummaryPh")}
                  className="input mt-2"
                  style={{ padding: "8px 12px" }}
                />
                <textarea
                  value={l.body_md}
                  onChange={(e) => updLesson(i, { body_md: e.target.value })}
                  placeholder={t("admin.courses.editor.lessonBodyPh")}
                  className="input mt-2"
                  style={{ padding: "8px 12px", fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12 }}
                  rows={4}
                />
                <LessonAttachmentsEditor
                  items={l.attachments ?? []}
                  onChange={(next) => updLesson(i, { attachments: next })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quiz */}
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>{t("admin.courses.editor.quiz")}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={generateQuiz}
                disabled={generating}
                className="btn-secondary"
                style={{ padding: "6px 12px", fontSize: 12 }}
                title={t("admin.courses.editor.quizGen.title")}
              >
                <Wand2 size={12} />
                {generating ? t("admin.courses.editor.quizGen.generating") : t("admin.courses.editor.quizGen.action")}
              </button>
              <button onClick={addQuestion} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
                <Plus size={12} /> {t("admin.courses.editor.addQuestion")}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {draft.quiz.map((q, qi) => (
              <div
                key={qi}
                style={{
                  padding: 14,
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-card)",
                  border: "0.5px solid var(--border)",
                }}
              >
                <div className="grid gap-2 sm:grid-cols-[80px_1fr_36px]">
                  <input
                    value={q.id}
                    onChange={(e) => updQuestion(qi, { id: e.target.value })}
                    placeholder="id"
                    className="input"
                    style={{ padding: "8px 12px" }}
                  />
                  <input
                    value={q.question}
                    onChange={(e) => updQuestion(qi, { question: e.target.value })}
                    placeholder={t("admin.courses.editor.questionTextPh")}
                    className="input"
                    style={{ padding: "8px 12px" }}
                  />
                  <button
                    onClick={() => removeQuestion(qi)}
                    disabled={draft.quiz.length <= 1}
                    className="kp-icon-action kp-icon-action-danger"
                    aria-label={t("common.delete")}
                    style={{ opacity: draft.quiz.length <= 1 ? 0.4 : 1 }}
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
                        style={{ accentColor: "var(--brand)", width: 14, height: 14 }}
                        title={t("admin.courses.editor.correctAnswer")}
                      />
                      <span style={{ width: 24, textAlign: "center", fontSize: 12, fontWeight: 600 }}>
                        {o.id.toUpperCase()}
                      </span>
                      <input
                        value={o.text}
                        onChange={(e) => updOption(qi, oi, { text: e.target.value })}
                        placeholder={t("admin.courses.editor.optionPh")}
                        className="input"
                        style={{ padding: "6px 12px", flex: 1 }}
                      />
                    </div>
                  ))}
                </div>
                <input
                  value={q.explanation ?? ""}
                  onChange={(e) => updQuestion(qi, { explanation: e.target.value })}
                  placeholder={t("admin.courses.editor.explanationPh")}
                  className="input mt-2"
                  style={{ padding: "8px 12px" }}
                />
              </div>
            ))}
          </div>
        </div>

        {err && (
          <div
            className="mt-5"
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

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">{t("common.cancel")}</button>
          <button
            onClick={save}
            disabled={busy || !draft.slug || !draft.title}
            className="btn-primary"
          >
            {busy
              ? t("admin.courses.editor.saving")
              : isEdit
                ? t("common.save")
                : t("admin.courses.editor.publish")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
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
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
