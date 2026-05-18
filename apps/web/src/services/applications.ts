import { apiGet, apiPost } from "./api";
import type { JobItem } from "./jobs";

export type ApplicationStatus = "SENT" | "UNDER_REVIEW" | "INTERVIEW" | "APPROVED" | "REJECTED";

export type StudentApplication = {
  id: string;
  status: ApplicationStatus;
  score: number;
  createdAt: string;
  updatedAt: string;
  job: JobItem;
};

export function getMyApplications(token: string) {
  return apiGet<StudentApplication[]>("/applications/me", token);
}

export function applyToJob(jobId: string, token: string) {
  return apiPost<StudentApplication>("/applications", { jobId }, token);
}

export function getApplicationStatusLabel(status: ApplicationStatus) {
  if (status === "SENT") return "Enviado";
  if (status === "UNDER_REVIEW") return "Em análise";
  if (status === "INTERVIEW") return "Entrevista";
  if (status === "APPROVED") return "Aprovado";
  return "Reprovado";
}

export function getApplicationStatusTone(status: ApplicationStatus) {
  if (status === "SENT") return "blue";
  if (status === "UNDER_REVIEW" || status === "INTERVIEW") return "amber";
  if (status === "APPROVED") return "green";
  return "red";
}
