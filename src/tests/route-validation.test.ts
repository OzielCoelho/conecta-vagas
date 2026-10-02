import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";

const mocks = vi.hoisted(() => ({
  job: { create: vi.fn(), findAll: vi.fn(), findByCompanyId: vi.fn(), findById: vi.fn(), update: vi.fn() },
  companyFindByUserId: vi.fn(),
  studentFindByUserId: vi.fn(),
  application: { create: vi.fn(), findByJobId: vi.fn(), findByStudentId: vi.fn(), updateStatus: vi.fn() },
  notification: { listForUser: vi.fn(), markAsRead: vi.fn(), markAllAsRead: vi.fn(), createSystemNotification: vi.fn() },
  exportCSV: vi.fn(),
}));

vi.mock("../modules/jobs/job.service", () => ({
  JobService: class {
    create = mocks.job.create;
    findAll = mocks.job.findAll;
    findByCompanyId = mocks.job.findByCompanyId;
    findById = mocks.job.findById;
    update = mocks.job.update;
  },
}));
vi.mock("../modules/companies/company.service", () => ({
  CompanyService: class {
    findByUserId = mocks.companyFindByUserId;
  },
}));
vi.mock("../modules/students/student.repository", () => ({
  StudentRepository: class {
    findByUserId = mocks.studentFindByUserId;
  },
}));
vi.mock("../modules/applications/application.service", () => ({
  ApplicationService: class {
    create = mocks.application.create;
    findByJobId = mocks.application.findByJobId;
    findByStudentId = mocks.application.findByStudentId;
    updateStatus = mocks.application.updateStatus;
  },
}));
vi.mock("../modules/applications/application.export", () => ({
  generateApplicationsCSV: mocks.exportCSV,
}));
vi.mock("../modules/notifications/notification.service", () => ({
  NotificationService: class {
    listForUser = mocks.notification.listForUser;
    markAsRead = mocks.notification.markAsRead;
    markAllAsRead = mocks.notification.markAllAsRead;
    createSystemNotification = mocks.notification.createSystemNotification;
  },
}));

import { applicationRoutes } from "../modules/applications/application.routes";
import { jobRoutes } from "../modules/jobs/job.routes";
import { notificationRoutes } from "../modules/notifications/notification.routes";

const uuid = "123e4567-e89b-42d3-a456-426614174000";
const validJob = {
  title: "Pessoa desenvolvedora júnior",
  description: "Desenvolver e manter aplicações web.",
  skills: ["TypeScript", "SQL"],
  model: "HYBRID",
  location: "Manaus, AM",
  course: "Engenharia de Software",
  availability: "TARDE",
};

let app: FastifyInstance;
let companyToken: string;
let studentToken: string;
let coordinatorToken: string;

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.job.create.mockResolvedValue({ id: uuid });
  mocks.job.findAll.mockResolvedValue([]);
  mocks.job.findByCompanyId.mockResolvedValue([]);
  mocks.job.findById.mockResolvedValue({ id: uuid });
  mocks.job.update.mockResolvedValue({ id: uuid });
  mocks.companyFindByUserId.mockResolvedValue({ id: uuid });
  mocks.studentFindByUserId.mockResolvedValue({ id: uuid });
  mocks.application.create.mockResolvedValue({ id: uuid });
  mocks.application.findByJobId.mockResolvedValue([]);
  mocks.application.findByStudentId.mockResolvedValue([]);
  mocks.application.updateStatus.mockResolvedValue({ id: uuid });
  mocks.exportCSV.mockResolvedValue("ID,Aluno");
  mocks.notification.listForUser.mockResolvedValue({ items: [], unreadCount: 0 });
  mocks.notification.markAsRead.mockResolvedValue({ id: uuid });
  mocks.notification.markAllAsRead.mockResolvedValue({ updatedCount: 0 });
  mocks.notification.createSystemNotification.mockResolvedValue({ createdCount: 1 });

  app = Fastify({ ajv: { customOptions: { removeAdditional: false } } });
  await app.register(jwt, { secret: "route_validation_test_secret" });
  app.setErrorHandler((error, _request, reply) => {
    if (typeof error === "object" && error !== null && "validation" in error && Boolean((error as { validation?: unknown }).validation)) {
      return reply.status(400).send({ message: "Dados da requisição inválidos." });
    }
    return reply.status(500).send({ message: "Erro interno do servidor." });
  });
  await app.register(jobRoutes, { prefix: "/jobs" });
  await app.register(applicationRoutes, { prefix: "/applications" });
  await app.register(notificationRoutes, { prefix: "/notifications" });
  companyToken = app.jwt.sign({ id: "company-user", role: "COMPANY" });
  studentToken = app.jwt.sign({ id: "student-user", role: "STUDENT" });
  coordinatorToken = app.jwt.sign({ id: "coordinator-user", role: "COORDINATOR" });
});

