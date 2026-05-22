import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, User, ProgressSummary, ScenarioSummary } from "../api";

export default function Dashboard({ user }: { user: User }) {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);

  useEffect(() => {
    api.progress(user.id).then(setProgress).catch(console.error);
    api.scenarios().then(setScenarios).catch(console.error);
  }, [user.id]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Добро пожаловать, {user.full_name.split(" ")[0]}!</h2>
          <p>Программа «{user.program || "—"}» · отдел: {user.department || "—"}</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat">
          <div className="label">Общий прогресс</div>
          <div className="value">{progress?.overall_completion_pct ?? 0}%</div>
          <div className="hint">по всем учебным модулям</div>
        </div>
        <div className="card stat">
          <div className="label">Очки геймификации</div>
          <div className="value">{progress?.total_points ?? 0}</div>
          <div className="hint">за все симуляторы</div>
        </div>
        <div className="card stat">
          <div className="label">Пройдено модулей</div>
          <div className="value">{progress?.modules.length ?? 0}</div>
          <div className="hint">из {scenarios.length} доступных</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Доступные симуляторы</h3>
          {scenarios.length === 0 && <div className="empty">Сценарии не загружены</div>}
          {scenarios.map((s) => (
            <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 600 }}>{s.title}</div>
              <div style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 10px" }}>
                {s.description}
              </div>
              <Link to="/simulator" className="btn btn-small">Начать</Link>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Быстрые действия</h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Задайте вопрос AI-наставнику или продолжите обучение.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/chat" className="btn">Спросить AI-наставника</Link>
            <Link to="/progress" className="btn btn-ghost">Посмотреть прогресс</Link>
          </div>
        </div>
      </div>
    </>
  );
}
