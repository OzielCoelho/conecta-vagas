import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { userRoutes } from "./modules/users/user.routes";
import { studentRoutes } from "./modules/students/student.routes";
import { jobRoutes } from "./modules/jobs/job.routes";
import { companyRoutes } from "./modules/companies/company.routes";
import { applicationRoutes } from "./modules/applications/application.routes";
import { notificationRoutes } from "./modules/notifications/notification.routes";
import { AppError } from "./shared/errors/app.error";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET não configurado.");
}

const app = Fastify({
  logger: true,
  bodyLimit: 4 * 1024 * 1024,
});

app.register(fastifyCors, { origin: true });
app.register(fastifyJwt, {
  secret: jwtSecret,
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
    return reply.status(400).send({ message: error.message });
  }

  if (isBodyTooLargeError(error)) {
    return reply.status(413).send({ message: "A imagem enviada é muito grande. Tente uma imagem menor." });
  }

  app.log.error(error);

  return reply.status(500).send({ message: "Erro interno do servidor." });
});

app.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3333;
    await app.listen({ port, host: "0.0.0.0" });
    console.log("🚀 Server running at http://localhost:3333");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
