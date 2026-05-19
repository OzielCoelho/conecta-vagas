import { ApplicationStatus } from "../../generated/prisma";
import { AppError } from "../../shared/errors/app.error";
import { JobRepository } from "../jobs/job.repository";
import { MatchService } from "../match/match.service";
import { NotificationService } from "../notifications/notification.service";
import { StudentRepository } from "../students/student.repository";
import { CreateApplicationDTO, UpdateApplicationStatusDTO } from "./application.dto";
import { ApplicationRepository } from "./application.repository";

const applicationRepository = new ApplicationRepository();
const studentRepository = new StudentRepository();
const jobRepository = new JobRepository();
const matchService = new MatchService();
const notificationService = new NotificationService();

const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  SENT: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

export class ApplicationService {
  async create(data: CreateApplicationDTO, actorUserId?: string) {
    const alreadyApplied = await applicationRepository.findByStudentAndJob(
      data.studentId,
      data.jobId
    );

    if (alreadyApplied) {
      throw new AppError("Você já se candidatou a esta vaga.", 409);
    }

    const [student, job] = await Promise.all([
      studentRepository.findById(data.studentId),
      jobRepository.findById(data.jobId),
    ]);

    if (!student) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    if (!job) {
      throw new AppError("Vaga não encontrada.", 404);
    }

    const application = await applicationRepository.create(data);
    const applicationWithScore = await matchService.calculateAndSaveScore(application.id);

    await notificationService.notifyApplicationCreated({
      applicationId: application.id,
      actorUserId,
      companyUserId: job.company.userId,
      jobTitle: job.title,
      studentName: student.name,
      studentUserId: student.userId,
    });

    return applicationWithScore ?? application;
  }

  async findByJobId(jobId: string) {
    return applicationRepository.findByJobId(jobId);
  }

  async findByStudentId(studentId: string) {
    return applicationRepository.findByStudentId(studentId);
  }

  async updateStatus(id: string, data: UpdateApplicationStatusDTO, actorUserId?: string) {
    const application = await applicationRepository.findById(id);

    if (!application) {
      throw new AppError("Candidatura não encontrada.", 404);
    }

    const allowed = validTransitions[application.status];
    if (!allowed.includes(data.status)) {
      throw new AppError(
        `Transição de "${application.status}" para "${data.status}" não é permitida.`,
        422
      );
    }

    const updatedApplication = await applicationRepository.updateStatus(id, data);

    await notificationService.notifyApplicationStatusUpdated({
      actorUserId,
      applicationId: application.id,
      companyName: application.job.company.name,
      jobTitle: application.job.title,
      status: data.status,
      studentUserId: application.student.userId,
    });

    return updatedApplication;
  }
}
