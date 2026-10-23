import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  ApplicationStatus,
  JobModel,
  PrismaClient,
  Role,
} from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const password = process.env.DEMO_PASSWORD ?? "ConectaDemo@2026";
const hash = bcrypt.hashSync(password, 8);

const id = (number: number) =>
  `00000000-0000-4000-8000-${number.toString().padStart(12, "0")}`;

const students = [
  ["Bruno Dashboard", "Engenharia de Software", ["React", "TypeScript", "Git"]],
  ["Carla Dados", "Ciência da Computação", ["SQL", "Excel", "Power BI"]],
  ["Diego Suporte", "Tecnologia da Informação", ["Linux", "Redes", "Atendimento"]],
  ["Elisa QA", "Engenharia de Software", ["Testes", "Git", "Documentação"]],
  ["Fabiana Projetos", "Administração", ["Scrum", "Comunicação", "Organização"]],
  ["Gustavo Backend", "Sistemas de Informação", ["Node.js", "PostgreSQL", "Docker"]],
  ["Helena UX", "Design", ["Figma", "Pesquisa", "Prototipação"]],
  ["Igor Marketing", "Marketing", ["Conteúdo", "Métricas", "Redes sociais"]],
] as const;

const jobs = [
  ["Estágio Frontend", "Construção de interfaces para produtos digitais.", ["React", "TypeScript", "CSS"], "Engenharia de Software", JobModel.HYBRID],
  ["Estágio em Dados", "Organização de indicadores e relatórios de negócio.", ["SQL", "Excel", "Power BI"], "Ciência da Computação", JobModel.HYBRID],
  ["Suporte de Tecnologia", "Atendimento e acompanhamento de chamados.", ["Linux", "Redes", "Atendimento"], "Tecnologia da Informação", JobModel.IN_PERSON],
  ["Estágio em Qualidade", "Execução de testes e documentação de cenários.", ["Testes", "Git", "Documentação"], "Engenharia de Software", JobModel.REMOTE],
  ["Assistente de Projetos", "Apoio ao planejamento de projetos de inovação.", ["Scrum", "Comunicação", "Organização"], "Administração", JobModel.HYBRID],
  ["Estágio Backend", "Apoio no desenvolvimento de APIs e integrações.", ["Node.js", "PostgreSQL", "Docker"], "Sistemas de Informação", JobModel.REMOTE],
  ["Estágio UX", "Pesquisa com usuários e prototipação de fluxos.", ["Figma", "Pesquisa", "Prototipação"], "Design", JobModel.HYBRID],
  ["Assistente de Marketing", "Apoio na produção de conteúdo e análise de campanhas.", ["Conteúdo", "Métricas", "Redes sociais"], "Marketing", JobModel.IN_PERSON],
] as const;

const applicationPlan = [
  [0, 0, ApplicationStatus.APPROVED, 0.94, "2026-02-12"],
  [1, 0, ApplicationStatus.INTERVIEW, 0.88, "2026-02-18"],
  [2, 0, ApplicationStatus.REJECTED, 0.61, "2026-03-04"],
  [3, 1, ApplicationStatus.APPROVED, 0.92, "2026-03-10"],
  [4, 1, ApplicationStatus.INTERVIEW, 0.84, "2026-03-18"],
  [5, 1, ApplicationStatus.UNDER_REVIEW, 0.79, "2026-04-02"],
  [6, 2, ApplicationStatus.REJECTED, 0.57, "2026-04-09"],
  [7, 2, ApplicationStatus.INTERVIEW, 0.81, "2026-04-16"],
  [0, 3, ApplicationStatus.APPROVED, 0.95, "2026-04-23"],
  [1, 3, ApplicationStatus.UNDER_REVIEW, 0.76, "2026-05-01"],
  [2, 3, ApplicationStatus.SENT, 0.68, "2026-05-09"],
  [3, 4, ApplicationStatus.INTERVIEW, 0.86, "2026-05-15"],
  [4, 4, ApplicationStatus.REJECTED, 0.55, "2026-05-22"],
  [5, 4, ApplicationStatus.APPROVED, 0.91, "2026-06-03"],
  [6, 5, ApplicationStatus.UNDER_REVIEW, 0.74, "2026-06-11"],
  [7, 5, ApplicationStatus.SENT, 0.66, "2026-06-20"],
  [0, 6, ApplicationStatus.INTERVIEW, 0.83, "2026-07-02"],
  [1, 6, ApplicationStatus.APPROVED, 0.89, "2026-07-08"],
  [2, 6, ApplicationStatus.UNDER_REVIEW, 0.72, "2026-07-16"],
  [3, 7, ApplicationStatus.REJECTED, 0.59, "2026-07-24"],
  [4, 7, ApplicationStatus.INTERVIEW, 0.82, "2026-08-02"],
  [5, 7, ApplicationStatus.SENT, 0.69, "2026-08-10"],
  [6, 0, ApplicationStatus.APPROVED, 0.93, "2026-08-18"],
  [7, 0, ApplicationStatus.UNDER_REVIEW, 0.77, "2026-08-27"],
  [0, 1, ApplicationStatus.SENT, 0.71, "2026-09-04"],
  [1, 2, ApplicationStatus.INTERVIEW, 0.85, "2026-09-12"],
  [2, 3, ApplicationStatus.SENT, 0.64, "2026-09-20"],
  [3, 4, ApplicationStatus.UNDER_REVIEW, 0.78, "2026-09-29"],
  [4, 5, ApplicationStatus.APPROVED, 0.90, "2026-10-05"],
  [5, 6, ApplicationStatus.SENT, 0.73, "2026-10-14"],
  [6, 7, ApplicationStatus.INTERVIEW, 0.87, "2026-10-21"],
] as const;

