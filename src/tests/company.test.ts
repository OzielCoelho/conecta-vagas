import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { AppError } from "../shared/errors/app.error";

const mocks = vi.hoisted(() => ({
  findByUserId: vi.fn(), findById: vi.fn(), create: vi.fn(), update: vi.fn(),
  created: vi.fn(), updated: vi.fn(),
}));
vi.mock("../modules/companies/company.repository", () => ({
  CompanyRepository: class {
    findByUserId = mocks.findByUserId;
    findById = mocks.findById;
    create = mocks.create;
    update = mocks.update;
  },
}));
vi.mock("../modules/notifications/notification.service", () => ({
  NotificationService: class {
    notifyCompanyProfileCreated = mocks.created;
    notifyCompanyProfileUpdated = mocks.updated;
  },
}));
import { companyRoutes } from "../modules/companies/company.routes";

let app: FastifyInstance;
let token: string;
const current = { id: "company-1", userId: "user-1", name: "Fantasia", tradeName: "Fantasia", legalName: "Razão Ltda", about: "Descrição", cultureDescription: "Descrição" };
beforeEach(async () => {
  vi.resetAllMocks();
  mocks.findByUserId.mockResolvedValue(null);
  mocks.findById.mockResolvedValue(current);
  mocks.create.mockImplementation(async data => ({ id: current.id, ...data }));
  mocks.update.mockImplementation(async (_id, data) => ({ ...current, ...data }));
  app = Fastify();
  await app.register(jwt, { secret: "company_test_only_secret" });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    const validation = error as { validation?: unknown; message: string };
    return reply.status(validation.validation ? 400 : 500).send({ message: validation.message });
  });
  await app.register(companyRoutes, { prefix: "/companies" });
  token = app.jwt.sign({ id: current.userId, role: "COMPANY" });
});
afterEach(async () => { await app.close(); });
function request(method: "POST" | "PUT", payload: object, requestToken = token) {
  return app.inject({ method, url: method === "POST" ? "/companies" : `/companies/${current.id}`, headers: { authorization: `Bearer ${requestToken}` }, payload });
}

describe("Company API - validation and persistence contract", () => {
  it("creates without name, deriving it from the trimmed trade name", async () => {
    const response = await request("POST", { legalName: "  Razão Ltda  ", tradeName: "  Fantasia  " });
    expect(response.statusCode).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({ userId: current.userId, legalName: "Razão Ltda", tradeName: "Fantasia", name: "Fantasia" });
    expect(mocks.created).toHaveBeenCalledOnce();
  });
  it.each(["legalName", "tradeName"])("rejects missing %s before persistence", async field => {
    const payload: Record<string, string> = { legalName: "Razão Ltda", tradeName: "Fantasia" };
    delete payload[field];
    const response = await request("POST", payload);
    expect(response.statusCode).toBe(400);
    expect(response.json().message).toContain(field);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each(["legalName", "tradeName", "name"])("rejects blank %s in creation and update", async field => {
    for (const method of ["POST", "PUT"] as const) {
      const response = await request(method, { legalName: "Razão Ltda", tradeName: "Fantasia", [field]: "   " });
      expect(response.statusCode).toBe(400);
    }
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([null, {}, "x", "a".repeat(161)])("rejects invalid legalName %s", async legalName => {
    const response = await request("POST", { legalName, tradeName: "Fantasia" });
    expect(response.statusCode).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("keeps the trade name as display name when only legalName changes", async () => {
    const response = await request("PUT", { legalName: "Nova Razão Ltda" });
    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(current.id, { legalName: "Nova Razão Ltda", name: "Fantasia" });
  });
  it("updates display name with tradeName and preserves omitted fields", async () => {
    const response = await request("PUT", { tradeName: "  Nova Fantasia  " });
    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(current.id, { tradeName: "Nova Fantasia", name: "Nova Fantasia" });
    expect(response.json().legalName).toBe(current.legalName);
    expect(mocks.updated).toHaveBeenCalledOnce();
  });
  it("supports a partial update without rewriting names or descriptions", async () => {
    expect((await request("PUT", { commercialPhone: "  92999999999  " })).statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(current.id, { commercialPhone: "92999999999" });
  });
  it("allows only the company owner or a coordinator to update the profile", async () => {
    const ownerResponse = await request("PUT", { commercialPhone: "999" });
    expect(ownerResponse.statusCode).toBe(200);
    expect(mocks.updated).toHaveBeenCalledOnce();

    vi.clearAllMocks();
    mocks.findById.mockResolvedValue(current);
    const otherCompanyToken = app.jwt.sign({ id: "user-2", role: "COMPANY" });
    const forbiddenResponse = await request("PUT", { commercialPhone: "000", userId: "user-1", role: "COORDINATOR" }, otherCompanyToken);
    expect(forbiddenResponse.statusCode).toBe(403);
    expect(forbiddenResponse.json()).toEqual({ message: "Acesso negado." });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.updated).not.toHaveBeenCalled();

    const coordinatorToken = app.jwt.sign({ id: "coordinator-1", role: "COORDINATOR" });
    expect((await request("PUT", { commercialPhone: "111" }, coordinatorToken)).statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledOnce();
  });
  it("requires a valid token to update a company profile", async () => {
    const response = await app.inject({ method: "PUT", url: `/companies/${current.id}`, payload: { commercialPhone: "000" } });
    expect(response.statusCode).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.updated).not.toHaveBeenCalled();
  });
  it("rejects invalid tokens and identity fields supplied in the body", async () => {
    const invalidTokenResponse = await request("PUT", { commercialPhone: "000" }, `${token}invalid`);
    expect(invalidTokenResponse.statusCode).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.updated).not.toHaveBeenCalled();

  });
  it("supports legacy records without legalName or tradeName", async () => {
    mocks.findById.mockResolvedValue({ ...current, legalName: null, tradeName: null });
    expect((await request("PUT", { name: "Empresa Legada" })).statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(current.id, { name: "Empresa Legada" });
  });
  it("preserves about as an alias and gives cultureDescription precedence", async () => {
    await request("PUT", { about: "  Texto legado  " });
    expect(mocks.update).toHaveBeenLastCalledWith(current.id, { about: "Texto legado", cultureDescription: "Texto legado" });
    await request("PUT", { about: "Ignorado", cultureDescription: "  Cultura  " });
    expect(mocks.update).toHaveBeenLastCalledWith(current.id, { about: "Cultura", cultureDescription: "Cultura" });
    await request("PUT", { cultureDescription: "" });
    expect(mocks.update).toHaveBeenLastCalledWith(current.id, { about: "", cultureDescription: "" });
  });
  it("keeps duplicate-profile and missing-profile errors", async () => {
    mocks.findByUserId.mockResolvedValue(current);
    expect((await request("POST", { legalName: "Razão Ltda", tradeName: "Fantasia" })).statusCode).toBe(409);
    mocks.findById.mockResolvedValue(null);
    expect((await request("PUT", { tradeName: "Fantasia" })).statusCode).toBe(404);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
