import { AppError } from "../../shared/errors/app.error";
import { NotificationService } from "../notifications/notification.service";
import { CreateJobDTO, UpdateJobDTO } from "./job.dto";
import { JobRepository } from "./job.repository";

const jobRepository = new JobRepository();
const notificationService = new NotificationService();

export class JobService {
  async create(data: CreateJobDTO, actorUserId?: string) {
    const job = await jobRepository.create(data);

    await notificationService.notifyJobCreated({
      actorUserId,
      companyUserId: actorUserId ?? null,
      jobId: job.id,
      jobTitle: job.title,
    });

    return job;
  }

  async findById(id: string) {
    const job = await jobRepository.findById(id);

    if (!job) {
      throw new AppError("Vaga não encontrada.", 404);
    }

    return job;
  }

  async findAll() {
    return jobRepository.findAll();
  }

  async findByCompanyId(companyId: string) {
    return jobRepository.findByCompanyId(companyId);
  }

  async update(id: string, data: UpdateJobDTO, actorUserId?: string) {
    const job = await jobRepository.findById(id);

    if (!job) {
      throw new AppError("Vaga não encontrada.", 404);
    }

    const updatedJob = await jobRepository.update(id, data);

    await notificationService.notifyJobUpdated({
      actorUserId,
      companyUserId: job.company.userId,
      jobId: job.id,
      jobTitle: updatedJob.title,
    });

    return updatedJob;
  }
}
