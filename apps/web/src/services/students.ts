import { apiGet, apiPost, apiPut } from "./api";

export type StudentProfile = {
  id: string;
  name: string;
  course: string;
  skills: string[];
  availability: string;
  portfolio?: string | null;
  photoUrl?: string | null;
  isVisible?: boolean;
};

export type CreateStudentProfileInput = {
  name: string;
  course: string;
  skills: string[];
  availability: string;
  portfolio?: string;
  photoUrl?: string;
};

export function getMyStudentProfile(token: string) {
  return apiGet<StudentProfile>("/students/me", token);
}

export function getStudents(token: string) {
  return apiGet<StudentProfile[]>("/students", token);
}

export function createStudentProfile(data: CreateStudentProfileInput, token: string) {
  return apiPost<StudentProfile>("/students", data, token);
}

export function updateStudentProfile(id: string, data: CreateStudentProfileInput, token: string) {
  return apiPut<StudentProfile>(`/students/${id}`, data, token);
}
