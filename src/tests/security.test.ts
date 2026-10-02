import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Writable } from "node:stream";
import type { FastifyInstance } from "fastify";
import { AppError } from "../shared/errors/app.error";

const mocks = vi.hoisted(() => ({ login: vi.fn(), create: vi.fn(), getMe: vi.fn(), password: vi.fn(), update: vi.fn() }));
vi.mock("../modules/users/user.service", () => ({
  UserService: class {
    login = mocks.login;
    create = mocks.create;
    getMe = mocks.getMe;
    updatePassword = mocks.password;
    updateMe = mocks.update;
  },
}));
import { buildApp } from "../app";
import { readSecurityConfig } from "../shared/config/security.config";
const env = { JWT_SECRET: "security_test_only_secret", JWT_TTL_SECONDS: "3600", CORS_ORIGINS: "http://localhost:5173,https://frontend.example.test", AUTH_RATE_LIMIT_MAX: "2", AUTH_RATE_LIMIT_WINDOW_MS: "60000" };
const user = { id: "user-1", role: "STUDENT" as const, email: "student@example.test" };
const credentials = { email: user.email, password: "password_test_only" };
let app: FastifyInstance;
beforeEach(async () => {
  vi.resetAllMocks();
  mocks.login.mockResolvedValue(user);
  mocks.create.mockResolvedValue(user);
  mocks.getMe.mockResolvedValue(user);
  mocks.update.mockResolvedValue(user);
  app = buildApp({ env, logger: false });
  await app.ready();
});
afterEach(async () => { await app.close(); });

