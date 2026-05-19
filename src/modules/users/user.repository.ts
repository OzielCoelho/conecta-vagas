import { prisma } from "../../shared/prisma/prisma.client";
import { CreateUserDTO, UpdateUserDTO } from "./user.dto";

export class UserRepository {
  async create(data: CreateUserDTO & { passwordHash: string }) {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        role: data.role,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateUserDTO) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }
}
