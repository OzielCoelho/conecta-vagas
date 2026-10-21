import { afterEach, describe, expect, it, vi } from "vitest";
import { getStoredDemoJobs } from "../src/demo/demo-storage";

function createStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
}

describe("vagas demonstrativas", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("oferece tres vagas ativas quando o armazenamento esta vazio", () => {
    vi.stubGlobal("window", { localStorage: createStorage(), sessionStorage: createStorage() });
    const jobs = getStoredDemoJobs();
    expect(jobs).toHaveLength(3);
    expect(jobs.every((job) => job.id.startsWith("demo-"))).toBe(true);
    expect(jobs.every((job) => job.isActive)).toBe(true);
    expect(jobs.map((job) => job.title)).toContain("Estagio Front-end React");
  });
});
