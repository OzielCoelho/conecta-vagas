export function readSecurityConfig(env: NodeJS.ProcessEnv = process.env) {
  if (!env.JWT_SECRET?.trim()) throw new Error("JWT_SECRET não configurado.");
  function positiveInteger(name: string, fallback: number, maximum: number) {
    const value = Number(env[name] ?? fallback);
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
      throw new Error(`${name} deve ser um inteiro positivo até ${maximum}.`);
    }
    return value;
  }
  const origins = (env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",").map(origin => origin.trim()).filter(Boolean);
  if (!origins.length) throw new Error("CORS_ORIGINS deve conter ao menos uma origem.");
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin) throw new Error();
    } catch { throw new Error("CORS_ORIGINS deve conter origens HTTP(S) exatas, sem caminhos ou curingas."); }
  }
  return {
    jwtSecret: env.JWT_SECRET,
    jwtTtlSeconds: positiveInteger("JWT_TTL_SECONDS", 3600, 86400),
    origins,
    authRateLimitMax: positiveInteger("AUTH_RATE_LIMIT_MAX", 10, 10000),
    authRateLimitWindowMs: positiveInteger("AUTH_RATE_LIMIT_WINDOW_MS", 60000, 86400000),
  };
}
