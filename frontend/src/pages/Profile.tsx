import { useState, useRef } from "react";
import { Camera, LogOut, Save, Trash2 } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../state/AuthContext";
import { useT } from "../state/LocaleContext";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!user) return null;

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const updated = await api.updateProfile({
        full_name: fullName !== user.full_name ? fullName : undefined,
        avatar_url: avatarUrl !== (user.avatar_url ?? "") ? avatarUrl : undefined,
      });
      setUser(updated);
      setToast(t("profile.saved"));
      setTimeout(() => setToast(null), 2500);
    } catch (e: any) {
      setErr(e?.detail || e?.message || "—");
    } finally {
      setBusy(false);
    }
  };

  const onPick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const up = await api.uploadFile(file);
      setAvatarUrl(up.url);
    } catch (e: any) {
      setErr(e?.detail || e?.message || t("translate.failed"));
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = () => setAvatarUrl("");

  const firstInitial = fullName.trim().slice(0, 1).toUpperCase() || "?";
  const dirty = fullName !== user.full_name || avatarUrl !== (user.avatar_url ?? "");

  const fieldLabel: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: 6,
  };

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 640 }}>
      <header>
        <h1 className="hero-text">{t("profile.title")}</h1>
      </header>

      {/* Avatar */}
      <div
        className="flex items-center gap-5"
        style={{
          padding: 20,
          background: "var(--bg-card)",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--brand)",
              color: "#FFFFFF",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {firstInitial}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={onPick}
            disabled={uploading}
          >
            <Camera size={14} /> {uploading ? "…" : t("profile.uploadAvatar")}
          </button>
          {avatarUrl && (
            <button
              type="button"
              className="btn-ghost"
              onClick={removeAvatar}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              <Trash2 size={12} /> {t("profile.removeAvatar")}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Name */}
      <div
        style={{
          padding: 20,
          background: "var(--bg-card)",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <label style={fieldLabel}>{t("profile.editName")}</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label style={fieldLabel}>{t("profile.role")}</label>
            <div
              style={{
                padding: "10px 14px",
                background: "var(--bg-input)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              {t(`position.${user.position}`) || user.position} · {t(`role.${user.role}`)}
            </div>
          </div>
          <div>
            <label style={fieldLabel}>{t("profile.jobTitle")}</label>
            <div
              style={{
                padding: "10px 14px",
                background: "var(--bg-input)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              {user.job_title || user.department || "—"}
            </div>
          </div>
        </div>
        {user.directions && user.directions.length > 0 && (
          <div className="mt-5">
            <label style={fieldLabel}>{t("profile.directions")}</label>
            <div className="flex flex-wrap gap-2">
              {user.directions.map((d) => (
                <span
                  key={d}
                  style={{
                    padding: "4px 10px",
                    background: "var(--bg-card)",
                    border: "0.5px solid var(--border)",
                    borderRadius: 99,
                    fontSize: 12,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}
        <p
          className="mt-2"
          style={{ fontSize: 11, color: "var(--text-tertiary)" }}
        >
          {t("profile.adminOnly")}
        </p>
      </div>

      {err && (
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
          {err}
        </div>
      )}
      {toast && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(62,207,142,0.10)",
            border: "0.5px solid rgba(62,207,142,0.3)",
            color: "var(--success)",
            fontSize: 13,
          }}
        >
          {toast}
        </div>
      )}

      <div className="flex justify-between gap-3">
        <button
          onClick={logout}
          className="btn-ghost"
          style={{
            color: "var(--danger)",
            border: "0.5px solid rgba(240,62,62,0.3)",
            background: "rgba(240,62,62,0.05)",
          }}
        >
          <LogOut size={14} /> {t("profile.logout")}
        </button>
        <button
          onClick={save}
          disabled={busy || !dirty || !fullName.trim()}
          className="btn-primary"
        >
          <Save size={14} /> {t("common.save_changes")}
        </button>
      </div>
    </div>
  );
}
