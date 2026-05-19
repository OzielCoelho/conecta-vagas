import { NotificationCategory, NotificationType, Role } from "../../generated/prisma";

export interface ListNotificationsQueryDTO {
  limit?: number;
}

export interface MarkNotificationAsReadDTO {
  id: string;
}

export interface CreateSystemNotificationDTO {
  title: string;
  message: string;
  linkUrl?: string;
  recipientUserId?: string;
  recipientRole?: Role;
}

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  linkUrl?: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}