afterEach(async () => { await app.close(); });

function request(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: object, token = companyToken) {
  return app.inject({
    method,
    url,
    headers: { authorization: `Bearer ${token}` },
    ...(payload === undefined ? {} : { payload }),
  });
}

function expectBadRequest(response: { statusCode: number; json: () => { message: string } }) {
  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({ message: "Dados da requisição inválidos." });
}

describe("Job route schemas", () => {
  it("accepts a valid job and a valid partial update", async () => {
    expect((await request("POST", "/jobs", validJob)).statusCode).toBe(201);
    expect(mocks.job.create).toHaveBeenCalledOnce();
    expect((await request("PUT", `/jobs/${uuid}`, { isActive: false })).statusCode).toBe(200);
    expect(mocks.job.update).toHaveBeenCalledOnce();
  });

  it("accepts all valid job read routes", async () => {
    expect((await request("GET", "/jobs")).statusCode).toBe(200);
    expect((await request("GET", "/jobs/mine")).statusCode).toBe(200);
    expect((await request("GET", `/jobs/${uuid}`)).statusCode).toBe(200);
    expect(mocks.job.findAll).toHaveBeenCalledOnce();
    expect(mocks.job.findByCompanyId).toHaveBeenCalledOnce();
    expect(mocks.job.findById).toHaveBeenCalledOnce();
  });

  it.each([
    [{ title: "Pessoa desenvolvedora júnior", description: "Vaga", model: "REMOTE" }],
    [{ ...validJob, model: "ONSITE" }],
    [{ ...validJob, title: "ab" }],
    [{ ...validJob, title: "t".repeat(161) }],
    [{ ...validJob, companyId: uuid }],
    [{ ...validJob, skills: [""] }],
    [{ ...validJob, skills: Array.from({ length: 31 }, () => "TypeScript") }],
  ])("rejects malformed job payloads before calling services", async (payload) => {
    const response = await request("POST", "/jobs", payload);
    expectBadRequest(response);
    expect(mocks.job.create).not.toHaveBeenCalled();
  });

  it("validates job identifiers, rejects empty updates and unknown queries", async () => {
    expectBadRequest(await request("GET", "/jobs/not-a-uuid"));
    expectBadRequest(await request("PUT", `/jobs/${uuid}`, {}));
    expectBadRequest(await request("GET", "/jobs?unexpected=true"));
    expectBadRequest(await request("GET", "/jobs/mine?limit=10"));
    expect(mocks.job.findById).not.toHaveBeenCalled();
    expect(mocks.job.update).not.toHaveBeenCalled();
  });
});

