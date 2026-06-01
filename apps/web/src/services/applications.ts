import { API_URL, apiGet, apiPatch, apiPost } from "./api";
import type { JobItem } from "./jobs";
import type { StudentProfile } from "./students";

export type ApplicationStatus = "SENT" | "UNDER_REVIEW" | "INTERVIEW" | "APPROVED" | "REJECTED";

export type StudentApplication = {
  id: string;
  status: ApplicationStatus;
  score: number;
  createdAt: string;
  updatedAt: string;
  job: JobItem;
};

export type CompanyApplication = {
  id: string;
  status: ApplicationStatus;
  score: number;
  createdAt: string;
  updatedAt: string;
  student: StudentProfile;
};

export function getMyApplications(token: string) {
  return apiGet<StudentApplication[]>("/applications/me", token);
}

export function getApplicationsByJob(jobId: string, token: string) {
  return apiGet<CompanyApplication[]>(`/applications/job/${jobId}`, token);
}

export function applyToJob(jobId: string, token: string) {
  return apiPost<StudentApplication>("/applications", { jobId }, token);
}

export function updateApplicationStatus(id: string, status: ApplicationStatus, token: string) {
  return apiPatch<{ id: string; status: ApplicationStatus }>(`/applications/${id}/status`, { status }, token);
}

export async function downloadApplicationsCSV(token: string) {
  const response = await fetch(`${API_URL}/applications/export/csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Não foi possível exportar os dados em CSV.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "candidaturas.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
