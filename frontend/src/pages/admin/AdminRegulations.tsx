import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Upload, Trash2, RefreshCw } from "lucide-react";
import { api, AdminRegulation } from "../../api";
import GlassCard from "../../components/GlassCard";

export default function AdminRegulations() {
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
      setErr(e?.detail || e?.message || "Не удалось загрузить");
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
      setErr(e?.detail || e?.message || "Не удалось загрузить");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDelete = async (name: string) => {
    if (!confirm(`Удалить регламент ${name}?`)) return;
    try {
      const res = await api.adminDeleteRegulation(name);
      setRagChunks(res.rag_chunks);
      await load();
    } catch (e: any) {
      setErr(e?.detail || e?.message || "Не удалось удалить");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-navy-900/50 dark:text-white/50">
          <FileText size={14} className="text-gold-500" /> RAG-контент
        </div>
        <h1 className="hero-text mt-2">Регламенты</h1>
        <p className="mt-2 max-w-2xl text-base text-navy-900/60 dark:text-white/60">
          Markdown-файлы регламентов. После загрузки автоматически переиндексируется
          BM25, AI-наставник начнёт ссылаться на новый контент.
        </p>
      </header>

      <GlassCard className="!p-7">
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-navy-900/15 bg-white/30 p-8 text-center dark:border-white/15 dark:bg-white/[0.02]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-gold-500 dark:from-gold-500 dark:to-gold-700 dark:text-navy-900">
            <Upload size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Загрузить регламент</h3>
            <p className="text-sm text-navy-900/60 dark:text-white/60">
              Принимаются .md файлы до 1 МБ
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".md,text/markdown"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-gold">
            {busy ? "Загрузка…" : <><Upload size={14} /> Выбрать файл</>}
          </button>
        </div>
        {err && (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
            {err}
          </div>
        )}
        {ragChunks !== null && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-navy-900/60 dark:text-white/60">
            <RefreshCw size={12} /> RAG-индекс: <strong>{ragChunks}</strong> фрагментов
          </div>
        )}
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_120px_140px_60px] items-center gap-4 border-b border-navy-900/8 bg-navy-900/[0.02] px-6 py-3 text-[10px] uppercase tracking-widest text-navy-900/50 dark:border-white/8 dark:bg-white/[0.02] dark:text-white/50">
          <div>Файл</div>
          <div>Размер</div>
          <div>Обновлён</div>
          <div className="text-right"></div>
        </div>
        <div className="divide-y divide-navy-900/8 dark:divide-white/8">
          {items.map((r) => (
            <div key={r.filename} className="grid grid-cols-[1.5fr_120px_140px_60px] items-center gap-4 px-6 py-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-gold-500" />
                <span className="font-mono text-sm">{r.filename}</span>
              </div>
              <div className="text-xs tabular-nums text-navy-900/70 dark:text-white/70">
                {(r.size_bytes / 1024).toFixed(1)} KB
              </div>
              <div className="text-xs text-navy-900/50 dark:text-white/50">
                {new Date(r.modified_at).toLocaleDateString("ru-RU")}
              </div>
              <div className="text-right">
                <button
                  onClick={() => onDelete(r.filename)}
                  className="rounded-full p-2 text-rose-600 transition hover:bg-rose-500/10"
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-10 text-center text-sm text-navy-900/50 dark:text-white/50">
              Регламенты не загружены.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
