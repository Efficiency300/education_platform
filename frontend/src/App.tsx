import { useEffect, useState } from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { api, User } from "./api";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Simulator from "./pages/Simulator";
import ProgressPage from "./pages/Progress";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<{ llm_mode: string; ispring_mode: string; rag_chunks: number } | null>(null);

  useEffect(() => {
    api.listUsers().then((users) => setUser(users[0] ?? null)).catch(console.error);
    api.health().then(setHealth).catch(console.error);
  }, []);

  if (!user) {
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        <div className="spinner" /> Загрузка пользователя…
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>
          AI-Mentor
          <small>Turonbank · onboarding</small>
        </h1>
        <nav>
          <NavLink to="/" end>Главная</NavLink>
          <NavLink to="/chat">AI-ассистент</NavLink>
          <NavLink to="/simulator">Симулятор АБС</NavLink>
          <NavLink to="/progress">Мой прогресс</NavLink>
        </nav>
        <div className="sidebar-user">
          <div>{user.full_name}</div>
          <div style={{ opacity: 0.7 }}>{user.role} · {user.department}</div>
          {health && (
            <div style={{ marginTop: 8, fontSize: 11 }}>
              LLM: {health.llm_mode} · iSpring: {health.ispring_mode} · RAG: {health.rag_chunks}
            </div>
          )}
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/chat" element={<Chat user={user} />} />
          <Route path="/simulator" element={<Simulator user={user} />} />
          <Route path="/progress" element={<ProgressPage user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
