import { useEffect, useState } from "react";
import { api, User, ProgressSummary } from "../api";

export default function ProgressPage({ user }: { user: User }) {
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const reload = () => api.progress(user.id).then(setData).catch(console.error);

  useEffect(() => { reload(); }, [user.id]);

  const sync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await api.syncIspring(user.id);
      setSyncMsg(`Результаты отправлены в iSpring (режим: ${res.mode}).`);
    } catch (e: any) {
      setSyncMsg(`Ошибка: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!data) return <div className="empty"><div className="spinner" /> Загрузка…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Мой прогресс</h2>
          <p>Сводка по всем учебным модулям и баллам геймификации.</p>
        </div>
        <button className="btn" onClick={sync} disabled={syncing}>
          {syncing ? "Отправка…" : "Отправить в iSpring"}
        </button>
      </div>

      {syncMsg && (
        <div className="card" style={{ marginBottom: 16, background: "#ecfdf5", borderColor: "#a7f3d0" }}>
          {syncMsg}
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat">
          <div className="label">Общий прогресс</div>
          <div className="value">{data.overall_completion_pct}%</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div style={{ width: `${data.overall_completion_pct}%` }} />
          </div>
        </div>
        <div className="card stat">
          <div className="label">Всего баллов</div>
          <div className="value">{data.total_points}</div>
        </div>
        <div className="card stat">
          <div className="label">Модулей пройдено</div>
          <div className="value">{data.modules.length}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Модули</h3>
        {data.modules.length === 0 && (
          <div className="empty">Вы ещё не проходили ни одного модуля. Начните с симулятора.</div>
        )}
        {data.modules.map((m) => (
          <div className="module-row" key={m.id}>
            <div>
              <div className="module-name">{m.module}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Обновлено: {new Date(m.updated_at).toLocaleString("ru-RU")}
              </div>
            </div>
            <div className="progress-bar"><div style={{ width: `${m.completion_pct}%` }} /></div>
            <div>{m.completion_pct}%</div>
            <span className="badge">{m.points} б.</span>
          </div>
        ))}
      </div>
    </>
  );
}
