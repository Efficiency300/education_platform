import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Filter, FileText, Pencil, Trash2, Upload, X } from "lucide-react";
import { api, AdminRegulation } from "../../api";
import GlassCard from "../../components/GlassCard";
import { useT } from "../../state/LocaleContext";

export default function AdminRegulations() {
  const t = useT();
  const [items, setItems] = useState<AdminRegulation[]>([]);
  const [directions, setDirections] = useState<string[]>([]);
  const [filterDir, setFilterDir] = useState<string>("");
  const [uploadDir, setUploadDir] = useState<string>("");
  const [ragChunks, setRagChunks] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [regs, dirs, stats] = await Promise.all([
        api.adminRegulations(filterDir || undefined),
        api.adminRegulationDirections(),
        api.adminStats(),
      ]);
      setItems(regs);
      setDirections(dirs.directions);
      setRagChunks(stats.rag_chunks);
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    }
  }, [filterDir]);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await api.adminUploadRegulation(file, uploadDir.trim());
      setRagChunks(res.rag_chunks);
      await load();
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDelete = async (name: string) => {
    if (!confirm(t("admin.regs.confirmDelete", { name }))) return;
    try {
      const res = await api.adminDeleteRegulation(name);
      setRagChunks(res.rag_chunks);
      await load();
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    }
  };

  const setDirection = async (filename: string, direction: string) => {
    try {
      await api.adminPatchRegulationDirection(filename, direction);
      await load();
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    }
  };

  // The filter dropdown shows whatever has *ever* been indexed, plus the
  // current selection so we don't clear it on a refresh.
  const allDirections = useMemo(() => {
    const set = new Set<string>(directions);
    items.forEach((i) => i.direction && set.add(i.direction));
    return [...set].sort();
  }, [directions, items]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="hero-text">{t("admin.regs.title")}</h1>
        <p className="mt-2 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
          {t("admin.regs.subtitle")}
        </p>
      </header>

      {/* Upload card */}
      <GlassCard className="!p-7">
        <div
          className="flex flex-col items-center justify-center gap-4 text-center"
          style={{
            padding: 28,
            border: "0.5px dashed var(--border-emphasis)",
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-elevated)",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--radius-md)",
              background: "var(--brand)",
              color: "#FFFFFF",
            }}
          >
            <Upload size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              {t("admin.regs.uploadTitle")}
            </h3>
            <p className="mt-1" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {t("admin.regs.uploadHint")}
            </p>
          </div>

          {/* Direction selector for the upload */}
          <div className="w-full" style={{ maxWidth: 360 }}>
            <label
              className="block text-left"
              style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}
            >
              {t("admin.regs.direction")}
            </label>
            <input
              list="kb-directions"
              value={uploadDir}
              onChange={(e) => setUploadDir(e.target.value)}
              placeholder={t("admin.regs.directionPh")}
              className="input"
            />
            <datalist id="kb-directions">
              {allDirections.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-primary">
            {busy ? "…" : (<><Upload size={14} /> {t("common.chooseFile")}</>)}
          </button>
        </div>
        {err && (
          <div
            className="mt-4"
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
        {ragChunks !== null && (
          <div className="mt-4 text-center" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            {t("admin.regs.indexLine", { n: ragChunks })}
          </div>
        )}
      </GlassCard>

      {/* Direction filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5"
          style={{ fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          <Filter size={11} /> {t("admin.regs.filterDirection")}
        </span>
        <button
          onClick={() => setFilterDir("")}
          className={`lang-btn ${filterDir === "" ? "lang-btn-active" : ""}`}
          style={{ flex: "0 0 auto" }}
        >
          {t("admin.regs.allDirections")}
        </button>
        {allDirections.map((d) => (
          <button
            key={d}
            onClick={() => setFilterDir(d)}
            className={`lang-btn ${filterDir === d ? "lang-btn-active" : ""}`}
            style={{ flex: "0 0 auto" }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* File table */}
      <GlassCard className="!p-0 overflow-hidden">
        <div
          className="grid grid-cols-[1.4fr_140px_100px_120px_60px] items-center gap-4 px-6 py-3"
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
          <div>{t("admin.regs.colFile")}</div>
          <div>{t("admin.regs.colDirection")}</div>
          <div>{t("admin.regs.colSize")}</div>
          <div>{t("admin.regs.colUpdated")}</div>
          <div className="text-right"></div>
        </div>
        <div>
          {items.map((r, i) => (
            <FileRow
              key={r.filename}
              row={r}
              first={i === 0}
              allDirections={allDirections}
              onSetDirection={(d) => setDirection(r.filename, d)}
              onDelete={() => onDelete(r.filename)}
            />
          ))}
          {items.length === 0 && (
            <div className="p-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              {t("admin.regs.empty")}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function FileRow({
  row,
  first,
  allDirections,
  onSetDirection,
  onDelete,
}: {
  row: AdminRegulation;
  first: boolean;
  allDirections: string[];
  onSetDirection: (direction: string) => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.direction ?? "");

  return (
    <div
      className="grid grid-cols-[1.4fr_140px_100px_120px_60px] items-center gap-4 px-6 py-3"
      style={{
        borderTop: first ? "none" : "0.5px solid var(--border)",
        color: "var(--text-primary)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={14} style={{ color: "var(--brand)", flexShrink: 0 }} />
        <div className="min-w-0">
          <div className="truncate font-mono" style={{ fontSize: 13 }}>{row.filename}</div>
          {row.title && row.title !== row.filename && (
            <div className="truncate" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
              {row.title}
            </div>
          )}
        </div>
      </div>
      <div>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              list={`row-dirs-${row.filename}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className="input"
              style={{ padding: "4px 8px", fontSize: 12 }}
            />
            <datalist id={`row-dirs-${row.filename}`}>
              {allDirections.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <button
              onClick={() => {
                onSetDirection(draft.trim());
                setEditing(false);
              }}
              aria-label={t("common.save_changes")}
              style={{
                width: 24,
                height: 24,
                background: "var(--brand)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => {
                setDraft(row.direction ?? "");
                setEditing(false);
              }}
              aria-label={t("common.cancel")}
              style={{
                width: 24,
                height: 24,
                background: "transparent",
                color: "var(--text-tertiary)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1"
            style={{
              padding: "3px 10px",
              borderRadius: 99,
              background: row.direction ? "var(--brand-subtle)" : "var(--bg-card)",
              border: row.direction
                ? "0.5px solid var(--border-brand)"
                : "0.5px dashed var(--border-emphasis)",
              color: row.direction ? "var(--brand)" : "var(--text-tertiary)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Pencil size={10} />
            {row.direction || t("admin.regs.unassigned")}
          </button>
        )}
      </div>
      <div className="tabular-nums" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        {(row.size_bytes / 1024).toFixed(1)} KB
      </div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
        {new Date(row.modified_at).toLocaleDateString("ru-RU")}
        {row.vector_count !== undefined && row.vector_count > 0 && (
          <div style={{ fontSize: 10, color: "var(--brand)" }}>
            {t("admin.regs.indexed", { n: row.vector_count })}
          </div>
        )}
      </div>
      <div className="text-right">
        <button
          onClick={onDelete}
          aria-label={t("common.delete")}
          title={t("common.delete")}
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
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
