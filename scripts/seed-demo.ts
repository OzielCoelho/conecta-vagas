import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, JobModel, Role } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const demoPassword = process.env.DEMO_PASSWORD ?? "ConectaDemo@2026";

const accounts = {
  student: { email: process.env.DEMO_STUDENT_EMAIL ?? "demo.aluno@conecta-vagas.local", role: Role.STUDENT },
  company: { email: process.env.DEMO_COMPANY_EMAIL ?? "demo.empresa@conecta-vagas.local", role: Role.COMPANY },
  coordinator: { email: process.env.DEMO_COORDINATOR_EMAIL ?? "demo.coordenador@conecta-vagas.local", role: Role.COORDINATOR },
};

const jobs = [
  ["Desenvolvedor(a) Frontend Jr. — Demonstração", "Apoio no desenvolvimento de interfaces web para produtos digitais em Manaus.", ["React", "TypeScript", "CSS"], "Engenharia de Software"],
  ["Analista de Dados — Demonstração", "Organização de indicadores e criação de relatórios para decisões de negócio.", ["SQL", "Excel", "Power BI"], "Ciência da Computação"],
  ["Suporte Técnico — Demonstração", "Atendimento a usuários e acompanhamento de chamados de tecnologia.", ["Redes", "Atendimento", "Linux"], "Tecnologia da Informação"],
  ["Estágio em QA — Demonstração", "Execução de testes e registro de cenários para melhorar a qualidade do produto.", ["Testes", "Git", "Documentação"], "Engenharia de Software"],
  ["Assistente de Projetos — Demonstração", "Apoio ao planejamento e acompanhamento de projetos de inovação em Manaus.", ["Organização", "Comunicação", "Scrum"], "Administração"],
] as const;

async function upsertUser(email: string, role: Role, name: string) {
  const password = await bcrypt.hash(demoPassword, 8);
  return prisma.user.upsert({
    where: { email },
    update: { password, role },
    create: { email, password, role },
  });
}

async function main() {
  const studentUser = await upsertUser(accounts.student.email, accounts.student.role, "Ana Demonstração");
  const companyUser = await upsertUser(accounts.company.email, accounts.company.role, "Empresa Manaus Demonstração");
  await upsertUser(accounts.coordinator.email, accounts.coordinator.role, "Coordenação Demonstração");

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: { name: "Ana Demonstração", course: "Engenharia de Software", skills: ["React", "TypeScript", "SQL"], availability: ["TARDE"], headline: "Estudante de tecnologia", summary: "Perfil criado para demonstração do Conecta Vagas.", city: "Manaus", state: "AM", semester: "4º", university: "Uninorte" },
    create: { userId: studentUser.id, name: "Ana Demonstração", course: "Engenharia de Software", skills: ["React", "TypeScript", "SQL"], availability: ["TARDE"], headline: "Estudante de tecnologia", summary: "Perfil criado para demonstração do Conecta Vagas.", city: "Manaus", state: "AM", semester: "4º", university: "Uninorte" },
  });

  const company = await prisma.company.upsert({
    where: { userId: companyUser.id },
    update: { name: "Empresa Manaus Demonstração", legalName: "Empresa Manaus Demonstração Ltda.", tradeName: "Empresa Manaus Demonstração", about: "Empresa fictícia para demonstração do Conecta Vagas.", businessSector: "Tecnologia" },
    create: { userId: companyUser.id, name: "Empresa Manaus Demonstração", legalName: "Empresa Manaus Demonstração Ltda.", tradeName: "Empresa Manaus Demonstração", about: "Empresa fictícia para demonstração do Conecta Vagas.", businessSector: "Tecnologia" },
  });

  for (const [index, [title, description, skills, course]] of jobs.entries()) {
    const id = `00000000-0000-4000-8000-00000000000${index + 1}`;
    await prisma.job.upsert({
      where: { id },
      update: { title, description, skills: [...skills], model: JobModel.HYBRID, location: "Manaus, AM", course, availability: "TARDE", isActive: true, companyId: company.id },
      create: { id, title, description, skills: [...skills], model: JobModel.HYBRID, location: "Manaus, AM", course, availability: "TARDE", isActive: true, companyId: company.id },
    });
  }

  console.log("Seed demonstrativo concluído.");
  console.log(`Aluno: ${accounts.student.email}`);
  console.log(`Empresa: ${accounts.company.email}`);
  console.log(`Coordenador: ${accounts.coordinator.email}`);
  console.log(`Senha demonstrativa: ${demoPassword}`);
  console.log("Vagas demonstrativas ativas: 5");
}

main().catch((error) => {
  console.error("Falha no seed demonstrativo.", error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
