import { useEffect, useState } from "react";
import { api, User, Scenario, SimSession, ScenarioStep, AnswerResponse } from "../api";

export default function Simulator({ user }: { user: User }) {
  const [scenarios, setScenarios] = useState<{ id: string; title: string; description: string }[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [session, setSession] = useState<SimSession | null>(null);
  const [currentStep, setCurrentStep] = useState<ScenarioStep | null>(null);
  const [lastResult, setLastResult] = useState<(AnswerResponse & { optionId: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.scenarios().then(setScenarios).catch(console.error);
  }, []);

  const start = async (scenarioId: string) => {
    setBusy(true);
    try {
      const sc = await api.scenario(scenarioId);
      const sess = await api.startSession(user.id, scenarioId);
      setScenario(sc);
      setSession(sess);
      setCurrentStep(sc.steps[0]);
      setLastResult(null);
    } finally {
      setBusy(false);
    }
  };

  const answer = async (optionId: string) => {
    if (!session || !currentStep) return;
    setBusy(true);
    try {
      const res = await api.answer(session.id, currentStep.id, optionId);
      setLastResult({ ...res, optionId });
      setSession((s) => (s ? { ...s, score: res.total_score, finished: res.finished } : s));
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (!scenario || !lastResult) return;
    if (lastResult.next_step_id) {
      const step = scenario.steps.find((s) => s.id === lastResult.next_step_id);
      setCurrentStep(step ?? null);
      setLastResult(null);
    }
  };

  const restart = () => {
    setScenario(null);
    setSession(null);
    setCurrentStep(null);
    setLastResult(null);
  };

  // экран выбора сценария
  if (!scenario) {
    return (
      <>
        <div className="page-header">
          <div>
            <h2>Симулятор АБС</h2>
            <p>Безопасная среда с виртуальными клиентами и тестовыми данными. Никаких реальных данных банка.</p>
          </div>
        </div>
        <div className="grid grid-3">
          {scenarios.map((s) => (
            <div key={s.id} className="card">
              <h3 style={{ marginTop: 0 }}>{s.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>{s.description}</p>
              <button className="btn" onClick={() => start(s.id)} disabled={busy}>
                Начать сценарий
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  // финал — показываем после того, как пользователь нажал "Посмотреть итог"
  if (session?.finished && !lastResult) {
    const maxPossible = scenario.steps.reduce(
      (acc, st) => acc + Math.max(...st.options.map((o) => o.points)),
      0
    );
    const pct = Math.round((session.score / maxPossible) * 100);
    return (
      <>
        <div className="page-header">
          <div>
            <h2>Сценарий завершён</h2>
            <p>{scenario.title}</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div className="stat">
            <div className="label">Итоговый результат</div>
            <div className="value" style={{ color: pct >= 80 ? "var(--success)" : "var(--brand)" }}>
              {session.score} / {maxPossible}
            </div>
            <div className="hint">{pct}% правильных решений</div>
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn" onClick={restart}>Выбрать другой сценарий</button>
            <button className="btn btn-ghost" onClick={() => start(scenario.id)}>Пройти ещё раз</button>
          </div>
        </div>
      </>
    );
  }

  if (!currentStep) return <div className="empty">Загрузка…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>{scenario.title}</h2>
          <p>Шаг {scenario.steps.findIndex((s) => s.id === currentStep.id) + 1} из {scenario.steps.length}</p>
        </div>
        <span className="score-pill">{session?.score ?? 0} баллов</span>
      </div>

      <div className="sim-layout">
        <div>
          <div className="customer-card">
            <div className="avatar">{scenario.customer.avatar}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{scenario.customer.name}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Документ: {scenario.customer.document} · Цель: {scenario.customer.purpose}
              </div>
            </div>
          </div>

          <div className="sim-screen">
            <div className="titlebar">АБС Turonbank · Окно оператора · DUMMY DATA</div>
            <div className="field"><span>Клиент</span><span>{scenario.customer.name}</span></div>
            <div className="field"><span>Документ</span><span>{scenario.customer.document}</span></div>
            <div className="field"><span>Цель обращения</span><span>{scenario.customer.purpose}</span></div>
            <div className="field"><span>Текущий шаг</span><span>{currentStep.id}</span></div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ marginTop: 0 }}>{currentStep.prompt}</h3>
            <div className="option-list">
              {currentStep.options.map((opt) => {
                const isChosen = lastResult?.optionId === opt.id;
                const cls = isChosen ? (lastResult!.correct ? "correct" : "wrong") : "";
                return (
                  <button
                    key={opt.id}
                    className={`option-btn ${cls}`}
                    onClick={() => answer(opt.id)}
                    disabled={busy || !!lastResult}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
            {lastResult && (
              <>
                <div className={`feedback ${lastResult.correct ? "correct" : "wrong"}`}>
                  {lastResult.correct ? "✓ " : "✗ "}
                  {lastResult.feedback}
                  {lastResult.points_awarded > 0 && (
                    <strong> · +{lastResult.points_awarded} баллов</strong>
                  )}
                </div>
                <div style={{ marginTop: 12, textAlign: "right" }}>
                  {lastResult.next_step_id ? (
                    <button className="btn" onClick={next}>Следующий шаг →</button>
                  ) : (
                    <button className="btn" onClick={() => setLastResult(null)}>
                      Посмотреть итог →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="scoreboard">
          <div className="card">
            <h4 style={{ marginTop: 0 }}>Прогресс сценария</h4>
            <div className="progress-bar">
              <div
                style={{
                  width: `${
                    ((scenario.steps.findIndex((s) => s.id === currentStep.id) + (lastResult ? 1 : 0)) /
                      scenario.steps.length) *
                    100
                  }%`,
                }}
              />
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
              Сценарий построен на симулированных данных. Никакой связи с реальной банковской системой нет.
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
