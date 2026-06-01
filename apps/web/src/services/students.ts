import { apiGet, apiPost, apiPut } from "./api";

export type AvailabilityOption = "MANHA" | "TARDE" | "NOITE";

export type StudentProfile = {
  id: string;
  name: string;
  course: string;
  skills: string[];
  availability: AvailabilityOption[];
  headline?: string | null;
  summary?: string | null;
  city?: string | null;
  state?: string | null;
  semester?: string | null;
  university?: string | null;
  cr?: string | null;
  portfolio?: string | null;
  photoUrl?: string | null;
  isVisible?: boolean;
};

export type CreateStudentProfileInput = {
  name: string;
  course: string;
  skills: string[];
  availability: AvailabilityOption[];
  headline?: string;
  summary?: string;
  city?: string;
  state?: string;
  semester?: string;
  university?: string;
  cr?: string;
  portfolio?: string;
  photoUrl?: string;
};

export const availabilityOptions: Array<{ value: AvailabilityOption; label: string }> = [
  { value: "MANHA", label: "Manhã" },
  { value: "TARDE", label: "Tarde" },
  { value: "NOITE", label: "Noite" },
];

export function formatAvailabilityList(availability: AvailabilityOption[]) {
  if (!availability.length) return "Disponibilidade não informada";

  return availabilityOptions
    .filter((option) => availability.includes(option.value))
    .map((option) => option.label)
    .join(", ");
}

export function getMyStudentProfile(token: string) {
  return apiGet<StudentProfile>("/students/me", token);
}

export function getStudents(token: string) {
  return apiGet<StudentProfile[]>("/students", token);
}

export function createStudentProfile(data: CreateStudentProfileInput, token: string) {
  return apiPost<StudentProfile>("/students", data, token);
}

export function updateStudentProfile(id: string, data: Partial<CreateStudentProfileInput>, token: string) {
  return apiPut<StudentProfile>(`/students/${id}`, data, token);
}
