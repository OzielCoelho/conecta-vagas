export const SESSION_INVALIDATED_EVENT = "conecta-vagas:session-invalidated";

// The server verifies signatures. This decoding is only for local session expiry.
export function getTokenExpiresAt(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "="))) as { exp?: unknown };
    return typeof payload.exp === "number" && Number.isSafeInteger(payload.exp) && payload.exp > 0
      ? payload.exp * 1000 : null;
  } catch { return null; }
}

export function watchSessionExpiry(token: string, onExpire: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let expired = false;
  function check() {
    if (expired) return;
    if (timer) clearTimeout(timer);
    const expiresAt = getTokenExpiresAt(token);
    const remaining = (expiresAt ?? 0) - Date.now();
    if (remaining <= 0) { expired = true; onExpire(); }
    else timer = setTimeout(check, Math.min(remaining, 2147483647));
  }
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", check);
  check();
  return () => {
    expired = true;
    if (timer) clearTimeout(timer);
    window.removeEventListener("focus", check);
    document.removeEventListener("visibilitychange", check);
  };
}

export function notifySessionInvalidated(token: string) {
  window.dispatchEvent(new CustomEvent(SESSION_INVALIDATED_EVENT, { detail: token }));
}
