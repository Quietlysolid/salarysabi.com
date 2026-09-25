import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJobListings } from "./fetch-job-listings";

afterEach(() => vi.unstubAllGlobals());

describe("job board recovery", () => {
  it("accepts a genuinely empty board", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [], pagination: { page: 1, totalPages: 1 } })));
    await expect(fetchJobListings(new AbortController().signal)).resolves.toEqual([]);
  });

  it("does not turn failed or malformed responses into an empty board", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ error: "Unavailable" }));
    vi.stubGlobal("fetch", fetch);
    await expect(fetchJobListings(new AbortController().signal)).rejects.toThrow("Jobs unavailable");
    await expect(fetchJobListings(new AbortController().signal)).rejects.toThrow("Invalid jobs response");
  });

  it("keeps listings beyond the first API page when retrying", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ data: [{ id: "first" }], pagination: { page: 1, totalPages: 2 } }))
      .mockResolvedValueOnce(Response.json({ data: [{ id: "second" }], pagination: { page: 2, totalPages: 2 } }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    await expect(fetchJobListings(signal)).resolves.toEqual([{ id: "first" }, { id: "second" }]);
    expect(fetch).toHaveBeenLastCalledWith("/api/jobs?page=2&limit=50", { signal });
  });
});
