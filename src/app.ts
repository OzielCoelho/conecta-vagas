import "dotenv/config";
import Fastify, { FastifyServerOptions } from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { userRoutes } from "./modules/users/user.routes";
import { studentRoutes } from "./modules/students/student.routes";
import { jobRoutes } from "./modules/jobs/job.routes";
import { companyRoutes } from "./modules/companies/company.routes";
import { applicationRoutes } from "./modules/applications/application.routes";
import { notificationRoutes } from "./modules/notifications/notification.routes";
import { AppError } from "./shared/errors/app.error";

import rateLimit from "@fastify/rate-limit";
import { readSecurityConfig } from "./shared/config/security.config";
export function buildApp(options: { env?: NodeJS.ProcessEnv; logger?: FastifyServerOptions["logger"] } = {}) {
  const security = readSecurityConfig(options.env);
  const app = Fastify({
    logger: options.logger === false ? false : {
      redact: ["req.headers.authorization", "req.headers.cookie", "res.headers[\"set-cookie\"]"],
      ...(typeof options.logger === "object" ? options.logger : {}),
      serializers: {
        req(request) { return { method: request.method, url: request.url?.split("?")[0], remoteAddress: request.ip }; },
      },
    },
    bodyLimit: 4 * 1024 * 1024,
    ajv: { customOptions: { removeAdditional: false } },
  });

  app.register(fastifyCors, {
    origin(origin, callback) {
      if (!origin || security.origins.includes(origin)) return callback(null, true);
      callback(new AppError("Origem não permitida.", 403), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  app.register(fastifyJwt, {
    secret: security.jwtSecret,
    sign: { expiresIn: security.jwtTtlSeconds, algorithm: "HS256" },
    verify: { algorithms: ["HS256"], requiredClaims: ["exp", "id", "role"] },
  });
  app.register(rateLimit, {
    global: false,
    max: security.authRateLimitMax,
    timeWindow: security.authRateLimitWindowMs,
    errorResponseBuilder: () => new AppError("Muitas tentativas. Aguarde e tente novamente.", 429),
  });

  app.register(userRoutes, { prefix: "/users" });
  app.register(studentRoutes, { prefix: "/students" });
  app.register(jobRoutes, { prefix: "/jobs" });
  app.register(companyRoutes, { prefix: "/companies" });
  app.register(applicationRoutes, { prefix: "/applications" });
  app.register(notificationRoutes, { prefix: "/notifications" });

  function isValidationError(error: unknown): error is Error & { validation: unknown[] } {
    return (
      typeof error === "object" &&
      error !== null &&
      "validation" in error &&
      Array.isArray((error as { validation?: unknown }).validation)
    );
  }

  function isBodyTooLargeError(error: unknown): error is Error & { code: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "FST_ERR_CTP_BODY_TOO_LARGE"
    );
  }

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }

    if (isValidationError(error) && error.validation.length > 0) {
      return reply.status(400).send({ message: "Dados da requisição inválidos." });
    }

    if (isBodyTooLargeError(error)) {
      return reply.status(413).send({ message: "A imagem enviada é muito grande. Tente uma imagem menor." });
    }

    // Do not serialize exception messages/stacks: ORM errors can contain user input.
    request.log.error("Falha interna ao processar requisição.");

    return reply.status(500).send({ message: "Erro interno do servidor." });
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
