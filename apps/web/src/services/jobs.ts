import { apiGet } from "./api";
import type { StudentProfile } from "./students";

export type JobModel = "REMOTE" | "IN_PERSON" | "HYBRID";

export type JobItem = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  model: JobModel;
  location?: string | null;
  course?: string | null;
  availability?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  company?: {
    id: string;
    name: string;
    about?: string | null;
  };
};

export function getJobs(token: string) {
  return apiGet<JobItem[]>("/jobs", token);
}

export function getJobById(id: string, token: string) {
  return apiGet<JobItem>(`/jobs/${id}`, token);
}

export function getJobModelLabel(model: JobModel) {
  if (model === "REMOTE") return "Remoto";
  if (model === "HYBRID") return "Híbrido";
  return "Presencial";
}

export function estimateJobMatch(student: StudentProfile, job: JobItem) {
  let score = 0;

  const matchedSkills = student.skills.filter((skill) =>
    job.skills.map((item) => item.toLowerCase()).includes(skill.toLowerCase())
  );

  if (job.skills.length > 0) {
    score += (matchedSkills.length / job.skills.length) * 60;
  }

  if (job.course && student.course.toLowerCase() === job.course.toLowerCase()) {
    score += 25;
  }

  if (job.availability && student.availability.toLowerCase() === job.availability.toLowerCase()) {
    score += 15;
  }

  return Math.round(score);
}

export function buildMatchJustification(student: StudentProfile, job: JobItem) {
  const matchedSkills = student.skills.filter((skill) =>
    job.skills.map((item) => item.toLowerCase()).includes(skill.toLowerCase())
  );

  const reasons: string[] = [];

  if (matchedSkills.length > 0) {
    reasons.push(`${matchedSkills.length} skill(s) em comum`);
  }

  if (job.course && student.course.toLowerCase() === job.course.toLowerCase()) {
    reasons.push("curso alinhado");
  }

  if (job.availability && student.availability.toLowerCase() === job.availability.toLowerCase()) {
    reasons.push("disponibilidade compatível");
  }

  return reasons.length > 0 ? reasons.join(" • ") : "Perfil ainda com pouca aderência detectada";
}
