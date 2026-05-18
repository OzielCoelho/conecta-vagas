import { apiPost } from "./api";
import type { AuthUser } from "../auth/auth-storage";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  role: "STUDENT" | "COMPANY";
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

type RegisterResponse = {
  id: string;
  email: string;
  role: AuthUser["role"];
};

export function loginUser(data: LoginInput) {
  return apiPost<LoginResponse>("/users/login", data);
}

export function registerUser(data: RegisterInput) {
  return apiPost<RegisterResponse>("/users/register", data);
}
