import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/middlewares/auth.middleware";
import { NotificationController } from "./notification.controller";
import { emptyQuerySchema, uuidSchema } from "../../shared/schemas/request.schema";

const notificationController = new NotificationController();
const listNotificationsSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: { limit: { type: "integer", minimum: 1, maximum: 50 } },
  },
} as const;
const notificationIdSchema = {
  params: { type: "object", required: ["id"], additionalProperties: false, properties: { id: uuidSchema } },
  querystring: emptyQuerySchema,
} as const;
const createSystemNotificationSchema = {
  body: {
    type: "object",
    required: ["title", "message"],
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 1, maxLength: 160 },
      message: { type: "string", minLength: 1, maxLength: 1200 },
      linkUrl: { type: "string", maxLength: 500 },
      recipientUserId: uuidSchema,
      recipientRole: { type: "string", enum: ["STUDENT", "COMPANY", "COORDINATOR"] },
    },
    not: { required: ["recipientUserId", "recipientRole"] },
  },
  querystring: emptyQuerySchema,
} as const;

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: authenticate(["STUDENT", "COMPANY", "COORDINATOR"]), schema: listNotificationsSchema }, notificationController.list.bind(notificationController));
  app.patch("/read-all", { preHandler: authenticate(["STUDENT", "COMPANY", "COORDINATOR"]), schema: { querystring: emptyQuerySchema } }, notificationController.markAllAsRead.bind(notificationController));
  app.patch("/:id/read", { preHandler: authenticate(["STUDENT", "COMPANY", "COORDINATOR"]), schema: notificationIdSchema }, notificationController.markAsRead.bind(notificationController));
  app.post("/system", { preHandler: authenticate(["COORDINATOR"]), schema: createSystemNotificationSchema }, notificationController.createSystem.bind(notificationController));
}
