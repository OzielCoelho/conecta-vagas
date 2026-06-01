import { apiGet, apiPatch, apiPost } from "./api";

export type NotificationCategory = "APPLICATION" | "JOB" | "PROFILE" | "SYSTEM";
export type NotificationType =
  | "APPLICATION_CREATED"
  | "APPLICATION_STATUS_UPDATED"
  | "JOB_CREATED"
  | "JOB_UPDATED"
  | "PROFILE_CREATED"
  | "PROFILE_UPDATED"
  | "SYSTEM";

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type NotificationsResponse = {
  items: NotificationItem[];
  unreadCount: number;
};

export type CreateSystemNotificationInput = {
  title: string;
  message: string;
  linkUrl?: string;
  recipientUserId?: string;
  recipientRole?: "STUDENT" | "COMPANY" | "COORDINATOR";
};

export function getNotifications(token: string, limit = 20) {
  return apiGet<NotificationsResponse>(`/notifications?limit=${limit}`, token);
}

export function markNotificationAsRead(id: string, token: string) {
  return apiPatch<NotificationItem>(`/notifications/${id}/read`, undefined, token);
}

export function markAllNotificationsAsRead(token: string) {
  return apiPatch<{ updatedCount: number }>("/notifications/read-all", undefined, token);
}

export function createSystemNotification(input: CreateSystemNotificationInput, token: string) {
  return apiPost<{ createdCount: number }>("/notifications/system", input, token);
}
