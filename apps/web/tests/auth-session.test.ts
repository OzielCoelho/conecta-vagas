import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { clearSession, loadSession, saveSession } from "../src/auth/auth-storage";
import { getTokenExpiresAt, SESSION_INVALIDATED_EVENT, watchSessionExpiry } from "../src/auth/auth-session";
import { apiRequest } from "../src/services/api";
const key = "conecta_vagas_auth";
const user = { id: "user-1", email: "student@example.test", role: "STUDENT" as const };
const token = (exp?: number) => `header.${btoa(JSON.stringify(exp === undefined ? {} : { exp }))}.signature`;
function storage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) };
}
let browser: EventTarget & { localStorage: ReturnType<typeof storage>; sessionStorage: ReturnType<typeof storage> };
let documentEvents: EventTarget;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
  browser = Object.assign(new EventTarget(), { localStorage: storage(), sessionStorage: storage() });
  documentEvents = new EventTarget();
  vi.stubGlobal("window", browser);
  vi.stubGlobal("document", documentEvents);
  clearSession();
});
afterEach(() => { clearSession(); vi.useRealTimers(); vi.unstubAllGlobals(); });
it("uses sessionStorage and removes legacy credentials", () => {
  browser.localStorage.setItem(key, "legacy");
  const session = { token: token(Date.now() / 1000 + 60), user };
  saveSession(session);
  expect(loadSession()).toEqual(session);
  expect(browser.localStorage.getItem(key)).toBeNull();
  expect(JSON.parse(browser.sessionStorage.getItem(key)!)).toEqual(session);
  clearSession();
  expect(loadSession()).toBeNull();
});
it.each([token(), token(1), "invalid-token"])("rejects invalid or expired sessions: %s", invalidToken => {
  saveSession({ token: invalidToken, user });
  expect(loadSession()).toBeNull();
  expect(browser.sessionStorage.getItem(key)).toBeNull();
});
it("rejects malformed session JSON", () => {
  browser.sessionStorage.setItem(key, "not json");
  expect(loadSession()).toBeNull();
});
it("supports blocked browser storage with memory fallback", () => {
  browser.sessionStorage.setItem = () => { throw new Error("blocked"); };
  browser.sessionStorage.getItem = () => { throw new Error("blocked"); };
  const session = { token: token(Date.now() / 1000 + 60), user };
  saveSession(session);
  expect(loadSession()).toEqual(session);
  clearSession();
  expect(loadSession()).toBeNull();
});
it("expires automatically without a request", () => {
  const expire = vi.fn();
  const stop = watchSessionExpiry(token(Date.now() / 1000 + 60), expire);
  vi.advanceTimersByTime(59999);
  expect(expire).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(expire).toHaveBeenCalledOnce();
  stop();
});
it.each(["focus", "visibilitychange"])("rechecks on %s after a suspended tab", eventName => {
  const expire = vi.fn();
  const stop = watchSessionExpiry(token(Date.now() / 1000 + 60), expire);
  vi.setSystemTime(Date.now() + 61000);
  (eventName === "focus" ? browser : documentEvents).dispatchEvent(new Event(eventName));
  expect(expire).toHaveBeenCalledOnce();
  stop();
});
it("cancels old expiration callbacks", () => {
  const expire = vi.fn();
  const stop = watchSessionExpiry(token(Date.now() / 1000 + 60), expire);
  stop();
  vi.advanceTimersByTime(61000);
  browser.dispatchEvent(new Event("focus"));
  expect(expire).not.toHaveBeenCalled();
  expect(getTokenExpiresAt("a.???.b")).toBeNull();
});
it.each(["/users/me", "/users/password"])("signals a rejected token on %s", async path => {
  const listener = vi.fn();
  browser.addEventListener(SESSION_INVALIDATED_EVENT, listener);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Token inválido ou ausente." }), { status: 401 })));
  await expect(apiRequest(path, { token: "old-session" })).rejects.toMatchObject({ status: 401 });
  expect(listener).toHaveBeenCalledOnce();
  expect((listener.mock.calls[0][0] as CustomEvent).detail).toBe("old-session");
});
it("does not log out for an incorrect current password", async () => {
  const listener = vi.fn();
  browser.addEventListener(SESSION_INVALIDATED_EVENT, listener);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Senha atual incorreta." }), { status: 401 })));
  await expect(apiRequest("/users/password", { token: "valid" })).rejects.toMatchObject({ status: 401 });
  expect(listener).not.toHaveBeenCalled();
});
it.each([403, 429, 500])("does not end sessions on %s", async status => {
  const listener = vi.fn();
  browser.addEventListener(SESSION_INVALIDATED_EVENT, listener);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));
  await expect(apiRequest("/jobs", { token: "valid" })).rejects.toMatchObject({ status });
  expect(listener).not.toHaveBeenCalled();
});
it("does not restore the previous user when storing a new session fails", () => {
  saveSession({ token: token(Date.now() / 1000 + 60), user });
  browser.sessionStorage.setItem = () => { throw new Error("quota exceeded"); };
  const newSession = { token: token(Date.now() / 1000 + 120), user: { ...user, id: "user-2", email: "other@example.test" } };
  saveSession(newSession);
  expect(loadSession()).toEqual(newSession);
  expect(browser.sessionStorage.getItem(key)).toBeNull();
});
