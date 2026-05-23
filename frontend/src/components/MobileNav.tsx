import { NavLink } from "react-router-dom";
import { LayoutDashboard, MessagesSquare, Gamepad2, TrendingUp, Moon, Sun, BookOpen } from "lucide-react";
import { useTheme } from "../theme";

const NAV = [
  { to: "/", label: "Главная", icon: LayoutDashboard, end: true },
  { to: "/courses", label: "Курсы", icon: BookOpen },
  { to: "/simulator", label: "Симул.", icon: Gamepad2 },
  { to: "/chat", label: "AI", icon: MessagesSquare },
  { to: "/progress", label: "Прогр.", icon: TrendingUp },
];

export default function MobileNav() {
  const { theme, toggle } = useTheme();
  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-900/8 bg-white/60 px-4 py-3 backdrop-blur-2xl dark:border-white/8 dark:bg-navy-900/60 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900 text-gold-500 dark:bg-white dark:text-navy-900">
            <span className="text-xs font-bold">AM</span>
          </div>
          <div className="font-display text-sm font-semibold">AI-Mentor · Turonbank</div>
        </div>
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-900/70 hover:bg-navy-900/5 dark:text-white/70 dark:hover:bg-white/10"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <nav className="fixed bottom-3 left-3 right-3 z-30 flex items-center justify-around gap-1 rounded-2xl border border-navy-900/8 bg-white/70 px-1.5 py-2 shadow-glass-lg backdrop-blur-2xl dark:border-white/8 dark:bg-navy-900/70 md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 text-[10px] font-medium transition ${
                isActive
                  ? "bg-navy-900 text-white dark:bg-white dark:text-navy-900"
                  : "text-navy-900/60 dark:text-white/60"
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
