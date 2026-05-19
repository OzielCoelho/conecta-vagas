import { prisma } from "../../shared/prisma/prisma.client";
import { CreateApplicationDTO, UpdateApplicationStatusDTO } from "./application.dto";

export class ApplicationRepository {
  async create(data: CreateApplicationDTO) {
    return prisma.application.create({
      data,
    });
  }

  async findByStudentAndJob(studentId: string, jobId: string) {
    return prisma.application.findUnique({
      where: {
        studentId_jobId: { studentId, jobId },
      },
    });
  }

  async findByJobId(jobId: string) {
    return prisma.application.findMany({
      where: { jobId },
      include: { student: true },
      orderBy: { score: "desc" },
    });
  }

  async findByStudentId(studentId: string) {
    return prisma.application.findMany({
      where: { studentId },
      include: { job: true },
    });
  }

  async findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
        student: true,
        job: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, data: UpdateApplicationStatusDTO) {
    return prisma.application.update({
      where: { id },
      data,
    });
  }
}
