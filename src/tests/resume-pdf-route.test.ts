import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";

const mocks = vi.hoisted(() => ({
  findByUserId: vi.fn(),
  update: vi.fn(),
  confirmResume: vi.fn(),
  notifyStudentProfileUpdated: vi.fn(),
}));

vi.mock("../modules/students/student.repository", () => ({
  StudentRepository: class {
    findByUserId = mocks.findByUserId;
    update = mocks.update;
  },
}));
vi.mock("../modules/notifications/notification.service", () => ({
  NotificationService: class {
    notifyStudentProfileUpdated = mocks.notifyStudentProfileUpdated;
    notifyStudentProfileCreated = vi.fn();
  },
}));

import { studentRoutes } from "../modules/students/student.routes";

let app: FastifyInstance;
let studentToken: string;
const student = {
  id: "student-1",
  userId: "user-1",
  name: "Ana Clara Souza",
  course: "Engenharia de Software",
  skills: ["TypeScript", "React"],
  availability: ["TARDE"],
  headline: "Desenvolvedora frontend",
  summary: "Estudante interessada em produtos digitais.",
  city: "Manaus",
  state: "AM",
};

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.findByUserId.mockResolvedValue(student);
  mocks.update.mockImplementation(async (_id, data) => ({ ...student, ...data }));
  app = Fastify();
  await app.register(jwt, { secret: "student_test_only_secret" });
  app.setErrorHandler((error, _request, reply) => {
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : 500;
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return reply.status(statusCode || 500).send({ message });
  });
  await app.register(studentRoutes, { prefix: "/students" });
  studentToken = app.jwt.sign({ id: student.userId, role: "STUDENT" });
});

afterEach(async () => { await app.close(); });

describe("resume profile confirmation and download", () => {
  it("confirms the profile without allowing administrative fields", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/students/resume/confirm",
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        ...student,
        isVisible: false,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(student.id, expect.not.objectContaining({ isVisible: false }));
  });

  it("downloads the authenticated student's profile as PDF", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/students/resume.pdf",
      headers: { authorization: `Bearer ${studentToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain("curriculo-ana-clara-souza.pdf");
    expect(response.rawPayload.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("requires authentication to download a resume", async () => {
    const response = await app.inject({ method: "GET", url: "/students/resume.pdf" });
    expect(response.statusCode).toBe(401);
    expect(mocks.findByUserId).not.toHaveBeenCalled();
  });
});
