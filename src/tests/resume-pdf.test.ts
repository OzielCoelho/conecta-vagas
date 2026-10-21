import { describe, expect, it } from "vitest";
import { generateResumePdf } from "../modules/students/resume-pdf.service";

describe("resume PDF generation", () => {
  it("generates a valid PDF with the student's profile data", async () => {
    const pdf = await generateResumePdf({
      name: "Ana Clara Souza",
      course: "Engenharia de Software",
      skills: ["TypeScript", "React"],
      availability: ["TARDE"],
      headline: "Desenvolvedora frontend",
      summary: "Estudante interessada em produtos digitais.",
      city: "Manaus",
      state: "AM",
    });

    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(500);
    expect(pdf.toString("latin1")).toContain("%%EOF");
  });
});
