import { AppError } from "../../shared/errors/app.error";
import { JobRepository } from "./job.repository";
import { CreateJobDTO, UpdateJobDTO } from "./job.dto";

const jobRepository = new JobRepository();

export class JobService {
  async create(data: CreateJobDTO) {
    return jobRepository.create(data);
  }

  async findById(id: string) {
    const job = await jobRepository.findById(id);

    if (!job) {
      throw new AppError("Vaga não encontrada.", 404);
    }

    return job;
  }

  async findAll(filters?: { model?: string; course?: string }) {
    return jobRepository.findAll(filters);
  }

  async findByCompanyId(companyId: string) {
    return jobRepository.findByCompanyId(companyId);
  }

  async update(id: string, data: UpdateJobDTO) {
    const job = await jobRepository.findById(id);

    if (!job) {
      throw new AppError("Vaga não encontrada.", 404);
    }

    return jobRepository.update(id, data);
  }
}