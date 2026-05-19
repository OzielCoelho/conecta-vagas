import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/middlewares/auth.middleware";
import { NotificationController } from "./notification.controller";

const notificationController = new NotificationController();

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: authenticate(["STUDENT", "COMPANY", "COORDINATOR"]) }, notificationController.list.bind(notificationController));
  app.patch("/read-all", { preHandler: authenticate(["STUDENT", "COMPANY", "COORDINATOR"]) }, notificationController.markAllAsRead.bind(notificationController));
  app.patch("/:id/read", { preHandler: authenticate(["STUDENT", "COMPANY", "COORDINATOR"]) }, notificationController.markAsRead.bind(notificationController));
  app.post("/system", { preHandler: authenticate(["COORDINATOR"]) }, notificationController.createSystem.bind(notificationController));
}
