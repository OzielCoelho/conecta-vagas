import type { AuthUser } from "../auth/auth-storage";
import type { StudentProfile } from "../services/students";
import type { CompanyProfile } from "../services/companies";

export const DEMO_TOKEN = "demo-token";

export const demoStudentUser: AuthUser = {
  id: "demo-student-user",
  email: "demo@conecta.local",
  role: "STUDENT",
  name: "Ana Clara Souza",
};

export const demoStudentProfile: StudentProfile = {
  id: "demo-student-profile",
  name: "Ana Clara Souza",
  course: "Ciência da Computação",
  skills: ["React", "Node.js", "TypeScript", "SQL"],
  availability: "Manhã e tarde",
  portfolio: "https://portfolio-demo.dev/ana-clara",
  photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  isVisible: true,
};

export const demoCompanyUser: AuthUser = {
  id: "demo-company-user",
  email: "empresa-demo@conecta.local",
  role: "COMPANY",
  name: "Inova Talentos",
};

export const demoCompanyProfile: CompanyProfile = {
  id: "demo-company-profile",
  name: "Inova Talentos",
  about: "Empresa fictícia criada para testar a experiência de perfil e navegação da plataforma.",
};
