import { prisma } from "../../shared/prisma/prisma.client";
import { CreateCompanyRecord, UpdateCompanyRecord } from "./company.dto";

export class CompanyRepository {
  async create(data: CreateCompanyRecord) {
    return prisma.company.create({
      data,
    });
  }

  async findByUserId(userId: string) {
    return prisma.company.findUnique({
      where: { userId },
    });
  }

  async findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateCompanyRecord) {
    return prisma.company.update({
      where: { id },
      data,
    });
  }
}