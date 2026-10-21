import { PDFParse } from "pdf-parse";
import { AppError } from "../../shared/errors/app.error";

export const RESUME_MAX_FILE_SIZE = 5 * 1024 * 1024;

export type ResumeProfileDraft = {
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
  skills: string[];
  city?: string;
  state?: string;
  headline?: string;
  summary?: string;
};

function cleanLine(value: string) {
  return value.replace(/[ ]+/g, " ").trim();
}

function findLabeledValue(lines: string[], labels: string[]) {
  const line = lines.find((item) => labels.some((label) => item.toLowerCase().startsWith(label)));
  if (!line) return undefined;

  const separator = line.search(/[:|-]/);
  return separator >= 0 ? cleanLine(line.slice(separator + 1)) || undefined : undefined;
}

function extractSkills(text: string) {
  const lines = text.split(String.fromCharCode(10)).map(cleanLine).filter(Boolean);
  const line = findLabeledValue(lines, ["habilidades", "competencias", "skills", "tecnologias"]);
  if (!line) return [];

  return line
    .split(/[,;|]/)
    .map(cleanLine)
    .filter((item) => item.length >= 2 && item.length <= 80)
    .slice(0, 30);
}

export function extractResumeDraftFromText(text: string): ResumeProfileDraft {
  const lines = text.split(String.fromCharCode(10)).map(cleanLine).filter(Boolean);
  const email = text.match(new RegExp("[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}", "i"))?.[0];
  const phone = text.match(new RegExp("(?:[+]55[ ]?)?(?:[(]?[0-9]{2}[)]?[ ]?)?(?:9[ ]?)?[0-9]{4,5}[-. ]?[0-9]{4}"))?.[0];
  const name = lines.find((line) => !line.includes("@") && !/^curr[i]culo/i.test(line) && line.length >= 3 && line.length <= 100);

  return {
    name,
    email,
    phone,
    course: findLabeledValue(lines, ["curso", "formacao", "graduacao"]),
    skills: extractSkills(text),
    city: findLabeledValue(lines, ["cidade", "localizacao"]),
    state: findLabeledValue(lines, ["estado", "uf"]),
    headline: findLabeledValue(lines, ["cargo", "objetivo", "titulo"]),
    summary: findLabeledValue(lines, ["resumo", "perfil", "sobre"]),
  };
}

export async function extractResumeDraft(buffer: Buffer): Promise<ResumeProfileDraft> {
  if (!buffer.subarray(0, 5).toString("ascii").startsWith("%PDF-")) {
    throw new AppError("O arquivo enviado nao e um PDF valido.", 415);
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const newline = String.fromCharCode(10);
    const carriageReturn = String.fromCharCode(13);
    const text = result.text
      .split(carriageReturn).join(newline)
      .replace(new RegExp(newline + "{3,}", "g"), newline + newline)
      .trim();

    if (text.length < 20) {
      throw new AppError("Nao foi possivel extrair texto suficiente do curriculo.", 422);
    }

    return extractResumeDraftFromText(text);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Nao foi possivel processar o curriculo em PDF.", 422);
  } finally {
    await parser.destroy();
  }
}

export async function extractResumeText(buffer: Buffer): Promise<string> {
  if (!buffer.subarray(0, 5).toString("ascii").startsWith("%PDF-")) {
    throw new AppError("O arquivo enviado nao e um PDF valido.", 415);
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const newline = String.fromCharCode(10);
    const carriageReturn = String.fromCharCode(13);
    const text = result.text
      .split(carriageReturn).join(newline)
      .replace(new RegExp(newline + "{3,}", "g"), newline + newline)
      .trim();

    if (text.length < 20) {
      throw new AppError("Nao foi possivel extrair texto suficiente do curriculo.", 422);
    }

    return text;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Nao foi possivel processar o curriculo em PDF.", 422);
  } finally {
    await parser.destroy();
  }
}
