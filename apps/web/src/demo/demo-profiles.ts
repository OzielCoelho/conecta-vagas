import type { AuthUser } from "../auth/auth-storage";
import type { StudentProfile } from "../services/students";
import type { CompanyProfile } from "../services/companies";

export const DEMO_TOKEN = "demo-token";

export const demoStudentUser: AuthUser = {
  id: "demo-student-user",
  email: "demo@conecta.local",
  role: "STUDENT",
  name: "Ana Clara Souza",
  displayName: "Ana Clara Souza",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  firstName: "Ana Clara",
  lastName: "Souza",
};

export const demoStudentProfile: StudentProfile = {
  id: "demo-student-profile",
  name: "Ana Clara Souza",
  course: "Ciência da Computação",
  skills: ["React", "Node.js", "TypeScript", "SQL"],
  availability: ["MANHA", "TARDE"],
  headline: "Desenvolvedora em formação com foco em produtos web",
  summary: "Gosto de criar interfaces claras, colaborar com times de produto e transformar requisitos em experiências simples.",
  city: "Manaus",
  state: "AM",
  semester: "7º período",
  university: "UFAM",
  cr: "8.9",
  portfolio: "https://portfolio-demo.dev/ana-clara",
  photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  isVisible: true,
};

export const demoCompanyUser: AuthUser = {
  id: "demo-company-user",
  email: "empresa-demo@conecta.local",
  role: "COMPANY",
  name: "Inova Talentos",
  displayName: "Inova Talentos",
  avatarUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=80",
};

export const demoCompanyProfile: CompanyProfile = {
  id: "demo-company-profile",
  name: "Inova Talentos",
  about: "Empresa fictícia criada para testar a experiência de perfil e navegação da plataforma.",
  logoUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=80",
  commercialPhone: "(92) 99999-9999",
  legalName: "Inova Talentos Soluções Ltda.",
  tradeName: "Inova Talentos",
  cultureDescription: "Empresa fictícia criada para testar a experiência de perfil e navegação da plataforma.",
  businessSector: "Tecnologia",
};