describe("Application route schemas", () => {
  it("accepts valid application and status payloads", async () => {
    expect((await request("POST", "/applications", { jobId: uuid }, studentToken)).statusCode).toBe(201);
    expect(mocks.application.create).toHaveBeenCalledWith({ jobId: uuid, studentId: uuid }, "student-user");
    expect((await request("PATCH", `/applications/${uuid}/status`, { status: "UNDER_REVIEW" })).statusCode).toBe(200);
    expect(mocks.application.updateStatus).toHaveBeenCalledOnce();
  });

  it("accepts all valid application read and export routes", async () => {
    expect((await request("GET", "/applications/me", undefined, studentToken)).statusCode).toBe(200);
    expect((await request("GET", `/applications/job/${uuid}`)).statusCode).toBe(200);
    expect((await request("GET", "/applications/export/csv", undefined, coordinatorToken)).statusCode).toBe(200);
    expect(mocks.application.findByStudentId).toHaveBeenCalledOnce();
    expect(mocks.application.findByJobId).toHaveBeenCalledOnce();
    expect(mocks.exportCSV).toHaveBeenCalledOnce();
  });

  it("rejects invalid application IDs, statuses and extra fields before services", async () => {
    expectBadRequest(await request("POST", "/applications", {}, studentToken));
    expectBadRequest(await request("POST", "/applications", { jobId: "bad" }, studentToken));
    expectBadRequest(await request("POST", "/applications", { jobId: uuid, studentId: uuid }, studentToken));
    expectBadRequest(await request("GET", "/applications/job/not-a-uuid"));
    expectBadRequest(await request("GET", "/applications/export/csv?unexpected=true", undefined, coordinatorToken));
    expectBadRequest(await request("PATCH", `/applications/${uuid}/status`, { status: "DONE" }));
    expectBadRequest(await request("PATCH", `/applications/${uuid}/status`, {}));
    expectBadRequest(await request("PATCH", `/applications/${uuid}/status`, { status: "REJECTED", extra: true }));
    expect(mocks.application.create).not.toHaveBeenCalled();
    expect(mocks.application.findByJobId).not.toHaveBeenCalled();
    expect(mocks.application.updateStatus).not.toHaveBeenCalled();
  });
});

describe("Notification route schemas", () => {
  it.each(["1", "50"]) ("accepts notification limit %s", async (limit) => {
    expect((await request("GET", `/notifications?limit=${limit}`)).statusCode).toBe(200);
  });

  it.each(["0", "51", "1.5", "many", "10&other=true"]) ("rejects invalid notification limit %s", async (limit) => {
    expectBadRequest(await request("GET", `/notifications?limit=${limit}`));
  });

  it("accepts read operations and system notifications with a single recipient selector", async () => {
    expect((await request("PATCH", "/notifications/read-all")).statusCode).toBe(200);
    expect((await request("PATCH", `/notifications/${uuid}/read`)).statusCode).toBe(200);
    expect((await request("POST", "/notifications/system", { title: "Aviso", message: "Manutenção programada" }, coordinatorToken)).statusCode).toBe(201);
    expect((await request("POST", "/notifications/system", { title: "Aviso", message: "Atualização", recipientRole: "STUDENT" }, coordinatorToken)).statusCode).toBe(201);
    expect(mocks.notification.createSystemNotification).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed notification params, bodies and recipient selectors", async () => {
    expectBadRequest(await request("PATCH", "/notifications/not-a-uuid/read"));
    expectBadRequest(await request("POST", "/notifications/system", { title: "Aviso" }, coordinatorToken));
    expectBadRequest(await request("POST", "/notifications/system", { title: "", message: "Aviso" }, coordinatorToken));
    expectBadRequest(await request("POST", "/notifications/system", { title: "t".repeat(161), message: "Aviso" }, coordinatorToken));
    expectBadRequest(await request("POST", "/notifications/system", { title: "Aviso", message: "m".repeat(1201) }, coordinatorToken));
    expectBadRequest(await request("POST", "/notifications/system", { title: "Aviso", message: "Aviso", recipientUserId: "bad" }, coordinatorToken));
    expectBadRequest(await request("POST", "/notifications/system", { title: "Aviso", message: "Aviso", recipientRole: "ADMIN" }, coordinatorToken));
    expectBadRequest(await request("POST", "/notifications/system", { title: "Aviso", message: "Aviso", recipientUserId: uuid, recipientRole: "COMPANY" }, coordinatorToken));
    expectBadRequest(await request("POST", "/notifications/system", { title: "Aviso", message: "Aviso", extra: true }, coordinatorToken));
    expect(mocks.notification.markAsRead).not.toHaveBeenCalled();
    expect(mocks.notification.markAllAsRead).not.toHaveBeenCalled();
    expect(mocks.notification.createSystemNotification).not.toHaveBeenCalled();
  });
});