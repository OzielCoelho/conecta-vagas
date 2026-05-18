export type AuthUser = {
  id: string;
  email: string;
  role: "STUDENT" | "COMPANY" | "COORDINATOR";
};

export type StoredSession = {
  token: string;
  user: AuthUser;
};

const STORAGE_KEY = "conecta_vagas_auth";

export function loadSession(): StoredSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: StoredSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}
