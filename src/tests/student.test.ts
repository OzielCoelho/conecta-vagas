import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { AppError } from "../shared/errors/app.error";

const mocks = vi.hoisted(() => ({ findById: vi.fn(), update: vi.fn(), updated: vi.fn() }));
vi.mock("../modules/students/student.repository", () => ({
  StudentRepository: class {
    findById = mocks.findById;
    update = mocks.update;
  },
}));
vi.mock("../modules/notifications/notification.service", () => ({
  NotificationService: class {
    notifyStudentProfileUpdated = mocks.updated;
  },
}));
import { studentRoutes } from "../modules/students/student.routes";

let app: FastifyInstance;
let token: string;
const current = { id: "student-1", userId: "user-1", name: "Ana", course: "Computação", skills: ["TypeScript"], availability: ["MANHA"] };

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.findById.mockResolvedValue(current);
  mocks.update.mockImplementation(async (_id, data) => ({ ...current, ...data }));
  app = Fastify();
  await app.register(jwt, { secret: "student_test_only_secret" });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    return reply.status(500).send({ message: "Erro interno do servidor." });
  });
  await app.register(studentRoutes, { prefix: "/students" });
  token = app.jwt.sign({ id: current.userId, role: "STUDENT" });
});

afterEach(async () => { await app.close(); });

function updateProfile(requestToken = token, payload: object = { headline: "Estágio em desenvolvimento" }) {
  return app.inject({
    method: "PUT",
    url: `/students/${current.id}`,
    headers: { authorization: `Bearer ${requestToken}` },
    payload,
  });
}

describe("Student profile authorization", () => {
  it("allows the owner to update their profile", async () => {
    const response = await updateProfile();
    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(current.id, { headline: "Estágio em desenvolvimento" });
    expect(mocks.updated).toHaveBeenCalledOnce();
  });

  it("denies a different student without changing the profile", async () => {
    const otherStudentToken = app.jwt.sign({ id: "user-2", role: "STUDENT" });
    const response = await updateProfile(otherStudentToken, {
      headline: "Estágio em desenvolvimento",
      userId: current.userId,
      role: "COORDINATOR",
    });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ message: "Acesso negado." });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.updated).not.toHaveBeenCalled();
  });

  it("preserves coordinator access to update student profiles", async () => {
    const coordinatorToken = app.jwt.sign({ id: "coordinator-1", role: "COORDINATOR" });
    expect((await updateProfile(coordinatorToken)).statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("requires a valid token", async () => {
    const response = await app.inject({ method: "PUT", url: `/students/${current.id}`, payload: { headline: "Alteração" } });
    expect(response.statusCode).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.updated).not.toHaveBeenCalled();
  });

  it("rejects invalid tokens and identity fields supplied in the body", async () => {
    const invalidTokenResponse = await updateProfile(`${token}invalid`);
    expect(invalidTokenResponse.statusCode).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.updated).not.toHaveBeenCalled();

  });
});