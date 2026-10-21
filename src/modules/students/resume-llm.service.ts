import { ResumeProfileDraft } from "./resume-import.service";
import { readLlmConfig } from "../../shared/config/llm.config";

const MAX_TEXT_LENGTH = 20_000;

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

const SYSTEM_PROMPT = `Você extrai dados de currículos. Responda somente JSON válido, sem markdown, usando exatamente estas chaves: name, email, phone, course, skills, city, state, headline, summary. Use null quando o dado não estiver no currículo. Não invente informações. skills deve ser um array de strings. Preserve o idioma original.`;

function parseJson(content: string): Record<string, unknown> | null {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  try {
    const parsed: unknown = JSON.parse(normalized);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeDraft(value: Record<string, unknown>, fallback: ResumeProfileDraft): ResumeProfileDraft {
  const skills = Array.isArray(value.skills)
    ? value.skills.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 30)
    : fallback.skills;

  return {
    name: stringValue(value.name) ?? fallback.name,
    email: stringValue(value.email) ?? fallback.email,
    phone: stringValue(value.phone) ?? fallback.phone,
    course: stringValue(value.course) ?? fallback.course,
    skills,
    city: stringValue(value.city) ?? fallback.city,
    state: stringValue(value.state) ?? fallback.state,
    headline: stringValue(value.headline) ?? fallback.headline,
    summary: stringValue(value.summary) ?? fallback.summary,
  };
}

export async function enrichResumeDraftWithLlm(text: string, fallback: ResumeProfileDraft) {
  const config = readLlmConfig();
  if (!config.apiKey) return { draft: fallback, source: "local" as const };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Currículo:\n\n${text.slice(0, MAX_TEXT_LENGTH)}` },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return { draft: fallback, source: "local" as const };

    const payload = await response.json() as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    const parsed = content ? parseJson(content) : null;
    return parsed
      ? { draft: normalizeDraft(parsed, fallback), source: "llm" as const }
      : { draft: fallback, source: "local" as const };
  } catch {
    return { draft: fallback, source: "local" as const };
  } finally {
    clearTimeout(timeout);
  }
}
