import { FastifyInstance } from "fastify";
import { JobController } from "./job.controller";
import { authenticate } from "../../shared/middlewares/auth.middleware";
import { emptyQuerySchema, uuidSchema } from "../../shared/schemas/request.schema";

const jobController = new JobController();
const jobBodyProperties = {
  title: { type: "string", minLength: 3, maxLength: 160 },
  description: { type: "string", minLength: 1, maxLength: 5000 },
  skills: {
    type: "array",
    minItems: 1,
    maxItems: 30,
    items: { type: "string", minLength: 1, maxLength: 80 },
  },
  model: { type: "string", enum: ["REMOTE", "IN_PERSON", "HYBRID"] },
  location: { type: "string", minLength: 1, maxLength: 160 },
  course: { type: "string", minLength: 1, maxLength: 160 },
  availability: { type: "string", enum: ["MANHA", "TARDE", "NOITE"] },
  isActive: { type: "boolean" },
} as const;

const createJobSchema = {
  body: {
    type: "object",
    required: ["title", "description", "skills", "model"],
    additionalProperties: false,
    properties: jobBodyProperties,
  },
  querystring: emptyQuerySchema,
} as const;

const updateJobSchema = {
  params: { type: "object", required: ["id"], additionalProperties: false, properties: { id: uuidSchema } },
  body: {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: jobBodyProperties,
  },
  querystring: emptyQuerySchema,
} as const;

const jobIdSchema = {
  params: { type: "object", required: ["id"], additionalProperties: false, properties: { id: uuidSchema } },
  querystring: emptyQuerySchema,
} as const;

export async function jobRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: authenticate(["COMPANY"]), schema: createJobSchema }, jobController.create.bind(jobController));
  app.get("/", { preHandler: authenticate(["STUDENT", "COORDINATOR", "COMPANY"]), schema: { querystring: emptyQuerySchema } }, jobController.getAll.bind(jobController));
  app.get("/mine", { preHandler: authenticate(["COMPANY"]), schema: { querystring: emptyQuerySchema } }, jobController.getMine.bind(jobController));
  app.get("/recommended", { preHandler: authenticate(["STUDENT"]), schema: { querystring: emptyQuerySchema } }, jobController.getRecommended.bind(jobController));
  app.get("/:id", { preHandler: authenticate(["STUDENT", "COORDINATOR", "COMPANY"]), schema: jobIdSchema }, jobController.getById.bind(jobController));
  app.put("/:id", { preHandler: authenticate(["COMPANY", "COORDINATOR"]), schema: updateJobSchema }, jobController.update.bind(jobController));
}
