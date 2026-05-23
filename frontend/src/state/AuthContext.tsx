import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, ApiError, Role, User, getToken, setToken } from "../api";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    position?: string;
    department?: string;
    program?: string;
  }) => Promise<User>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  refreshMe: () => Promise<void>;
  /** Lets pages update the cached User after a profile edit. */
  setUser: (u: User) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshMe();
      setLoading(false);
    })();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await api.login(email, password);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail || e.message : String(e);
      setError(msg);
      throw e;
    }
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      full_name: string;
      position?: string;
      department?: string;
      program?: string;
    }) => {
      setError(null);
      try {
        const res = await api.register(payload);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      } catch (e) {
        const msg = e instanceof ApiError ? e.detail || e.message : String(e);
        setError(msg);
        throw e;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user],
  );

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      hasRole,
      refreshMe,
      setUser,
    }),
    [user, loading, error, login, register, logout, hasRole, refreshMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
