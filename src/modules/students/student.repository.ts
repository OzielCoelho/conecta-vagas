import { prisma } from "../../shared/prisma/prisma.client";
import { CreateStudentDTO, UpdateStudentDTO } from "./student.dto";

export const publicStudentProfileSelect = {
  id: true,
  name: true,
  course: true,
  skills: true,
  availability: true,
  headline: true,
  summary: true,
  city: true,
  state: true,
  semester: true,
  university: true,
  portfolio: true,
  photoUrl: true,
} as const;

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
      select: publicStudentProfileSelect,
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