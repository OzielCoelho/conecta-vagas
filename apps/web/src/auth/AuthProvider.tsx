import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

import { SESSION_INVALIDATED_EVENT, watchSessionExpiry } from "./auth-session";

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

  const currentToken = useRef<string | null>(null);
  const sessionVersion = useRef(0);

  function updateSession(nextToken: string | null, nextUser: AuthUser | null) {
    currentToken.current = nextToken;
    sessionVersion.current += 1;
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
    if (currentToken.current !== token) return null;
    updateSession(token, currentUser);
    return currentUser;
  }

  useEffect(() => {
    const session = loadSession();

    if (!session) {
      setIsBootstrapping(false);
      return;
    }

    let active = true;
    updateSession(session.token, session.user);

    Promise.all([getCurrentUser(session.token), fetchProfileStatus(session.token, session.user)])
      .then(([currentUser, status]) => {
        if (!active || currentToken.current !== session.token) return;
        updateSession(session.token, currentUser);
        setProfileStatus(status);
      })
      .catch(() => {
        if (!active || currentToken.current !== session.token) return;
        updateSession(null, null);
        setProfileStatus("unknown");
      })
      .finally(() => {
        if (active) setIsBootstrapping(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!token) return;
    const stopWatching = watchSessionExpiry(token, () => {
      if (currentToken.current === token) logout();
    });
    function onInvalidated(event: Event) {
      if ((event as CustomEvent<string>).detail === currentToken.current) logout();
    }
    window.addEventListener(SESSION_INVALIDATED_EVENT, onInvalidated);
    return () => {
      stopWatching();
      window.removeEventListener(SESSION_INVALIDATED_EVENT, onInvalidated);
    };
  }, [token]);

  async function refreshProfileStatus() {
    if (!token || !user) {
      setProfileStatus("unknown");
      return "unknown";
    }

    const status = await fetchProfileStatus(token, user);
    if (currentToken.current !== token) return "unknown";
    setProfileStatus(status);
    return status;
  }

  async function login(data: LoginInput) {
    const version = sessionVersion.current;
    const session = await loginUser(data);
    const currentUser = await getCurrentUser(session.token);
    const status = await fetchProfileStatus(session.token, currentUser);
    if (sessionVersion.current !== version) throw new ApiError("Solicitação de login cancelada.", 401);
    updateSession(session.token, currentUser);
    setProfileStatus(status);

    return {
      user: currentUser,
      profileStatus: status,
    };
  }

  async function register(data: RegisterInput) {
    const version = sessionVersion.current;
    await registerUser(data);
    if (sessionVersion.current !== version) throw new ApiError("Solicitação de login cancelada.", 401);
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
    if (currentToken.current !== token) return;
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
