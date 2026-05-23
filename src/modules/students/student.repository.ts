import { prisma } from "../../shared/prisma/prisma.client";
import { CreateStudentDTO, UpdateStudentDTO } from "./student.dto";

export class StudentRepository {
  async create(data: CreateStudentDTO) {
    return prisma.student.create({
      data,
    });
  }

  async findByUserId(userId: string) {
    return prisma.student.findUnique({
      where: { userId },
    });
  }

  async findById(id: string) {
    return prisma.student.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return prisma.student.findMany({
      where: { isVisible: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async update(id: string, data: UpdateStudentDTO) {
    return prisma.student.update({
      where: { id },
      data,
    });
  }
}