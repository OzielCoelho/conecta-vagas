import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "../services/api";
import { loginUser, registerUser, type LoginInput, type RegisterInput } from "../services/auth";
import { getMyCompanyProfile } from "../services/companies";
import { getMyStudentProfile } from "../services/students";
import { clearSession, loadSession, saveSession, type AuthUser } from "./auth-storage";

type ProfileStatus = "unknown" | "complete" | "incomplete";

type AuthActionResult = {
  user: AuthUser;
  profileStatus: ProfileStatus;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isDemo: boolean;
  profileStatus: ProfileStatus;
  login: (data: LoginInput) => Promise<AuthActionResult>;
  register: (data: RegisterInput) => Promise<AuthActionResult>;
  startDemo: (mode?: "student" | "company") => void;
  logout: () => void;
  refreshProfileStatus: () => Promise<ProfileStatus>;
  markProfileComplete: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfileStatus(token: string, user: AuthUser): Promise<ProfileStatus> {
  try {
    if (user.role === "STUDENT") {
      await getMyStudentProfile(token);
      return "complete";
    }

    if (user.role === "COMPANY") {
      await getMyCompanyProfile(token);
      return "complete";
    }

    return "complete";
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return "incomplete";
    }

    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("unknown");
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const session = loadSession();

    if (!session) {
      setIsBootstrapping(false);
      return;
    }

    setToken(session.token);
    setUser(session.user);

    fetchProfileStatus(session.token, session.user)
      .then((status) => {
        setProfileStatus(status);
      })
      .catch(() => {
        clearSession();
        setToken(null);
        setUser(null);
        setProfileStatus("unknown");
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, []);

  async function refreshProfileStatus() {
    if (!token || !user) {
      setProfileStatus("unknown");
      return "unknown";
    }

    const status = await fetchProfileStatus(token, user);
    setProfileStatus(status);
    return status;
  }

  async function login(data: LoginInput) {
    const session = await loginUser(data);
    saveSession(session);
    setToken(session.token);
    setUser(session.user);
    const status = await fetchProfileStatus(session.token, session.user);
    setProfileStatus(status);

    return {
      user: session.user,
      profileStatus: status,
    };
  }

  async function register(data: RegisterInput) {
    await registerUser(data);
    return login({ email: data.email, password: data.password });
  }

  function startDemo() {
    clearSession();
    setToken(null);
    setUser(null);
    setProfileStatus("unknown");
  }

  function logout() {
    clearSession();
    setToken(null);
    setUser(null);
    setProfileStatus("unknown");
  }

  function markProfileComplete() {
    setProfileStatus("complete");
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      isDemo: false,
      profileStatus,
      login,
      register,
      startDemo,
      logout,
      refreshProfileStatus,
      markProfileComplete,
    }),
    [token, user, isBootstrapping, profileStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
