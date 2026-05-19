import { Role } from "../../generated/prisma";

export interface CreateUserDTO {
  email: string;
  password: string;
  role: Role;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  email?: string;
}

export interface UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;
}
