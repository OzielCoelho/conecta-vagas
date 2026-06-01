import { Prisma, Role } from "../../generated/prisma";
import { prisma } from "../../shared/prisma/prisma.client";

export class NotificationRepository {
  async create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({
      data,
    });
  }

  async createMany(data: Prisma.NotificationUncheckedCreateInput[]) {
    return prisma.notification.createMany({
      data,
    });
  }

  async findManyByUserId(userId: string, limit: number) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async countUnreadByUserId(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async findByIdForUser(id: string, userId: string) {
    return prisma.notification.findFirst({
      where: { id, userId },
    });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async findUsersByRole(role: Role) {
    return prisma.user.findMany({
      where: { role },
      select: { id: true },
    });
  }
}
