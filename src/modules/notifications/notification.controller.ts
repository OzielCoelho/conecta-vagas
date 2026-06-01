import { FastifyReply, FastifyRequest } from "fastify";
import { CreateSystemNotificationDTO, ListNotificationsQueryDTO } from "./notification.dto";
import { NotificationService } from "./notification.service";

const notificationService = new NotificationService();

export class NotificationController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { limit } = request.query as ListNotificationsQueryDTO;
    const notifications = await notificationService.listForUser(request.user.id, Number(limit) || 20);

    return reply.send(notifications);
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const notification = await notificationService.markAsRead(request.user.id, id);

    return reply.send(notification);
  }

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    const result = await notificationService.markAllAsRead(request.user.id);

    return reply.send(result);
  }

  async createSystem(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as CreateSystemNotificationDTO;
    const result = await notificationService.createSystemNotification(data, request.user.id);

    return reply.status(201).send(result);
  }
}
