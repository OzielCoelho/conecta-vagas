import type { StoredSession } from "../auth/auth-storage";
import { clearSession, loadSession, saveSession } from "../auth/auth-storage";
import type { JobItem } from "../services/jobs";
import type { StudentApplication } from "../services/applications";
import {
  DEMO_TOKEN,
  demoCompanyProfile,
  demoCompanyUser,
  demoStudentProfile,
  demoStudentUser,
} from "./demo-profiles";

const DEMO_MODE_KEY = "conecta_vagas_demo_mode";
const DEMO_STUDENT_PROFILE_KEY = "conecta_vagas_demo_student_profile";
const DEMO_COMPANY_PROFILE_KEY = "conecta_vagas_demo_company_profile";
const DEMO_JOBS_KEY = "conecta_vagas_demo_jobs";
const DEMO_APPLICATIONS_KEY = "conecta_vagas_demo_applications";

export type DemoMode = "student" | "company";

export function saveDemoMode(mode: DemoMode) {
  window.localStorage.setItem(DEMO_MODE_KEY, mode);
}

export function loadDemoMode(): DemoMode | null {
  const mode = window.localStorage.getItem(DEMO_MODE_KEY);
  if (mode === "student" || mode === "company") return mode;
  return null;
}

export function clearDemoMode() {
  window.localStorage.removeItem(DEMO_MODE_KEY);
}

export function createDemoSession(mode: DemoMode): StoredSession {
  const user = mode === "company" ? demoCompanyUser : demoStudentUser;

  return {
    token: DEMO_TOKEN,
    user,
  };
}

export function startDemoSession(mode: DemoMode) {
  saveDemoMode(mode);
  saveSession(createDemoSession(mode));
  ensureDemoProfiles();
}

export function clearDemoSession() {
  clearDemoMode();
  clearSession();
}

export function isDemoToken(token?: string | null) {
  return token === DEMO_TOKEN;
}

function buildDefaultDemoJobs(): JobItem[] {
  return [
    {
      id: "demo-job-1",
      title: "Estágio Front-end React",
      description: "Atue com React, componentes reutilizáveis e interfaces modernas com foco em experiência do usuário.",
      skills: ["React", "TypeScript", "Git", "Comunicação Ágil"],
      model: "REMOTE",
      location: "Manaus, AM",
      course: "Engenharia de Software",
      availability: "Vespertino",
      isActive: true,
      company: { id: "demo-company-1", name: "Orbit Labs", about: "Estúdio digital focado em produtos web." },
    },
    {
      id: "demo-job-2",
      title: "Estágio em Produto Digital",
      description: "Participe da evolução de fluxos, protótipos e decisões orientadas ao usuário.",
      skills: ["UX/UI", "Figma", "Comunicação Ágil", "SQL"],
      model: "HYBRID",
      location: "Manaus, AM",
      course: "Engenharia de Software",
      availability: "Vespertino",
      isActive: true,
      company: { id: "demo-company-2", name: "Nexa Studio", about: "Consultoria de produto e design." },
    },
    {
      id: "demo-job-3",
      title: "Estágio Full Stack Jr.",
      description: "Apoie APIs, integrações e dashboards internos com curva de aprendizado acelerada.",
      skills: ["Node", "SQL", "Git", "Python"],
      model: "IN_PERSON",
      location: "Manaus, AM",
      course: "Engenharia de Software",
      availability: "Vespertino",
      isActive: true,
      company: { id: "demo-company-3", name: "Bridge Tech", about: "Time focado em automação e integrações." },
    },
  ];
}

function buildDefaultDemoApplications(jobs: JobItem[]): StudentApplication[] {
  return [
    {
      id: "demo-application-1",
      status: "SENT",
      score: 96,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      job: jobs[0],
    },
    {
      id: "demo-application-2",
      status: "UNDER_REVIEW",
      score: 92,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      job: jobs[1],
    },
  ];
}

export function ensureDemoProfiles() {
  if (!window.localStorage.getItem(DEMO_STUDENT_PROFILE_KEY)) {
    window.localStorage.setItem(DEMO_STUDENT_PROFILE_KEY, JSON.stringify(demoStudentProfile));
  }

  if (!window.localStorage.getItem(DEMO_COMPANY_PROFILE_KEY)) {
    window.localStorage.setItem(DEMO_COMPANY_PROFILE_KEY, JSON.stringify(demoCompanyProfile));
  }

  if (!window.localStorage.getItem(DEMO_JOBS_KEY)) {
    window.localStorage.setItem(DEMO_JOBS_KEY, JSON.stringify(buildDefaultDemoJobs()));
  }

  if (!window.localStorage.getItem(DEMO_APPLICATIONS_KEY)) {
    const jobs = JSON.parse(window.localStorage.getItem(DEMO_JOBS_KEY) || "[]") as JobItem[];
    window.localStorage.setItem(DEMO_APPLICATIONS_KEY, JSON.stringify(buildDefaultDemoApplications(jobs)));
  }
}

export function getStoredDemoStudentProfile() {
  ensureDemoProfiles();
  const raw = window.localStorage.getItem(DEMO_STUDENT_PROFILE_KEY);
  return raw ? JSON.parse(raw) : demoStudentProfile;
}

export function saveDemoStudentProfile(profile: unknown) {
  window.localStorage.setItem(DEMO_STUDENT_PROFILE_KEY, JSON.stringify(profile));
}

export function getStoredDemoCompanyProfile() {
  ensureDemoProfiles();
  const raw = window.localStorage.getItem(DEMO_COMPANY_PROFILE_KEY);
  return raw ? JSON.parse(raw) : demoCompanyProfile;
}

export function saveDemoCompanyProfile(profile: unknown) {
  window.localStorage.setItem(DEMO_COMPANY_PROFILE_KEY, JSON.stringify(profile));
}

export function getStoredDemoJobs() {
  ensureDemoProfiles();
  const raw = window.localStorage.getItem(DEMO_JOBS_KEY);
  return raw ? JSON.parse(raw) : buildDefaultDemoJobs();
}

export function saveDemoJobs(jobs: unknown) {
  window.localStorage.setItem(DEMO_JOBS_KEY, JSON.stringify(jobs));
}

export function getStoredDemoApplications() {
  ensureDemoProfiles();
  const raw = window.localStorage.getItem(DEMO_APPLICATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveDemoApplications(applications: unknown) {
  window.localStorage.setItem(DEMO_APPLICATIONS_KEY, JSON.stringify(applications));
}

export function isActiveDemoSession() {
  const session = loadSession();
  return Boolean(session && isDemoToken(session.token) && loadDemoMode());
}
