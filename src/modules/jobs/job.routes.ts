import { FastifyInstance } from "fastify";
import { JobController } from "./job.controller";
import { authenticate } from "../../shared/middlewares/auth.middleware";

const jobController = new JobController();

export async function jobRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: authenticate(["COMPANY"]) }, jobController.create.bind(jobController));
  app.get("/", { preHandler: authenticate(["STUDENT", "COORDINATOR", "COMPANY"]) }, jobController.getAll.bind(jobController));
  app.get("/mine", { preHandler: authenticate(["COMPANY"]) }, jobController.getMine.bind(jobController));
  app.get("/:id", { preHandler: authenticate(["STUDENT", "COORDINATOR", "COMPANY"]) }, jobController.getById.bind(jobController));
  app.put("/:id", { preHandler: authenticate(["COMPANY", "COORDINATOR"]) }, jobController.update.bind(jobController));
}
