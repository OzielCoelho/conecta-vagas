import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { AppError } from "../shared/errors/app.error";

const mocks = vi.hoisted(() => ({
  duplicate: vi.fn(), student: vi.fn(), job: vi.fn(), create: vi.fn(), score: vi.fn(), notify: vi.fn(),
}));
vi.mock("../modules/applications/application.repository", () => ({
  ApplicationRepository: class {
    findByStudentAndJob = mocks.duplicate;
    create = mocks.create;
  },
}));
vi.mock("../modules/students/student.repository", () => ({
  StudentRepository: class {
    findById = mocks.student;
    findByUserId = mocks.student;
  },
}));
vi.mock("../modules/jobs/job.repository", () => ({
  JobRepository: class { findByIdForNotification = mocks.job; },
}));
vi.mock("../modules/match/match.service", () => ({
  MatchService: class { calculateAndSaveScore = mocks.score; },
}));
vi.mock("../modules/notifications/notification.service", () => ({
  NotificationService: class { notifyApplicationCreated = mocks.notify; },
}));
vi.mock("../modules/companies/company.service", () => ({ CompanyService: class {} }));
vi.mock("../modules/applications/application.export", () => ({ generateApplicationsCSV: vi.fn() }));
import { applicationRoutes } from "../modules/applications/application.routes";

const jobId = "123e4567-e89b-42d3-a456-426614174000";
const studentId = "123e4567-e89b-42d3-a456-426614174001";
let app: FastifyInstance;
let token: string;
beforeEach(async () => {
  vi.resetAllMocks();
  mocks.duplicate.mockResolvedValue(null);
  mocks.student.mockResolvedValue({ id: studentId, userId: "student-user", name: "Ana" });
  mocks.job.mockResolvedValue({ id: jobId, isActive: true, title: "Estágio", company: { userId: "company-user" } });
  mocks.create.mockResolvedValue({ id: "application-1", studentId, jobId });
  mocks.score.mockResolvedValue({ id: "application-1", studentId, jobId, score: 100 });
  app = Fastify({ ajv: { customOptions: { removeAdditional: false } } });
  await app.register(jwt, { secret: "application_test_only_secret" });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    if ((error as { validation?: unknown }).validation) return reply.status(400).send({ message: "Dados da requisição inválidos." });
    return reply.status(500).send({ message: "Erro interno do servidor." });
  });
  await app.register(applicationRoutes, { prefix: "/applications" });
  token = app.jwt.sign({ id: "student-user", role: "STUDENT" });
});
afterEach(async () => { await app.close(); });
function apply(requestToken: string | undefined = token, payload: object = { jobId }) {
  return app.inject({ method: "POST", url: "/applications", headers: requestToken ? { authorization: `Bearer ${requestToken}` } : {}, payload });
}
function expectNoSideEffects() {
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.score).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
}
describe("Application creation rules", () => {
  it("creates an application for an active job using the student from the JWT", async () => {
    const response = await apply();
    expect(response.statusCode).toBe(201);
    expect(mocks.student).toHaveBeenCalledWith("student-user");
    expect(mocks.create).toHaveBeenCalledWith({ studentId, jobId });
    expect(response.json().score).toBe(100);
    expect(mocks.notify).toHaveBeenCalledOnce();
  });
  it("rejects an inactive job before persistence, scoring or notification", async () => {
    mocks.job.mockResolvedValue({ id: jobId, isActive: false });
    const response = await apply();
    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ message: "Esta vaga não está mais disponível para candidaturas." });
    expectNoSideEffects();
  });
  it("returns 404 for a nonexistent job", async () => {
    mocks.job.mockResolvedValue(null);
    const response = await apply();
    expect(response.statusCode).toBe(404);
    expect(response.json().message).toBe("Vaga não encontrada.");
    expectNoSideEffects();
  });
  it("preserves the duplicate application conflict", async () => {
    mocks.duplicate.mockResolvedValue({ id: "existing" });
    const response = await apply();
    expect(response.statusCode).toBe(409);
    expect(response.json().message).toBe("Você já se candidatou a esta vaga.");
    expectNoSideEffects();
  });
  it("requires a student profile", async () => {
    mocks.student.mockResolvedValue(null);
    expect((await apply()).statusCode).toBe(404);
    expectNoSideEffects();
  });
  it.each(["COMPANY", "COORDINATOR"] as const)("rejects the %s role", async role => {
    expect((await apply(app.jwt.sign({ id: "other-user", role }))).statusCode).toBe(403);
    expectNoSideEffects();
  });
  it.each(["", "invalid-token"])("requires a valid token (%s)", async requestToken => {
    expect((await apply(requestToken)).statusCode).toBe(401);
    expectNoSideEffects();
  });
  it.each([{ jobId, isActive: true }, { jobId, studentId }, { jobId: "invalid" }])("rejects forged state or identity and malformed IDs", async payload => {
    expect((await apply(token, payload)).statusCode).toBe(400);
    expectNoSideEffects();
  });
});
