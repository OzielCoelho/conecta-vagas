import { describe, it, expect } from "vitest";
import { MatchService } from "../modules/match/match.service";

const matchService = new MatchService();

describe("MatchService - calculateScore", () => {
  it("deve retornar 100 quando todas as habilidades, curso e disponibilidade batem", () => {
    const score = matchService.calculateScore(
      ["Node.js", "JavaScript", "SQL"],
      "Técnico em Informática",
      ["MANHA"],
      ["Node.js", "JavaScript", "SQL"],
      "Técnico em Informática",
      "MANHA"
    );

    expect(score).toBe(100);
  });

  it("deve retornar 60 quando apenas as habilidades batem", () => {
    const score = matchService.calculateScore(
      ["Node.js", "JavaScript", "SQL"],
      "Técnico em Redes",
      ["TARDE"],
      ["Node.js", "JavaScript", "SQL"],
      "Técnico em Informática",
      "MANHA"
    );

    expect(score).toBe(60);
  });

  it("deve retornar 0 quando nenhuma habilidade bate", () => {
    const score = matchService.calculateScore(
      ["Python", "Django"],
      "Técnico em Redes",
      ["TARDE"],
      ["Node.js", "JavaScript", "SQL"],
      "Técnico em Informática",
      "MANHA"
    );

    expect(score).toBe(0);
  });

  it("deve retornar 80 quando 2 de 3 habilidades batem e curso bate", () => {
    const score = matchService.calculateScore(
      ["Node.js", "JavaScript"],
      "Técnico em Informática",
      ["TARDE"],
      ["Node.js", "JavaScript", "SQL"],
      "Técnico em Informática",
      "MANHA"
    );

    expect(score).toBe(65);
  });

  it("deve ser case insensitive nas habilidades", () => {
    const score = matchService.calculateScore(
      ["node.js", "javascript", "sql"],
      "Técnico em Informática",
      ["MANHA"],
      ["Node.js", "JavaScript", "SQL"],
      "Técnico em Informática",
      "MANHA"
    );

    expect(score).toBe(100);
  });
});