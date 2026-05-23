import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Mic,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import {
  AdminUser,
  api,
  NorthInputType,
  NorthScenarioOut,
  NorthScenarioStep,
  NorthState,
} from "../../api";
import GlassCard from "../../components/GlassCard";
import DirectionsPicker from "../../components/DirectionsPicker";
import { useT } from "../../state/LocaleContext";

const ALL_STATES: NorthState[] = [
  "idle",
  "thinking",
  "celebrating",
  "surprised",
  "waiting",
  "hyped",
  "listening",
];
const ALL_INPUT_TYPES: NorthInputType[] = ["text", "voice", "choice", "none"];

function newEmptyStep(order: number): NorthScenarioStep {
  return {
    id: `step-${Date.now()}-${order}`,
    order,
    north_message: "",
    input_type: "none",
    choices: [],
    correct_answer: null,
    north_state: "waiting",
    on_complete_state: "celebrating",
    content_ref: null,
  };
}

export default function NorthScenarios() {
  const t = useT();
  const [scenarios, setScenarios] = useState<NorthScenarioOut[]>([]);
  const [editing, setEditing] = useState<NorthScenarioOut | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [buildOpen, setBuildOpen] = useState(false);

  useEffect(() => {
    api.adminListUsers().then(setUsers).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api.adminListScenarios();
      setScenarios(data);
    } catch (e: any) {
      setError(e?.detail || e?.message || "—");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const createNew = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await api.adminCreateScenario({
        name: t("north.admin.newName"),
        department: "",
        steps: [newEmptyStep(0)],
      });
      setScenarios((prev) => [created, ...prev]);
      setEditing(created);
    } catch (e: any) {
      setError(e?.detail || e?.message || "—");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm(t("north.admin.confirmDelete"))) return;
    try {
      await api.adminDeleteScenario(id);
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e: any) {
      setError(e?.detail || e?.message || "—");
    }
  };

  const togglePublish = async (s: NorthScenarioOut) => {
    try {
      const next = await api.adminPublishScenario(
        s.id,
        s.status === "published" ? "draft" : "published",
      );
      setScenarios((prev) => prev.map((x) => (x.id === next.id ? next : x)));
      if (editing?.id === next.id) setEditing(next);
    } catch (e: any) {
      setError(e?.detail || e?.message || "—");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="hero-text">{t("north.admin.title")}</h1>
          <p className="mt-2 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
            {t("north.admin.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBuildOpen(true)} className="btn-secondary">
            <Sparkles size={14} /> {t("north.admin.build")}
          </button>
          <button onClick={createNew} disabled={busy} className="btn-primary">
            <Plus size={14} /> {t("north.admin.create")}
          </button>
        </div>
      </header>

      {buildOpen && (
        <ScenarioBuildModal
          onClose={() => setBuildOpen(false)}
          onBuilt={(s) => {
            setScenarios((prev) => [s, ...prev]);
            setEditing(s);
            setBuildOpen(false);
          }}
        />
      )}

      {error && (
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
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Scenario list */}
        <GlassCard className="!p-0 overflow-hidden">
          <div
            className="grid grid-cols-[1fr_120px_80px_72px] items-center gap-3 px-5 py-3"
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
            <div>{t("north.admin.colName")}</div>
            <div>{t("north.admin.colDept")}</div>
            <div>{t("north.admin.colStatus")}</div>
            <div className="text-right">{t("north.admin.colSteps")}</div>
          </div>
          {scenarios.length === 0 && (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              {t("north.admin.empty")}
            </div>
          )}
          {scenarios.map((s, i) => {
            const active = editing?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setEditing(s)}
                className="grid w-full grid-cols-[1fr_120px_80px_72px] items-center gap-3 px-5 py-3 text-left"
                style={{
                  borderTop: i === 0 ? "none" : "0.5px solid var(--border)",
                  background: active ? "var(--bg-hover)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-kompas)",
                }}
              >
                <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {s.department || "—"}
                </div>
                <div>
                  <span className={`badge ${s.status === "published" ? "badge-success" : "badge-neutral"}`}>
                    {t(`north.admin.status.${s.status}`)}
                  </span>
                </div>
                <div
                  className="text-right tabular-nums"
                  style={{ fontSize: 12, color: "var(--text-tertiary)" }}
                >
                  {s.steps.length}
                </div>
              </button>
            );
          })}
        </GlassCard>

        {/* Editor */}
        <div>
          {editing ? (
            <ScenarioEditor
              key={editing.id}
              scenario={editing}
              users={users}
              onSaved={(saved) => {
                setScenarios((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
                setEditing(saved);
              }}
              onDelete={() => remove(editing.id)}
              onTogglePublish={() => togglePublish(editing)}
              onClose={() => setEditing(null)}
            />
          ) : (
            <div
              className="flex items-center justify-center text-center"
              style={{
                minHeight: 360,
                padding: 24,
                background: "var(--bg-card)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-tertiary)",
                fontSize: 13,
              }}
            >
              {t("north.admin.editorEmpty")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor side panel
// ---------------------------------------------------------------------------

function ScenarioEditor({
  scenario,
  users,
  onSaved,
  onDelete,
  onTogglePublish,
  onClose,
}: {
  scenario: NorthScenarioOut;
  users: AdminUser[];
  onSaved: (next: NorthScenarioOut) => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState({
    name: scenario.name,
    department: scenario.department,
    directions: scenario.directions ?? [],
    assigned_user_id: scenario.assigned_user_id ?? null,
    course_tags: scenario.course_tags ?? [],
    steps: scenario.steps,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(
    () =>
      draft.name !== scenario.name ||
      draft.department !== scenario.department ||
      JSON.stringify(draft.directions) !== JSON.stringify(scenario.directions ?? []) ||
      draft.assigned_user_id !== (scenario.assigned_user_id ?? null) ||
      JSON.stringify(draft.course_tags) !== JSON.stringify(scenario.course_tags ?? []) ||
      JSON.stringify(draft.steps) !== JSON.stringify(scenario.steps),
    [draft, scenario],
  );

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.adminUpdateScenario(scenario.id, {
        name: draft.name,
        department: draft.department,
        directions: draft.directions,
        assigned_user_id: draft.assigned_user_id,
        course_tags: draft.course_tags,
        steps: draft.steps,
      });
      onSaved(next);
    } catch (e: any) {
      setError(e?.detail || e?.message || "—");
    } finally {
      setBusy(false);
    }
  };

  const updStep = (idx: number, patch: Partial<NorthScenarioStep>) => {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  };

  const addStep = () => {
    setDraft((d) => ({
      ...d,
      steps: [...d.steps, newEmptyStep(d.steps.length)],
    }));
  };

  const removeStep = (idx: number) => {
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== idx) }));
  };

  // ------ HTML5 drag-and-drop for reordering steps ----------------------
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const onDragStart = (idx: number) => () => setDragIdx(idx);
  const onDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
  };
  const onDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setDraft((d) => {
      const steps = [...d.steps];
      const [moved] = steps.splice(dragIdx, 1);
      steps.splice(idx, 0, moved);
      return { ...d, steps: steps.map((s, i) => ({ ...s, order: i })) };
    });
    setDragIdx(null);
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "0.5px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: 18,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="input"
          style={{ fontSize: 14, fontWeight: 600, flex: 1 }}
        />
        <button
          onClick={onTogglePublish}
          className={scenario.status === "published" ? "btn-secondary" : "btn-primary"}
          style={{ padding: "6px 12px", fontSize: 12 }}
        >
          {scenario.status === "published"
            ? t("north.admin.unpublish")
            : t("north.admin.publish")}
        </button>
        <button
          onClick={onClose}
          aria-label={t("common.cancel")}
          style={{
            width: 32,
            height: 32,
            background: "transparent",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
            {t("north.admin.directions")}
          </label>
          <div className="mt-1">
            <DirectionsPicker
              value={draft.directions}
              onChange={(next) => setDraft({ ...draft, directions: next })}
              placeholder={t("north.admin.departmentPh")}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
            {t("north.admin.assignedUser")}
          </label>
          <select
            value={draft.assigned_user_id ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, assigned_user_id: e.target.value ? Number(e.target.value) : null })
            }
            className="input mt-1"
          >
            <option value="">—</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} · {u.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
          {t("north.admin.tags")}
        </label>
        <input
          value={draft.course_tags.join(", ")}
          onChange={(e) =>
            setDraft({
              ...draft,
              course_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          className="input mt-1"
          placeholder="abs_basics, aml_compliance"
        />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div style={{ fontSize: 13, fontWeight: 600 }}>{t("north.admin.steps")}</div>
        <button
          onClick={addStep}
          className="btn-ghost"
          style={{ padding: "4px 10px", fontSize: 11 }}
        >
          <Plus size={11} /> {t("north.admin.addStep")}
        </button>
      </div>

      <ol className="mt-3 flex flex-col gap-3">
        {draft.steps.map((step, idx) => (
          <li
            key={step.id}
            draggable
            onDragStart={onDragStart(idx)}
            onDragOver={onDragOver(idx)}
            onDrop={onDrop(idx)}
            style={{
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: 12,
            }}
          >
            <div className="flex items-start gap-2">
              <span
                style={{
                  width: 20,
                  height: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-tertiary)",
                  cursor: "grab",
                  marginTop: 6,
                }}
              >
                <GripVertical size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <textarea
                  value={step.north_message}
                  onChange={(e) => updStep(idx, { north_message: e.target.value })}
                  className="input"
                  placeholder={t("north.admin.messagePh")}
                  rows={3}
                  style={{ fontSize: 13 }}
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Select
                    label={t("north.admin.inputType")}
                    value={step.input_type}
                    onChange={(v) =>
                      updStep(idx, { input_type: v as NorthInputType, choices: [] })
                    }
                    options={ALL_INPUT_TYPES}
                  />
                  <Select
                    label={t("north.admin.northState")}
                    value={step.north_state}
                    onChange={(v) => updStep(idx, { north_state: v as NorthState })}
                    options={ALL_STATES}
                  />
                  <Select
                    label={t("north.admin.onCompleteState")}
                    value={step.on_complete_state}
                    onChange={(v) => updStep(idx, { on_complete_state: v as NorthState })}
                    options={ALL_STATES}
                  />
                  <div>
                    <label style={fieldLabel}>{t("north.admin.contentRef")}</label>
                    <input
                      value={step.content_ref ?? ""}
                      onChange={(e) =>
                        updStep(idx, { content_ref: e.target.value || null })
                      }
                      className="input"
                      placeholder="course-slug"
                    />
                  </div>
                </div>
                {step.input_type === "choice" && (
                  <ChoicesEditor
                    choices={step.choices}
                    correctAnswer={step.correct_answer ?? ""}
                    onChange={(choices, correct_answer) =>
                      updStep(idx, { choices, correct_answer: correct_answer || null })
                    }
                  />
                )}
                {step.input_type === "text" && (
                  <div className="mt-2">
                    <label style={fieldLabel}>{t("north.admin.correctAnswer")}</label>
                    <input
                      value={step.correct_answer ?? ""}
                      onChange={(e) =>
                        updStep(idx, { correct_answer: e.target.value || null })
                      }
                      className="input"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => removeStep(idx)}
                aria-label={t("common.delete")}
                disabled={draft.steps.length <= 1}
                style={{
                  width: 28,
                  height: 28,
                  background: "transparent",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: draft.steps.length <= 1 ? "var(--text-muted)" : "var(--text-tertiary)",
                  cursor: draft.steps.length <= 1 ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {error && (
        <div
          className="mt-4"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(240,62,62,0.08)",
            border: "0.5px solid rgba(240,62,62,0.3)",
            color: "var(--danger)",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button onClick={onDelete} className="btn-danger" style={{ padding: "6px 12px", fontSize: 12 }}>
          <Trash2 size={12} /> {t("common.delete")}
        </button>
        <button
          onClick={save}
          disabled={busy || !dirty || !draft.name.trim()}
          className="btn-primary"
        >
          <Save size={14} /> {busy ? t("common.save_changes") : t("common.save_changes")}
        </button>
      </div>
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  marginBottom: 4,
  fontSize: 11,
  fontWeight: 500,
  color: "var(--text-secondary)",
};

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="input"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ScenarioBuildModal({
  onClose,
  onBuilt,
}: {
  onClose: () => void;
  onBuilt: (s: NorthScenarioOut) => void;
}) {
  const t = useT();
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [courseTags, setCourseTags] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Browser SpeechRecognition (Chromium-only) — we fall back to text input
  // wherever the API isn't available.
  const startVoice = () => {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setErr(t("nors.voiceUnsupported"));
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = navigator.language || "ru-RU";
    rec.onresult = (e: any) => {
      let buf = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        buf += e.results[i][0].transcript + " ";
      }
      setText((prev) => (prev ? prev + " " : "") + buf.trim());
    };
    rec.onend = () => setRecognizing(false);
    rec.onerror = () => setRecognizing(false);
    rec.start();
    setRecognizing(true);
  };

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const built = await api.adminBuildScenario({
        description: text.trim(),
        course_tags: courseTags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        name: name.trim() || undefined,
      });
      onBuilt(built);
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full"
        style={{
          maxWidth: 560,
          padding: 24,
          borderRadius: "var(--radius-xl)",
          background: "var(--bg-elevated)",
          border: "0.5px solid var(--border-emphasis)",
          color: "var(--text-primary)",
          display: "grid",
          gap: 12,
        }}
      >
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t("north.admin.build")}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.cancel")}
            style={{
              width: 30,
              height: 30,
              background: "transparent",
              border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder={t("north.admin.namePh")}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="input"
          placeholder={t("north.admin.buildPh")}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startVoice}
            disabled={recognizing}
            className={recognizing ? "btn-primary" : "btn-secondary"}
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            <Mic size={12} /> {t("north.admin.voice")}
          </button>
          <input
            value={courseTags}
            onChange={(e) => setCourseTags(e.target.value)}
            className="input"
            placeholder={t("north.admin.tags")}
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
              fontSize: 12,
            }}
          >
            {err}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !text.trim()}
            className="btn-primary"
          >
            <Sparkles size={14} /> {busy ? "…" : t("north.admin.build")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChoicesEditor({
  choices,
  correctAnswer,
  onChange,
}: {
  choices: string[];
  correctAnswer: string;
  onChange: (choices: string[], correct: string) => void;
}) {
  const t = useT();
  const addChoice = () => onChange([...choices, ""], correctAnswer);
  const removeChoice = (idx: number) =>
    onChange(
      choices.filter((_, i) => i !== idx),
      correctAnswer,
    );
  const updChoice = (idx: number, value: string) =>
    onChange(
      choices.map((c, i) => (i === idx ? value : c)),
      correctAnswer,
    );
  return (
    <div className="mt-2">
      <label style={fieldLabel}>{t("north.admin.choices")}</label>
      <div className="flex flex-col gap-1.5">
        {choices.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct-choice"
              checked={correctAnswer === c}
              onChange={() => onChange(choices, c)}
              style={{ accentColor: "var(--brand)", width: 14, height: 14 }}
            />
            <input
              value={c}
              onChange={(e) => updChoice(i, e.target.value)}
              className="input"
              style={{ flex: 1 }}
              placeholder={t("north.admin.choicePh")}
            />
            <button
              onClick={() => removeChoice(i)}
              aria-label={t("common.delete")}
              style={{
                width: 28,
                height: 28,
                background: "transparent",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-tertiary)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addChoice}
        className="btn-ghost mt-2"
        style={{ padding: "4px 10px", fontSize: 11 }}
      >
        <Plus size={11} /> {t("north.admin.addChoice")}
      </button>
    </div>
  );
}
