import { prisma } from "../../shared/prisma/prisma.client";
import { CreateJobDTO, UpdateJobDTO } from "./job.dto";

export class JobRepository {
  async create(data: CreateJobDTO) {
    return prisma.job.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });
  }

  async findAll(filters?: { model?: any; course?: string }) {
    return prisma.job.findMany({
      where: {
        isActive: true, 
        model: filters?.model,   
        course: filters?.course, 
      },
      include: { company: true },
    });
  }

  async findByCompanyId(companyId: string) {
    return prisma.job.findMany({
      where: { companyId },
      include: { company: true },
    });
  }

  async update(id: string, data: UpdateJobDTO) {
    return prisma.job.update({
      where: { id },
      data,
    });
  }
}