describe("Security on the production app factory", () => {
  it("issues an explicitly expiring token without returning password or secret", async () => {
    const response = await app.inject({ method: "POST", url: "/users/login", payload: credentials });
    expect(response.statusCode).toBe(200);
    const decoded = app.jwt.decode<{ iat: number; exp: number }>(response.json().token)!;
    expect(decoded.exp - decoded.iat).toBe(3600);
    expect(response.body).not.toContain(credentials.password);
    expect(response.body).not.toContain(env.JWT_SECRET);
  });
  it.each(["STUDENT", "COMPANY", "COORDINATOR"] as const)("accepts a valid token for %s", async role => {
    const token = app.jwt.sign({ id: user.id, role });
    const response = await app.inject({ url: "/users/me", headers: { authorization: `Bearer ${token}` } });
    expect(response.statusCode).toBe(200);
    expect(mocks.getMe).toHaveBeenCalledWith(user.id);
  });
  it("rejects missing, tampered, expired and non-expiring tokens", async () => {
    const expiredClaims = { id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) - 10 };
    const noExpiry = app.jwt.sign({ id: user.id, role: user.role }, { expiresIn: 0 });
    expect(app.jwt.decode<{ exp?: number }>(noExpiry)!.exp).toBeUndefined();
    for (const token of ["", `${app.jwt.sign(user)}invalid`, app.jwt.sign(expiredClaims), noExpiry]) {
      const response = await app.inject({ url: "/users/me", headers: token ? { authorization: `Bearer ${token}` } : {} });
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ message: "Token inválido ou ausente." });
    }
    expect(mocks.getMe).not.toHaveBeenCalled();
  });
  it.each(["http://localhost:5173", "https://frontend.example.test"])("allows configured origin %s", async origin => {
    const response = await app.inject({ url: "/health", headers: { origin } });
    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(origin);
  });
  it("allows local preflight with authorization headers", async () => {
    const response = await app.inject({ method: "OPTIONS", url: "/users/me", headers: { origin: "http://localhost:5173", "access-control-request-method": "GET", "access-control-request-headers": "authorization" } });
    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-headers"]).toContain("authorization");
  });
  it.each(["https://evil.example", "http://localhost:5173.evil.example", "null"])("rejects unapproved origin %s before the service", async origin => {
    const response = await app.inject({ method: "POST", url: "/users/login", headers: { origin }, payload: credentials });
    expect(response.statusCode).toBe(403);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(mocks.login).not.toHaveBeenCalled();
  });
  it("allows requests without Origin, including health checks", async () => {
    expect((await app.inject("/health")).statusCode).toBe(200);
  });
  it.each([
    { method: "POST" as const, url: "/users/login", payload: credentials, mock: "login" as const },
    { method: "POST" as const, url: "/users/register", payload: { ...credentials, role: "COMPANY" }, mock: "create" as const },
    { method: "PATCH" as const, url: "/users/password", payload: { currentPassword: "old_test", newPassword: "new_test" }, mock: "password" as const },
    { method: "PATCH" as const, url: "/users/me", payload: { email: user.email }, mock: "update" as const },
  ])("limits $method $url and preserves Retry-After", async ({ method, url, payload, mock }) => {
    const headers = { authorization: `Bearer ${app.jwt.sign(user)}` };
    for (let i = 0; i < 2; i++) expect((await app.inject({ method, url, payload, headers })).statusCode).toBeLessThan(300);
    const response = await app.inject({ method, url, payload, headers });
    expect(response.statusCode).toBe(429);
    expect(response.json()).toEqual({ message: "Muitas tentativas. Aguarde e tente novamente." });
    expect(Number(response.headers["retry-after"])).toBeGreaterThan(0);
    expect(mocks[mock]).toHaveBeenCalledTimes(2);
  });
  it("counts failed logins and does not trust forged X-Forwarded-For", async () => {
    mocks.login.mockRejectedValue(new AppError("Email ou senha inválidos.", 401));
    for (let i = 0; i < 3; i++) {
      const response = await app.inject({ method: "POST", url: "/users/login", payload: credentials, headers: { "x-forwarded-for": `192.0.2.${i + 1}` } });
      expect(response.statusCode).toBe(i < 2 ? 401 : 429);
    }
  });
  it("does not share limits between different client IPs or unrelated health checks", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await app.inject({ method: "POST", url: "/users/login", payload: credentials, remoteAddress: `192.0.2.${i + 1}` })).statusCode).toBe(200);
      expect((await app.inject("/health")).statusCode).toBe(200);
    }
  });
  it("does not expose credentials or exception content in logs or error responses", async () => {
    await app.close();
    let logs = "";
    const stream = new Writable({ write(chunk, _encoding, callback) { logs += chunk.toString(); callback(); } });
    app = buildApp({ env, logger: { stream } });
    mocks.login.mockRejectedValue(new Error("private-database-password-sentinel"));
    const response = await app.inject({ method: "POST", url: "/users/login", payload: credentials, headers: { authorization: "Bearer private-token-sentinel", cookie: "secret-cookie-sentinel" } });
    await app.inject({ url: "/health?token=private-query-token" });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ message: "Erro interno do servidor." });
    for (const secret of [credentials.password, env.JWT_SECRET, "private-database-password-sentinel", "private-token-sentinel", "secret-cookie-sentinel", "private-query-token"]) {
      expect(logs).not.toContain(secret);
      expect(response.body).not.toContain(secret);
    }
    expect(logs).toContain("Falha interna ao processar requisição.");
  });
});

describe("Security configuration", () => {
  it.each([
    { JWT_TTL_SECONDS: "0" }, { JWT_TTL_SECONDS: "forever" }, { JWT_TTL_SECONDS: "86401" },
    { AUTH_RATE_LIMIT_MAX: "0" }, { AUTH_RATE_LIMIT_WINDOW_MS: "-1" },
    { CORS_ORIGINS: "*" }, { CORS_ORIGINS: "" }, { CORS_ORIGINS: "https://example.test/path" },
    { JWT_SECRET: "" },
  ])("rejects invalid security configuration %j", override => {
    expect(() => readSecurityConfig({ ...env, ...override })).toThrow();
  });
});
