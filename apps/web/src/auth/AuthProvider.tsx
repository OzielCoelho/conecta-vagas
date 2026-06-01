import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "../services/api";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  type LoginInput,
  type RegisterInput,
} from "../services/auth";
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
  refreshCurrentUser: () => Promise<AuthUser | null>;
  markProfileComplete: () => void;
  setUser: (user: AuthUser | null) => void;
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
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("unknown");
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  function updateSession(nextToken: string | null, nextUser: AuthUser | null) {
    setToken(nextToken);
    setUserState(nextUser);

    if (nextToken && nextUser) {
      saveSession({ token: nextToken, user: nextUser });
    } else {
      clearSession();
    }
  }

  async function refreshCurrentUser() {
    if (!token) {
      updateSession(null, null);
      return null;
    }

    const currentUser = await getCurrentUser(token);
    updateSession(token, currentUser);
    return currentUser;
  }

  useEffect(() => {
    const session = loadSession();

    if (!session) {
      setIsBootstrapping(false);
      return;
    }

    setToken(session.token);
    setUserState(session.user);

    Promise.all([getCurrentUser(session.token), fetchProfileStatus(session.token, session.user)])
      .then(([currentUser, status]) => {
        updateSession(session.token, currentUser);
        setProfileStatus(status);
      })
      .catch(() => {
        updateSession(null, null);
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
    const currentUser = await getCurrentUser(session.token);
    updateSession(session.token, currentUser);
    const status = await fetchProfileStatus(session.token, currentUser);
    setProfileStatus(status);

    return {
      user: currentUser,
      profileStatus: status,
    };
  }

  async function register(data: RegisterInput) {
    await registerUser(data);
    return login({ email: data.email, password: data.password });
  }

  function startDemo() {
    updateSession(null, null);
    setProfileStatus("unknown");
  }

  function logout() {
    updateSession(null, null);
    setProfileStatus("unknown");
  }

  function markProfileComplete() {
    setProfileStatus("complete");
  }

  function setUser(nextUser: AuthUser | null) {
    updateSession(token, nextUser);
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
      refreshCurrentUser,
      markProfileComplete,
      setUser,
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
