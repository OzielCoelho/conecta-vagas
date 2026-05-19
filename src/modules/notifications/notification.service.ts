import {
  ApplicationStatus,
  NotificationCategory,
  NotificationType,
  Prisma,
  Role,
} from "../../generated/prisma";
import { AppError } from "../../shared/errors/app.error";
import { CreateNotificationDTO, CreateSystemNotificationDTO } from "./notification.dto";
import { NotificationRepository } from "./notification.repository";

const notificationRepository = new NotificationRepository();

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  SENT: "Enviada",
  UNDER_REVIEW: "Em análise",
  INTERVIEW: "Entrevista",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

export class NotificationService {
  async listForUser(userId: string, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);

    const [items, unreadCount] = await Promise.all([
      notificationRepository.findManyByUserId(userId, take),
      notificationRepository.countUnreadByUserId(userId),
    ]);

    return { items, unreadCount };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await notificationRepository.findByIdForUser(id, userId);

    if (!notification) {
      throw new AppError("Notificação não encontrada.", 404);
    }

    if (notification.isRead) {
      return notification;
    }

    return notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    const result = await notificationRepository.markAllAsRead(userId);

    return {
      updatedCount: result.count,
    };
  }

  async createSystemNotification(data: CreateSystemNotificationDTO, actorUserId?: string) {
    if (data.recipientUserId) {
      await this.create({
        actorUserId,
        category: NotificationCategory.SYSTEM,
        entityType: "system",
        message: data.message,
        linkUrl: data.linkUrl,
        title: data.title,
        type: NotificationType.SYSTEM,
        userId: data.recipientUserId,
      });

      return { createdCount: 1 };
    }

    const recipientRole = data.recipientRole ?? Role.COORDINATOR;
    const users = await notificationRepository.findUsersByRole(recipientRole);

    if (!users.length) {
      return { createdCount: 0 };
    }

    await notificationRepository.createMany(
      users.map((user) =>
        this.buildCreateInput({
          actorUserId,
          category: NotificationCategory.SYSTEM,
          entityType: "system",
          message: data.message,
          linkUrl: data.linkUrl,
          title: data.title,
          type: NotificationType.SYSTEM,
          userId: user.id,
        })
      )
    );

    return { createdCount: users.length };
  }

  async notifyApplicationCreated(data: {
    applicationId: string;
    actorUserId?: string;
    companyUserId: string;
    jobTitle: string;
    studentName: string;
    studentUserId: string;
  }) {
    await Promise.all([
      this.create({
        actorUserId: data.actorUserId,
        category: NotificationCategory.APPLICATION,
        entityId: data.applicationId,
        entityType: "application",
        linkUrl: "/perfil/aluno/candidaturas",
        message: `Você se candidatou à vaga \"${data.jobTitle}\".`,
        title: "Candidatura enviada",
        type: NotificationType.APPLICATION_CREATED,
        userId: data.studentUserId,
      }),
      this.create({
        actorUserId: data.actorUserId,
        category: NotificationCategory.APPLICATION,
        entityId: data.applicationId,
        entityType: "application",
        linkUrl: "/empresa/candidatos",
        message: `${data.studentName} se candidatou à vaga \"${data.jobTitle}\".`,
        title: "Nova candidatura recebida",
        type: NotificationType.APPLICATION_CREATED,
        userId: data.companyUserId,
      }),
    ]);
  }

  async notifyApplicationStatusUpdated(data: {
    applicationId: string;
    actorUserId?: string;
    companyName: string;
    jobTitle: string;
    status: ApplicationStatus;
    studentUserId: string;
  }) {
    const statusLabel = applicationStatusLabels[data.status];

    await this.create({
      actorUserId: data.actorUserId,
      category: NotificationCategory.APPLICATION,
      entityId: data.applicationId,
      entityType: "application",
      linkUrl: "/perfil/aluno/candidaturas",
      message: `${data.companyName} atualizou sua candidatura para \"${data.jobTitle}\" para ${statusLabel}.`,
      title: "Status da candidatura atualizado",
      type: NotificationType.APPLICATION_STATUS_UPDATED,
      userId: data.studentUserId,
    });
  }

  async notifyJobCreated(data: {
    actorUserId?: string;
    companyUserId: string | null;
    jobId: string;
    jobTitle: string;
  }) {
    if (!data.companyUserId) {
      return;
    }

    await this.create({
      actorUserId: data.actorUserId,
      category: NotificationCategory.JOB,
      entityId: data.jobId,
      entityType: "job",
      linkUrl: "/vagas",
      message: `A vaga \"${data.jobTitle}\" foi publicada com sucesso.`,
      title: "Vaga criada",
      type: NotificationType.JOB_CREATED,
      userId: data.companyUserId,
    });
  }

  async notifyJobUpdated(data: {
    actorUserId?: string;
    companyUserId: string;
    jobId: string;
    jobTitle: string;
  }) {
    await this.create({
      actorUserId: data.actorUserId,
      category: NotificationCategory.JOB,
      entityId: data.jobId,
      entityType: "job",
      linkUrl: "/vagas",
      message: `A vaga \"${data.jobTitle}\" foi atualizada.`,
      title: "Vaga atualizada",
      type: NotificationType.JOB_UPDATED,
      userId: data.companyUserId,
    });
  }

  async notifyStudentProfileCreated(data: {
    actorUserId?: string;
    studentId: string;
    studentUserId: string;
  }) {
    await this.create({
      actorUserId: data.actorUserId,
      category: NotificationCategory.PROFILE,
      entityId: data.studentId,
      entityType: "student-profile",
      linkUrl: "/perfil/aluno",
      message: "Seu perfil de candidato foi criado com sucesso.",
      title: "Perfil criado",
      type: NotificationType.PROFILE_CREATED,
      userId: data.studentUserId,
    });
  }

  async notifyStudentProfileUpdated(data: {
    actorUserId?: string;
    studentId: string;
    studentUserId: string;
  }) {
    await this.create({
      actorUserId: data.actorUserId,
      category: NotificationCategory.PROFILE,
      entityId: data.studentId,
      entityType: "student-profile",
      linkUrl: "/perfil/aluno",
      message: "Seu perfil de candidato foi atualizado.",
      title: "Perfil atualizado",
      type: NotificationType.PROFILE_UPDATED,
      userId: data.studentUserId,
    });
  }

  async notifyCompanyProfileCreated(data: {
    actorUserId?: string;
    companyId: string;
    companyName: string;
    companyUserId: string;
  }) {
    await this.create({
      actorUserId: data.actorUserId,
      category: NotificationCategory.PROFILE,
      entityId: data.companyId,
      entityType: "company-profile",
      linkUrl: "/perfil/empresa",
      message: `O perfil da empresa \"${data.companyName}\" foi criado com sucesso.`,
      title: "Perfil criado",
      type: NotificationType.PROFILE_CREATED,
      userId: data.companyUserId,
    });
  }

  async notifyCompanyProfileUpdated(data: {
    actorUserId?: string;
    companyId: string;
    companyName: string;
    companyUserId: string;
  }) {
    await this.create({
      actorUserId: data.actorUserId,
      category: NotificationCategory.PROFILE,
      entityId: data.companyId,
      entityType: "company-profile",
      linkUrl: "/perfil/empresa",
      message: `O perfil da empresa \"${data.companyName}\" foi atualizado.`,
      title: "Perfil atualizado",
      type: NotificationType.PROFILE_UPDATED,
      userId: data.companyUserId,
    });
  }

  private async create(data: CreateNotificationDTO) {
    return notificationRepository.create(this.buildCreateInput(data));
  }

  private buildCreateInput(data: CreateNotificationDTO): Prisma.NotificationUncheckedCreateInput {
    return {
      actorUserId: data.actorUserId,
      category: data.category,
      entityId: data.entityId,
      entityType: data.entityType,
      linkUrl: data.linkUrl,
      message: data.message,
      metadata: data.metadata,
      title: data.title,
      type: data.type,
      userId: data.userId,
    };
  }
}
