import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";

const recommend = vi.hoisted(() => vi.fn());

vi.mock("../modules/match/match.service", () => ({
  MatchService: class {
    getRecommendedJobsForStudent = recommend;
  },
}));

import { jobRoutes } from "../modules/jobs/job.routes";

describe("GET /jobs/recommended", () => {
  let app: FastifyInstance;
  let studentToken: string;
  let companyToken: string;

  beforeEach(async () => {
    vi.resetAllMocks();
    recommend.mockResolvedValue([]);
    app = Fastify({ ajv: { customOptions: { removeAdditional: false } } });
    await app.register(jwt, { secret: "recommendations_test_secret" });
    await app.register(jobRoutes, { prefix: "/jobs" });
    studentToken = app.jwt.sign({ id: "student-user", role: "STUDENT" });
    companyToken = app.jwt.sign({ id: "company-user", role: "COMPANY" });
  });

  afterEach(async () => {
    await app.close();
  });

  it("usa somente a identidade do token e retorna a coleção", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/jobs/recommended",
      headers: { authorization: "Bearer " + studentToken },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
    expect(recommend).toHaveBeenCalledWith("student-user");
  });

  it("impede empresas e identificadores fornecidos na query", async () => {
    const forbidden = await app.inject({
      method: "GET",
      url: "/jobs/recommended",
      headers: { authorization: "Bearer " + companyToken },
    });
    expect(forbidden.statusCode).toBe(403);
    expect(recommend).not.toHaveBeenCalled();

    const invalidQuery = await app.inject({
      method: "GET",
      url: "/jobs/recommended?studentId=other-student",
      headers: { authorization: "Bearer " + studentToken },
    });
    expect(invalidQuery.statusCode).toBe(400);
    expect(recommend).not.toHaveBeenCalled();
  });
});
