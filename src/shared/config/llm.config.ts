export function readLlmConfig(env: NodeJS.ProcessEnv = process.env) {
  const timeoutMs = Number(env.GROQ_TIMEOUT_MS ?? 12000);

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) {
    throw new Error("GROQ_TIMEOUT_MS deve ser um inteiro entre 1000 e 60000.");
  }

  return {
    apiKey: env.GROQ_API_KEY?.trim() || undefined,
    model: env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b",
    apiUrl: env.GROQ_API_URL?.trim() || "https://api.groq.com/openai/v1/chat/completions",
    timeoutMs,
  };
}
