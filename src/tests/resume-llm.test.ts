import { afterEach, describe, expect, it, vi } from "vitest";
import { enrichResumeDraftWithLlm } from "../modules/students/resume-llm.service";

const fallback = {
  name: "Ana Clara Souza",
  email: "ana@example.com",
  skills: ["React"],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("resume LLM enrichment", () => {
  it("uses the local parser when no API key is configured", async () => {
    const result = await enrichResumeDraftWithLlm("texto do currículo", fallback);
    expect(result).toEqual({ draft: fallback, source: "local" });
  });

  it("normalizes the JSON returned by the provider", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ name: "Ana", skills: ["TypeScript"], city: "Manaus" }) } }],
    }), { status: 200 })));

    const result = await enrichResumeDraftWithLlm("texto do currículo", fallback);
    expect(result.source).toBe("llm");
    expect(result.draft).toMatchObject({ name: "Ana", email: "ana@example.com", skills: ["TypeScript"], city: "Manaus" });
  });

  it("falls back when the provider fails or returns invalid JSON", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })));

    const result = await enrichResumeDraftWithLlm("texto do currículo", fallback);
    expect(result).toEqual({ draft: fallback, source: "local" });
  });
});
