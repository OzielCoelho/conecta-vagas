import { Prisma } from "../../generated/prisma";
import { AppError } from "../../shared/errors/app.error";
import { prisma } from "../../shared/prisma/prisma.client";
import { publicStudentProfileSelect } from "../students/student.repository";
import { CreateApplicationDTO, UpdateApplicationStatusDTO } from "./application.dto";

export class ApplicationRepository {
  async create(data: CreateApplicationDTO) {
    try {
      return await prisma.$transaction(async (transaction) => {
        // Serialize with updates of this job until the application is persisted.
        const jobs = await transaction.$queryRaw<{ isActive: boolean }[]>`
          SELECT "isActive" FROM "Job" WHERE "id" = ${data.jobId} FOR UPDATE
        `;
        if (!jobs[0]) throw new AppError("Vaga não encontrada.", 404);
        if (!jobs[0].isActive) {
          throw new AppError("Esta vaga não está mais disponível para candidaturas.", 409);
        }
        return transaction.application.create({ data });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Você já se candidatou a esta vaga.", 409);
      }
      throw error;
    }
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
      include: { student: { select: publicStudentProfileSelect } },
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
