import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("API client", () => {
  it("uses the configured URL and attaches a supplied session token", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/");
    const fetch = vi.fn().mockResolvedValue(Response.json({ status: "UP" }));
    vi.stubGlobal("fetch", fetch);
    await expect(
      apiRequest("/api/health", { token: "test-token" }),
    ).resolves.toEqual({ status: "UP" });
    expect(fetch.mock.calls[0][0]).toBe("http://localhost:8080/api/health");
    expect(fetch.mock.calls[0][1].headers.get("Authorization")).toBe(
      "Bearer test-token",
    );
  });
  it("preserves structured API errors and request IDs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            code: "CONFLICT",
            message: "Room unavailable",
            details: {},
            requestId: "trace-123",
          },
          { status: 409 },
        ),
      ),
    );
    await expect(apiRequest("/api/bookings")).rejects.toMatchObject({
      status: 409,
      body: { code: "CONFLICT", requestId: "trace-123" },
    });
  });
  it("handles a non-JSON gateway error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })),
    );
    await expect(apiRequest("/api/health")).rejects.toMatchObject({
      status: 502,
      body: { code: "REQUEST_FAILED" },
    });
  });
  it("supports empty successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await expect(apiRequest("/api/example")).resolves.toBeUndefined();
  });
});
