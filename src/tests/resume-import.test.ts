import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getText: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    getText = mocks.getText;
    destroy = mocks.destroy;
  },
}));

import { extractResumeDraft } from "../modules/students/resume-import.service";

describe("resume PDF extraction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.destroy.mockResolvedValue(undefined);
  });

  it("extracts a profile draft from text returned by the PDF parser", async () => {
    mocks.getText.mockResolvedValue({
      text: [
        "Ana Clara Souza",
        "ana@example.com",
        "(92) 99999-1111",
        "Curso: Engenharia de Software",
        "Habilidades: React, TypeScript, Git",
        "Cidade: Manaus",
        "Estado: AM",
      ].join(String.fromCharCode(10)),
    });

    const draft = await extractResumeDraft(Buffer.from("%PDF-1.7 resume"));

    expect(draft).toMatchObject({
      name: "Ana Clara Souza",
      email: "ana@example.com",
      course: "Engenharia de Software",
      skills: ["React", "TypeScript", "Git"],
      city: "Manaus",
      state: "AM",
    });
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });

  it("rejects non-PDF files before parsing", async () => {
    await expect(extractResumeDraft(Buffer.from("not a pdf"))).rejects.toMatchObject({
      statusCode: 415,
    });
    expect(mocks.getText).not.toHaveBeenCalled();
  });

  it("rejects PDFs without enough extractable text", async () => {
    mocks.getText.mockResolvedValue({ text: "short" });

    await expect(extractResumeDraft(Buffer.from("%PDF-1.7 empty"))).rejects.toMatchObject({
      statusCode: 422,
    });
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });
});
