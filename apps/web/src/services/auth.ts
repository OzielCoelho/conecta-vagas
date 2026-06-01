import { apiGet, apiPatch, apiPost } from "./api";
import type { AuthUser } from "../auth/auth-storage";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  role: "STUDENT" | "COMPANY";
  firstName?: string;
  lastName?: string;
};

export type UpdateAccountInput = {
  email: string;
};

export type UpdatePasswordInput = {
  currentPassword: string;
  newPassword: string;
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

export function getCurrentUser(token: string) {
  return apiGet<AuthUser>("/users/me", token);
}

export function updateCurrentUser(data: UpdateAccountInput, token: string) {
  return apiPatch<AuthUser>("/users/me", data, token);
}

export function updateCurrentUserPassword(data: UpdatePasswordInput, token: string) {
  return apiPatch<void>("/users/password", data, token);
}
