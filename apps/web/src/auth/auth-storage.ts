import { getTokenExpiresAt } from "./auth-session";

export type AuthUser = {
  id: string;
  email: string;
  role: "STUDENT" | "COMPANY" | "COORDINATOR";
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
};

export type StoredSession = {
  token: string;
  user: AuthUser;
};

const STORAGE_KEY = "conecta_vagas_auth";

// Memory fallback keeps login usable if browser storage is unavailable.
let memorySession: StoredSession | null = null;
let memoryOnly = false;
function removeLegacySession() {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage blocked. */ }
}
export function loadSession(): StoredSession | null {
  removeLegacySession();
  let session: StoredSession | null = memorySession;
  try {
    const raw = memoryOnly ? null : window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { session = JSON.parse(raw); } catch { session = null; }
    }
  } catch { /* Storage may be blocked; use the in-memory session. */ }
  if (!session || typeof session.token !== "string" || !session.user
      || typeof session.user.id !== "string" || typeof session.user.email !== "string"
      || !["STUDENT", "COMPANY", "COORDINATOR"].includes(session.user.role)
      || (getTokenExpiresAt(session.token) ?? 0) <= Date.now()) {
    clearSession();
    return null;
  }
  memorySession = session;
  return session;
}
export function saveSession(session: StoredSession) {
  removeLegacySession();
  memorySession = session;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    memoryOnly = false;
  } catch {
    memoryOnly = true;
    // Remove any previous user's session instead of restoring it on reload.
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage blocked. */ }
  }
}
export function clearSession() {
  memorySession = null;
  memoryOnly = false;
  removeLegacySession();
  try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage blocked. */ }
}
