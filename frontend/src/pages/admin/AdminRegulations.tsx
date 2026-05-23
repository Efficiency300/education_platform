import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Upload, Trash2 } from "lucide-react";
import { api, AdminRegulation } from "../../api";
import GlassCard from "../../components/GlassCard";
import { useT } from "../../state/LocaleContext";

export default function AdminRegulations() {
  const t = useT();
  const [items, setItems] = useState<AdminRegulation[]>([]);
  const [ragChunks, setRagChunks] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [regs, stats] = await Promise.all([api.adminRegulations(), api.adminStats()]);
      setItems(regs);
      setRagChunks(stats.rag_chunks);
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await api.adminUploadRegulation(file);
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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="hero-text">{t("admin.regs.title")}</h1>
        <p className="mt-2 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
          {t("admin.regs.subtitle")}
        </p>
      </header>

      <GlassCard className="!p-7">
        <div
          className="flex flex-col items-center justify-center gap-4 text-center"
          style={{
            padding: 32,
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
          <div
            className="mt-4 text-center"
            style={{ fontSize: 11, color: "var(--text-tertiary)" }}
          >
            {t("admin.regs.indexLine", { n: ragChunks })}
          </div>
        )}
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div
          className="grid grid-cols-[1.5fr_120px_140px_60px] items-center gap-4 px-6 py-3"
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
          <div>{t("admin.regs.colSize")}</div>
          <div>{t("admin.regs.colUpdated")}</div>
          <div className="text-right"></div>
        </div>
        <div>
          {items.map((r, i) => (
            <div
              key={r.filename}
              className="grid grid-cols-[1.5fr_120px_140px_60px] items-center gap-4 px-6 py-3"
              style={{
                borderTop: i === 0 ? "none" : "0.5px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} style={{ color: "var(--brand)", flexShrink: 0 }} />
                <span className="truncate font-mono" style={{ fontSize: 13 }}>{r.filename}</span>
              </div>
              <div className="tabular-nums" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {(r.size_bytes / 1024).toFixed(1)} KB
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                {new Date(r.modified_at).toLocaleDateString("ru-RU")}
              </div>
              <div className="text-right">
                <button
                  onClick={() => onDelete(r.filename)}
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
