import { createContext, useContext, useEffect, ReactNode } from "react";

type Theme = "dark";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

// KOMPAS is dark-only by design; the toggle is a no-op kept for API compatibility.
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.dataset.theme = "dark";
    localStorage.setItem("theme", "dark");
  }, []);

  return (
    <Ctx.Provider value={{ theme: "dark", setTheme: () => {}, toggle: () => {} }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme outside ThemeProvider");
  return v;
}
