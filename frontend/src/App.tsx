import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import RoleSidebar from "./components/RoleSidebar";
import MobileNav from "./components/MobileNav";
import Toaster from "./components/Toaster";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Simulator from "./pages/Simulator";
import ProgressPage from "./pages/Progress";
import CoursesPage from "./pages/Courses";
import CourseDetailPage from "./pages/CourseDetail";
import LoginPage, { defaultRoute } from "./pages/Login";
import RegisterPage from "./pages/Register";
import HRDashboard from "./pages/hr/HRDashboard";
import HRTeam from "./pages/hr/HRTeam";
import HRUserProfilePage from "./pages/hr/HRUserProfile";
import HRLeaderboard from "./pages/hr/HRLeaderboard";
import HRAnalyticsPage from "./pages/hr/HRAnalytics";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminRegulations from "./pages/admin/AdminRegulations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import { useAuth } from "./state/AuthContext";
import { Role } from "./api";

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong flex items-center gap-3 px-8 py-6"
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/20 border-t-gold-500" />
          <span className="text-sm font-medium">Загрузка…</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" state={{ from: location.pathname }} replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <RoleSidebar />
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
                {/* auth pages — если уже залогинен, редирект на дефолт по роли */}
                <Route path="/login" element={<Navigate to={defaultRoute(user.role)} replace />} />
                <Route path="/register" element={<Navigate to={defaultRoute(user.role)} replace />} />

                {/* User */}
                <Route path="/" element={<RoleGuard allow={["user"]} fallback={defaultRoute(user.role)}><Dashboard /></RoleGuard>} />
                <Route path="/chat" element={<RoleGuard allow={["user"]} fallback={defaultRoute(user.role)}><Chat /></RoleGuard>} />
                <Route path="/courses" element={<RoleGuard allow={["user"]} fallback={defaultRoute(user.role)}><CoursesPage /></RoleGuard>} />
                <Route path="/courses/:slug" element={<RoleGuard allow={["user"]} fallback={defaultRoute(user.role)}><CourseDetailPage /></RoleGuard>} />
                <Route path="/simulator" element={<RoleGuard allow={["user"]} fallback={defaultRoute(user.role)}><Simulator /></RoleGuard>} />
                <Route path="/simulator/:scenarioId" element={<RoleGuard allow={["user"]} fallback={defaultRoute(user.role)}><Simulator /></RoleGuard>} />
                <Route path="/progress" element={<RoleGuard allow={["user"]} fallback={defaultRoute(user.role)}><ProgressPage /></RoleGuard>} />

                {/* HR */}
                <Route path="/hr" element={<RoleGuard allow={["hr", "admin"]} fallback={defaultRoute(user.role)}><HRDashboard /></RoleGuard>} />
                <Route path="/hr/team" element={<RoleGuard allow={["hr", "admin"]} fallback={defaultRoute(user.role)}><HRTeam /></RoleGuard>} />
                <Route path="/hr/users/:id" element={<RoleGuard allow={["hr", "admin"]} fallback={defaultRoute(user.role)}><HRUserProfilePage /></RoleGuard>} />
                <Route path="/hr/leaderboard" element={<RoleGuard allow={["hr", "admin"]} fallback={defaultRoute(user.role)}><HRLeaderboard /></RoleGuard>} />
                <Route path="/hr/analytics" element={<RoleGuard allow={["hr", "admin"]} fallback={defaultRoute(user.role)}><HRAnalyticsPage /></RoleGuard>} />

                {/* Admin */}
                <Route path="/admin" element={<RoleGuard allow={["admin"]} fallback={defaultRoute(user.role)}><AdminDashboard /></RoleGuard>} />
                <Route path="/admin/courses" element={<RoleGuard allow={["admin"]} fallback={defaultRoute(user.role)}><AdminCourses /></RoleGuard>} />
                <Route path="/admin/regulations" element={<RoleGuard allow={["admin"]} fallback={defaultRoute(user.role)}><AdminRegulations /></RoleGuard>} />
                <Route path="/admin/users" element={<RoleGuard allow={["admin"]} fallback={defaultRoute(user.role)}><AdminUsers /></RoleGuard>} />
                <Route path="/admin/settings" element={<RoleGuard allow={["admin"]} fallback={defaultRoute(user.role)}><AdminSettings /></RoleGuard>} />

                <Route path="*" element={<Navigate to={defaultRoute(user.role)} replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
        <Toaster />
      </div>
    </div>
  );
}

function RoleGuard({
  allow,
  fallback,
  children,
}: {
  allow: Role[];
  fallback: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return null;
  if (!allow.includes(user.role)) return <Navigate to={fallback} replace />;
  return <>{children}</>;
}
