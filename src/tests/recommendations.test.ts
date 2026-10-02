import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findProfile: vi.fn(),
  findJobs: vi.fn(),
}));

vi.mock("../modules/students/student.repository", () => ({
  publicStudentProfileSelect: { id: true },
  StudentRepository: class {
    findMatchingProfileByUserId = mocks.findProfile;
  },
}));

vi.mock("../modules/jobs/job.repository", () => ({
  JobRepository: class {
    findActiveForMatching = mocks.findJobs;
  },
}));

import { MatchService } from "../modules/match/match.service";

const matchService = new MatchService();
const completeProfile = {
  course: "Engenharia de Software",
  skills: ["TypeScript", "SQL"],
  availability: ["TARDE"],
};

describe("MatchService - recomendações", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calcula score determinístico com pesos de habilidades, curso e disponibilidade", () => {
    expect(matchService.calculateScore(
      completeProfile.skills,
      completeProfile.course,
      completeProfile.availability,
      ["TypeScript", "SQL"],
      completeProfile.course,
      "TARDE"
    )).toBe(100);
    expect(matchService.buildJustification(
      completeProfile.skills,
      completeProfile.course,
      completeProfile.availability,
      ["TypeScript", "SQL"],
      completeProfile.course,
      "TARDE"
    )).toEqual(["2 habilidade(s) em comum", "curso alinhado", "disponibilidade compatível"]);
  });

  it("ordena por score e não retorna vagas inativas ou sem compatibilidade", async () => {
    mocks.findProfile.mockResolvedValue(completeProfile);
    mocks.findJobs.mockResolvedValue([
      {
        id: "old-compatible",
        title: "Vaga compatível antiga",
        description: "Descrição",
        skills: ["TypeScript"],
        model: "REMOTE",
        location: null,
        course: null,
        availability: null,
        isActive: true,
        createdAt: new Date("2026-09-01"),
        company: { id: "company-1", name: "Empresa", about: null },
      },
      {
        id: "new-compatible",
        title: "Vaga compatível recente",
        description: "Descrição",
        skills: ["TypeScript", "SQL"],
        model: "HYBRID",
        location: null,
        course: completeProfile.course,
        availability: "TARDE",
        isActive: true,
        createdAt: new Date("2026-10-01"),
        company: { id: "company-2", name: "Empresa 2", about: null },
      },
      {
        id: "inactive",
        title: "Vaga encerrada",
        description: "Descrição",
        skills: ["TypeScript", "SQL"],
        model: "REMOTE",
        location: null,
        course: completeProfile.course,
        availability: "TARDE",
        isActive: false,
        createdAt: new Date("2026-10-02"),
        company: { id: "company-3", name: "Empresa 3", about: null },
      },
      {
        id: "unmatched",
        title: "Vaga incompatível",
        description: "Descrição",
        skills: ["Rust"],
        model: "REMOTE",
        location: null,
        course: "Direito",
        availability: "NOITE",
        isActive: true,
        createdAt: new Date("2026-10-03"),
        company: { id: "company-4", name: "Empresa 4", about: null },
      },
    ]);

    const recommendations = await matchService.getRecommendedJobsForStudent("student-user");

    expect(recommendations.map((job) => job.id)).toEqual(["new-compatible", "old-compatible"]);
    expect(recommendations[0].compatibilityScore).toBe(100);
    expect(recommendations[0].company).toEqual({ id: "company-2", name: "Empresa 2", about: null });
    expect(mocks.findProfile).toHaveBeenCalledWith("student-user");
  });

  it("retorna coleção vazia para perfil incompleto ou sem vagas compatíveis", async () => {
    for (const incompleteProfile of [
      { ...completeProfile, course: "" },
      { ...completeProfile, skills: [] },
      { ...completeProfile, availability: [] },
    ]) {
      mocks.findProfile.mockResolvedValue(incompleteProfile);
      expect(await matchService.getRecommendedJobsForStudent("student-user")).toEqual([]);
      expect(mocks.findJobs).not.toHaveBeenCalled();
      mocks.findJobs.mockClear();
    }

    mocks.findProfile.mockResolvedValue(completeProfile);
    mocks.findJobs.mockResolvedValue([]);
    expect(await matchService.getRecommendedJobsForStudent("student-user")).toEqual([]);
  });

  it("retorna erro controlado quando o aluno não possui perfil", async () => {
    mocks.findProfile.mockResolvedValue(null);

    await expect(matchService.getRecommendedJobsForStudent("student-user"))
      .rejects.toMatchObject({ message: "Aluno não encontrado.", statusCode: 404 });
  });
});
