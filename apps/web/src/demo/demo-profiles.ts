import type { AuthUser } from "../auth/auth-storage";
import type { StudentProfile } from "../services/students";
import type { CompanyProfile } from "../services/companies";

export const DEMO_TOKEN = "demo-token";

export const demoStudentUser: AuthUser = {
  id: "demo-student-user",
  email: "demo@conecta.local",
  role: "STUDENT",
};

export const demoStudentProfile: StudentProfile = {
  id: "demo-student-profile",
  name: "Ana Clara Souza",
  course: "Ciência da Computação",
  skills: ["React", "Node.js", "TypeScript", "SQL"],
  availability: "Manhã e tarde",
  portfolio: "https://portfolio-demo.dev/ana-clara",
  isVisible: true,
};

export const demoCompanyUser: AuthUser = {
  id: "demo-company-user",
  email: "empresa-demo@conecta.local",
  role: "COMPANY",
};

export const demoCompanyProfile: CompanyProfile = {
  id: "demo-company-profile",
  name: "Inova Talentos",
  about: "Empresa fictícia criada para testar a experiência de perfil e navegação da plataforma.",
};
