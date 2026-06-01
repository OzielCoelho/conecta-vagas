import bcrypt from "bcryptjs";
import { AppError } from "../../shared/errors/app.error";
import { CompanyService } from "../companies/company.service";
import { StudentService } from "../students/student.service";
import { UserRepository } from "./user.repository";
import { CreateUserDTO, LoginDTO, UpdatePasswordDTO, UpdateUserDTO } from "./user.dto";

const userRepository = new UserRepository();
const studentService = new StudentService();
const companyService = new CompanyService();

export class UserService {
  async create(data: CreateUserDTO) {
    const email = data.email.trim().toLowerCase();

    if (!email) {
      throw new AppError("Email obrigatório.", 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError("Email inválido.", 400);
    }

    if (!data.password || data.password.trim().length < 6) {
      throw new AppError("A senha deve ter pelo menos 6 caracteres.", 400);
    }

    const userExists = await userRepository.findByEmail(email);

    if (userExists) {
      throw new AppError("Email já cadastrado.", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 8);

    const user = await userRepository.create({ ...data, email, passwordHash });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: data.firstName?.trim() || undefined,
      lastName: data.lastName?.trim() || undefined,
    };
  }

  async login(data: LoginDTO) {
    const email = data.email.trim().toLowerCase();

    if (!email) {
      throw new AppError("Email obrigatório.", 400);
    }

    if (!data.password || data.password.trim().length === 0) {
      throw new AppError("Senha obrigatória.", 400);
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Email ou senha inválidos.", 401);
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new AppError("Email ou senha inválidos.", 401);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    const baseUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    if (user.role === "STUDENT") {
      try {
        const student = await studentService.findByUserId(user.id);
        const [firstName = student.name, ...rest] = student.name.split(" ").filter(Boolean);
        return {
          ...baseUser,
          name: student.name,
          displayName: student.name,
          avatarUrl: student.photoUrl ?? undefined,
          firstName,
          lastName: rest.join(" ") || undefined,
        };
      } catch {
        return baseUser;
      }
    }

    if (user.role === "COMPANY") {
      try {
        const company = await companyService.findByUserId(user.id);
        return {
          ...baseUser,
          name: company.name,
          displayName: company.tradeName || company.name || company.legalName || undefined,
          avatarUrl: company.logoUrl ?? undefined,
        };
      } catch {
        return baseUser;
      }
    }

    return baseUser;
  }

  async updateMe(userId: string, data: UpdateUserDTO) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    if (!data.email || !data.email.trim()) {
      throw new AppError("Email obrigatório.", 400);
    }

    const email = data.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError("Email inválido.", 400);
    }

    const userWithEmail = await userRepository.findByEmail(email);

    if (userWithEmail && userWithEmail.id !== userId) {
      throw new AppError("Email já cadastrado.", 409);
    }

    const updatedUser = await userRepository.update(userId, { email });

    const response = await this.getMe(updatedUser.id);
    return response;
  }

  async updatePassword(userId: string, data: UpdatePasswordDTO) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    if (!data.currentPassword || data.currentPassword.trim().length === 0) {
      throw new AppError("Senha atual obrigatória.", 400);
    }

    if (!data.newPassword || data.newPassword.trim().length < 6) {
      throw new AppError("A nova senha deve ter pelo menos 6 caracteres.", 400);
    }

    const passwordMatch = await bcrypt.compare(data.currentPassword, user.password);

    if (!passwordMatch) {
      throw new AppError("Senha atual incorreta.", 401);
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 8);
    await userRepository.updatePassword(userId, passwordHash);
  }
}
