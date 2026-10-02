import { FastifyInstance } from "fastify";
import { ApplicationController } from "./application.controller";
import { authenticate } from "../../shared/middlewares/auth.middleware";
import { generateApplicationsCSV } from "./application.export";
import { emptyQuerySchema, uuidSchema } from "../../shared/schemas/request.schema";

const applicationController = new ApplicationController();
const createApplicationSchema = {
  body: {
    type: "object",
    required: ["jobId"],
    additionalProperties: false,
    properties: { jobId: uuidSchema },
  },
  querystring: emptyQuerySchema,
} as const;
const jobApplicationsSchema = {
  params: { type: "object", required: ["jobId"], additionalProperties: false, properties: { jobId: uuidSchema } },
  querystring: emptyQuerySchema,
} as const;
const updateApplicationStatusSchema = {
  params: { type: "object", required: ["id"], additionalProperties: false, properties: { id: uuidSchema } },
  body: {
    type: "object",
    required: ["status"],
    additionalProperties: false,
    properties: { status: { type: "string", enum: ["SENT", "UNDER_REVIEW", "INTERVIEW", "APPROVED", "REJECTED"] } },
  },
  querystring: emptyQuerySchema,
} as const;

export async function applicationRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: authenticate(["STUDENT"]), schema: createApplicationSchema }, applicationController.create.bind(applicationController));
  app.get("/me", { preHandler: authenticate(["STUDENT"]), schema: { querystring: emptyQuerySchema } }, applicationController.getMyApplications.bind(applicationController));
  app.get("/job/:jobId", { preHandler: authenticate(["COMPANY", "COORDINATOR"]), schema: jobApplicationsSchema }, applicationController.getByJob.bind(applicationController));
  app.patch("/:id/status", { preHandler: authenticate(["COMPANY", "COORDINATOR"]), schema: updateApplicationStatusSchema }, applicationController.updateStatus.bind(applicationController));

  app.get("/export/csv", { preHandler: authenticate(["COORDINATOR"]), schema: { querystring: emptyQuerySchema } }, async (request, reply) => {
    const csv = await generateApplicationsCSV();

    return reply
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", "attachment; filename=candidaturas.csv")
      .send(csv);
  });
}