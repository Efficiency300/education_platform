import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { DirectionItem, api } from "../api";

/**
 * Multi-select picker over the admin-managed list of directions. Loads the
 * options once per mount; the surrounding form owns the selected value.
 *
 * Wherever the codebase used to ask for a free-form "direction" string we now
 * render this picker — the admin curates the list in Admin → Settings, and
 * everything else picks from it.
 */
export default function DirectionsPicker({
  value,
  onChange,
  placeholder = "—",
  disabled = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [options, setOptions] = useState<DirectionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    api
      .listDirections()
      .then((d) => {
        if (alive) setOptions(d);
      })
      .catch(() => {
        /* silent — empty list still renders */
      })
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, []);

  const optionByName = useMemo(() => {
    const m: Record<string, DirectionItem> = {};
    for (const d of options) m[d.name] = d;
    return m;
  }, [options]);

  const toggle = (name: string) => {
    if (value.includes(name)) onChange(value.filter((v) => v !== name));
    else onChange([...value, name]);
  };

  const remove = (name: string) => onChange(value.filter((v) => v !== name));

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setOpen((v) => !v)}
        className="input"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <span
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            color: value.length ? "var(--text-primary)" : "var(--text-tertiary)",
            fontSize: 13,
          }}
        >
          {value.length === 0
            ? busy
              ? "…"
              : placeholder
            : value.map((v) => (
                <span
                  key={v}
                  style={{
                    background: "var(--bg-card)",
                    border: "0.5px solid var(--border)",
                    borderRadius: 99,
                    padding: "2px 8px",
                    fontSize: 11,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {v}
                  <X
                    size={10}
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(v);
                    }}
                  />
                </span>
              ))}
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 30,
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border-emphasis)",
            borderRadius: "var(--radius-md)",
            maxHeight: 220,
            overflowY: "auto",
            padding: 4,
            boxShadow: "0 10px 32px rgba(0,0,0,0.18)",
          }}
        >
          {options.length === 0 && (
            <div style={{ padding: 10, fontSize: 12, color: "var(--text-tertiary)" }}>
              Список направлений пуст. Создайте их в админ-настройках.
            </div>
          )}
          {options.map((o) => {
            const checked = value.includes(o.name);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.name)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: checked ? "var(--bg-hover)" : "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: "1px solid var(--border-emphasis)",
                    background: checked ? "var(--brand)" : "transparent",
                    color: "white",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {checked && <Check size={10} />}
                </span>
                <span>{o.name}</span>
                {o.description && (
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>
                    {o.description.slice(0, 40)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 25 }}
        />
      )}
      {/* Suppress unused import warning */}
      <span style={{ display: "none" }}>{Object.keys(optionByName).length}</span>
    </div>
  );
}
