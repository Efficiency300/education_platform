import { useRef, useState } from "react";
import { FileText, Film, Image as ImageIcon, Paperclip, Presentation, Trash2 } from "lucide-react";
import { api, LessonAttachment } from "../api";
import { useT } from "../state/LocaleContext";

/** Classify a file/url so we know which preview/icon to show. */
export function classifyAttachment(a: LessonAttachment): string {
  if (a.kind) return a.kind;
  const url = (a.url || "").toLowerCase();
  const ct = (a.content_type || "").toLowerCase();
  if (ct.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(url)) return "video";
  if (ct.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(url)) return "image";
  if (
    ct.includes("presentation") ||
    ct.includes("powerpoint") ||
    /\.(pptx?|key)$/.test(url)
  )
    return "presentation";
  return "document";
}

function iconFor(kind: string, size = 14) {
  switch (kind) {
    case "video":
      return <Film size={size} />;
    case "image":
      return <ImageIcon size={size} />;
    case "presentation":
      return <Presentation size={size} />;
    default:
      return <FileText size={size} />;
  }
}

/** Read-only viewer used on the user-facing lesson page. */
export function LessonAttachmentsView({ items }: { items: LessonAttachment[] }) {
  const t = useT();
  if (!items?.length) return null;
  return (
    <div className="mt-6">
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          fontWeight: 500,
          marginBottom: 8,
        }}
      >
        {t("lesson.attachments")}
      </div>
      <div className="flex flex-col gap-3">
        {items.map((a) => {
          const kind = classifyAttachment(a);
          if (kind === "video") {
            return (
              <div
                key={a.url}
                style={{
                  padding: 12,
                  background: "var(--bg-card)",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="mb-2 flex items-center gap-2" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  <Film size={13} /> {a.filename}
                </div>
                <video
                  controls
                  src={a.url}
                  style={{ width: "100%", borderRadius: 8, background: "#000" }}
                />
              </div>
            );
          }
          if (kind === "image") {
            return (
              <a
                key={a.url}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  padding: 12,
                  background: "var(--bg-card)",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <img src={a.url} alt={a.filename} style={{ width: "100%", borderRadius: 8 }} />
              </a>
            );
          }
          return (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3"
              style={{
                padding: "10px 14px",
                background: "var(--bg-card)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                textDecoration: "none",
              }}
            >
              <span
                className="flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--brand)",
                  color: "#FFFFFF",
                }}
              >
                {iconFor(kind, 14)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                  {a.filename}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  {a.content_type}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/** Editor used inside the admin course editor for one lesson. */
export function LessonAttachmentsEditor({
  items,
  onChange,
}: {
  items: LessonAttachment[];
  onChange: (next: LessonAttachment[]) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const up = await api.uploadFile(file);
      onChange([
        ...items,
        {
          url: up.url,
          filename: up.filename,
          content_type: up.content_type,
        },
      ]);
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => onChange(items.filter((_, j) => j !== idx));

  return (
    <div className="mt-2">
      <div
        className="flex items-center justify-between"
        style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}
      >
        <span>{t("lesson.attachments")}</span>
        <button
          type="button"
          onClick={pick}
          className="btn-ghost"
          disabled={uploading}
          style={{ padding: "4px 10px", fontSize: 11 }}
        >
          <Paperclip size={11} /> {uploading ? "…" : t("lesson.attachFile")}
        </button>
        <input
          ref={inputRef}
          type="file"
          onChange={onFile}
          style={{ display: "none" }}
          // No accept= filter — admins explicitly want any file type.
        />
      </div>
      {items.length === 0 ? (
        <div
          style={{
            padding: 8,
            border: "0.5px dashed var(--border-emphasis)",
            borderRadius: "var(--radius-sm)",
            fontSize: 11,
            color: "var(--text-tertiary)",
            textAlign: "center",
          }}
        >
          —
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((a, i) => {
            const kind = classifyAttachment(a);
            return (
              <li
                key={a.url + i}
                className="flex items-center gap-2"
                style={{
                  padding: "6px 10px",
                  background: "var(--bg-elevated)",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--brand)",
                    color: "#FFFFFF",
                  }}
                >
                  {iconFor(kind, 11)}
                </span>
                <span
                  className="flex-1 truncate"
                  style={{ fontSize: 12, color: "var(--text-primary)" }}
                  title={a.filename}
                >
                  {a.filename}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={t("lesson.attachmentRemove")}
                  style={{
                    width: 24,
                    height: 24,
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
                  <Trash2 size={11} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {err && (
        <div
          style={{
            marginTop: 6,
            padding: "6px 10px",
            background: "rgba(240,62,62,0.08)",
            border: "0.5px solid rgba(240,62,62,0.3)",
            color: "var(--danger)",
            fontSize: 11,
            borderRadius: "var(--radius-sm)",
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}
