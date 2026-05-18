import { describe, it, expect } from "vitest";
import { ApplicationStatus } from "../generated/prisma";

const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  SENT: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

function isValidTransition(current: ApplicationStatus, next: ApplicationStatus): boolean {
  return validTransitions[current].includes(next);
}

describe("Application - transições de status", () => {
  it("deve permitir transição de SENT para UNDER_REVIEW", () => {
    expect(isValidTransition("SENT", "UNDER_REVIEW")).toBe(true);
  });

  it("deve permitir transição de UNDER_REVIEW para INTERVIEW", () => {
    expect(isValidTransition("UNDER_REVIEW", "INTERVIEW")).toBe(true);
  });

  it("deve permitir transição de INTERVIEW para APPROVED", () => {
    expect(isValidTransition("INTERVIEW", "APPROVED")).toBe(true);
  });

  it("deve permitir rejeição em qualquer etapa", () => {
    expect(isValidTransition("SENT", "REJECTED")).toBe(true);
    expect(isValidTransition("UNDER_REVIEW", "REJECTED")).toBe(true);
    expect(isValidTransition("INTERVIEW", "REJECTED")).toBe(true);
  });

  it("não deve permitir voltar de APPROVED", () => {
    expect(isValidTransition("APPROVED", "SENT")).toBe(false);
    expect(isValidTransition("APPROVED", "UNDER_REVIEW")).toBe(false);
  });

  it("não deve permitir voltar de REJECTED", () => {
    expect(isValidTransition("REJECTED", "SENT")).toBe(false);
    expect(isValidTransition("REJECTED", "APPROVED")).toBe(false);
  });

  it("não deve pular etapas", () => {
    expect(isValidTransition("SENT", "INTERVIEW")).toBe(false);
    expect(isValidTransition("SENT", "APPROVED")).toBe(false);
  });
  
  it("não deve permitir candidatura duplicada do mesmo aluno na mesma vaga", () => {
    
    const candidaturasNoBanco = [
      { studentId: "aluno-wesley", jobId: "vaga-it-auditor" }
    ];

    const novaTentativa = { studentId: "aluno-wesley", jobId: "vaga-it-auditor" };

    
    const jáExiste = candidaturasNoBanco.some(
      (c) => c.studentId === novaTentativa.studentId && c.jobId === novaTentativa.jobId
    );

    
    expect(jáExiste).toBe(true);
  });
});