async function main() {
  const companyUsers = await Promise.all(
    ["Norte Tecnologia", "Amazonas Inovação"].map((name, index) =>
      prisma.user.upsert({
        where: { email: `demo.dashboard.empresa${index + 1}@conecta-vagas.local` },
        update: { password: hash, role: Role.COMPANY },
        create: {
          email: `demo.dashboard.empresa${index + 1}@conecta-vagas.local`,
          password: hash,
          role: Role.COMPANY,
        },
      }),
    ),
  );

  const companies = await Promise.all(
    companyUsers.map((user, index) =>
      prisma.company.upsert({
        where: { userId: user.id },
        update: {
          name: ["Norte Tecnologia", "Amazonas Inovação"][index],
          legalName: `${["Norte Tecnologia", "Amazonas Inovação"][index]} Ltda.`,
          tradeName: ["Norte Tecnologia", "Amazonas Inovação"][index],
          about: "Empresa fictícia criada para demonstração do dashboard.",
          businessSector: "Tecnologia",
        },
        create: {
          userId: user.id,
          name: ["Norte Tecnologia", "Amazonas Inovação"][index],
          legalName: `${["Norte Tecnologia", "Amazonas Inovação"][index]} Ltda.`,
          tradeName: ["Norte Tecnologia", "Amazonas Inovação"][index],
          about: "Empresa fictícia criada para demonstração do dashboard.",
          businessSector: "Tecnologia",
        },
      }),
    ),
  );

  const studentRecords = await Promise.all(
    students.map(async ([name, course, skills], index) => {
      const user = await prisma.user.upsert({
        where: { email: `demo.dashboard.aluno${index + 1}@conecta-vagas.local` },
        update: { password: hash, role: Role.STUDENT },
        create: {
          email: `demo.dashboard.aluno${index + 1}@conecta-vagas.local`,
          password: hash,
          role: Role.STUDENT,
        },
      });

      return prisma.student.upsert({
        where: { userId: user.id },
        update: {
          name,
          course,
          skills: [...skills],
          availability: ["TARDE"],
          headline: "Perfil demonstrativo",
          summary: "Perfil fictício para apresentação do Conecta Vagas.",
          city: "Manaus",
          state: "AM",
          semester: `${(index % 6) + 2}º`,
          university: "Uninorte",
        },
        create: {
          userId: user.id,
          name,
          course,
          skills: [...skills],
          availability: ["TARDE"],
          headline: "Perfil demonstrativo",
          summary: "Perfil fictício para apresentação do Conecta Vagas.",
          city: "Manaus",
          state: "AM",
          semester: `${(index % 6) + 2}º`,
          university: "Uninorte",
        },
      });
    }),
  );

  const jobRecords = await Promise.all(
    jobs.map(([title, description, skills, course, model], index) =>
      prisma.job.upsert({
        where: { id: id(200 + index) },
        update: {
          title: `${title} — Dashboard`,
          description,
          skills: [...skills],
          model,
          location: "Manaus, AM",
          course,
          availability: "TARDE",
          isActive: index !== 6,
          companyId: companies[index % companies.length].id,
          createdAt: new Date(`2026-${String(2 + Math.floor(index / 2)).padStart(2, "0")}-01`),
        },
        create: {
          id: id(200 + index),
          title: `${title} — Dashboard`,
          description,
          skills: [...skills],
          model,
          location: "Manaus, AM",
          course,
          availability: "TARDE",
          isActive: index !== 6,
          companyId: companies[index % companies.length].id,
          createdAt: new Date(`2026-${String(2 + Math.floor(index / 2)).padStart(2, "0")}-01`),
        },
      }),
    ),
  );

  for (const [index, [studentIndex, jobIndex, status, score, createdAt]] of applicationPlan.entries()) {
    await prisma.application.upsert({
      where: {
        studentId_jobId: {
          studentId: studentRecords[studentIndex].id,
          jobId: jobRecords[jobIndex].id,
        },
      },
      update: { status, score, createdAt: new Date(createdAt) },
      create: {
        id: id(300 + index),
        studentId: studentRecords[studentIndex].id,
        jobId: jobRecords[jobIndex].id,
        status,
        score,
        createdAt: new Date(createdAt),
      },
    });
  }

  console.log("Seed do dashboard concluído.");
  console.log(`Estudantes demonstrativos: ${studentRecords.length}`);
  console.log(`Vagas demonstrativas: ${jobRecords.length}`);
  console.log(`Candidaturas demonstrativas: ${applicationPlan.length}`);
}

main()
  .catch((error) => {
    console.error("Falha no seed do dashboard.", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
