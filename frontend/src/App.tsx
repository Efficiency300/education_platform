import { useEffect, useState } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { api, User, HealthInfo } from "./api";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Simulator from "./pages/Simulator";
import ProgressPage from "./pages/Progress";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const location = useLocation();

  useEffect(() => {
    api.listUsers().then((users) => setUser(users[0] ?? null)).catch(console.error);
    api.health().then(setHealth).catch(console.error);
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong flex items-center gap-3 px-8 py-6"
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/20 border-t-gold-500" />
          <span className="text-sm font-medium">Загрузка профиля…</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar user={user} health={health} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-12 md:pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 250, damping: 26 }}
              className="mx-auto w-full max-w-6xl"
            >
              <Routes location={location}>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/chat" element={<Chat user={user} />} />
                <Route path="/simulator" element={<Simulator user={user} />} />
                <Route path="/progress" element={<ProgressPage user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
