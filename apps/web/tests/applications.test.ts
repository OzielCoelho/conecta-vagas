import { afterEach, describe, expect, it, vi } from "vitest";
import { applyToJob } from "../src/services/applications";

describe("candidatura frontend", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envia a vaga e o token para a API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "application-1", status: "SENT" }), { status: 201, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await applyToJob("job-123", "student-token");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3333/applications", expect.objectContaining({ method: "POST", body: JSON.stringify({ jobId: "job-123" }) }));
    const [, request] = fetchMock.mock.calls[0];
    expect(request.headers.get("Authorization")).toBe("Bearer student-token");
  });
});
