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

const app = Fastify({ logger: true });

app.register(fastifyCors, { origin: true });
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? "secret_dev",
});

app.register(userRoutes, { prefix: "/users" });
app.register(studentRoutes, { prefix: "/students" });
app.register(jobRoutes, { prefix: "/jobs" });
app.register(companyRoutes, { prefix: "/companies" });
app.register(applicationRoutes, { prefix: "/applications" });
app.register(notificationRoutes, { prefix: "/notifications" });

app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
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
