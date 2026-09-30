import { prisma } from "../../shared/prisma/prisma.client";
import { publicCompanyProfileSelect } from "../companies/company.repository";
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
      include: { company: { select: publicCompanyProfileSelect } },
    });
  }

  async findByIdForNotification(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: { company: { select: { ...publicCompanyProfileSelect, userId: true } } },
    });
  }

  async findAll() {
    return prisma.job.findMany({
      where: { isActive: true },
      include: { company: { select: publicCompanyProfileSelect } },
    });
  }

  async findByCompanyId(companyId: string) {
    return prisma.job.findMany({
      where: { companyId },
      include: { company: { select: publicCompanyProfileSelect } },
    });
  }

  async update(id: string, data: UpdateJobDTO) {
    return prisma.job.update({
      where: { id },
      data,
    });
  }
}