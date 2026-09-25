import { beforeEach, expect, test, vi } from "vitest";

const { readPage, context } = vi.hoisted(() => ({ readPage: vi.fn(), context: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getPublishedJobsPage: readPage }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: context }));
import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  context.mockReturnValue({ env: {} });
  readPage.mockResolvedValue({ jobs: [], total: 0 });
});

test("unsafe pagination is rejected before reading the database", async () => {
  const response = await GET(new Request("https://salarysabi.com/api/jobs?page=9007199254740991"));
  expect(response.status).toBe(400);
  expect(readPage).not.toHaveBeenCalled();
  expect(context).not.toHaveBeenCalled();
});

test("ordinary pagination preserves the 50-record cap", async () => {
  const response = await GET(new Request("https://salarysabi.com/api/jobs?page=2&limit=99999"));
  expect(response.status).toBe(200);
  expect(readPage).toHaveBeenCalledWith(50, 50);
});

test("invalid page text retains the first-page fallback", async () => {
  const response = await GET(new Request("https://salarysabi.com/api/jobs?page=abc"));
  expect(response.status).toBe(200);
  expect(readPage).toHaveBeenCalledWith(0, 20);
});
