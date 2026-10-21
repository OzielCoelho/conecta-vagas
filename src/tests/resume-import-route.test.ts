import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyMultipart from "@fastify/multipart";
import jwt from "@fastify/jwt";
import { AppError } from "../shared/errors/app.error";
import { studentRoutes } from "../modules/students/student.routes";

describe("resume import authorization", () => {
  let app: FastifyInstance;
  let studentToken: string;
  let companyToken: string;

  beforeEach(async () => {
    app = Fastify();
    await app.register(fastifyMultipart, { limits: { files: 1, fileSize: 5 * 1024 * 1024 } });
    await app.register(jwt, { secret: "resume_import_test_secret" });
    app.setErrorHandler((error, _request, reply) => {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      if (error && typeof error === "object" && "code" in error && error.code === "FST_INVALID_MULTIPART_CONTENT_TYPE") {
        return reply.status(400).send({ message: "Envie um arquivo PDF de curriculo." });
      }
      return reply.status(500).send({ message: "Erro interno do servidor." });
    });
    await app.register(studentRoutes, { prefix: "/students" });
    studentToken = app.jwt.sign({ id: "student-user", role: "STUDENT" });
    companyToken = app.jwt.sign({ id: "company-user", role: "COMPANY" });
  });

  afterEach(async () => {
    await app.close();
  });

  it("requires authentication", async () => {
    const response = await app.inject({ method: "POST", url: "/students/resume/import" });
    expect(response.statusCode).toBe(401);
  });

  it("rejects non-student users", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/students/resume/import",
      headers: { authorization: "Bearer " + companyToken },
    });
    expect(response.statusCode).toBe(403);
  });

  it("requires a file for an authenticated student", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/students/resume/import",
      headers: { authorization: "Bearer " + studentToken },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "Envie um arquivo PDF de curriculo." });
  });
});
