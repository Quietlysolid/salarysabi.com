import type { Job } from "./jobs";

/** Load every API page so retrying preserves the server-rendered board's coverage. */
export async function fetchJobListings(signal: AbortSignal): Promise<Job[]> {
  const jobs: Job[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await fetch(`/api/jobs?page=${page}&limit=50`, { signal });
    if (!response.ok) throw new Error("Jobs unavailable");
    const result = await response.json() as { data?: Job[]; pagination?: { page?: number; totalPages?: number } } | null;
    if (!Array.isArray(result?.data) || result?.pagination?.page !== page ||
        typeof result?.pagination?.totalPages !== "number" || !Number.isInteger(result.pagination.totalPages) || result.pagination.totalPages < page) {
      throw new Error("Invalid jobs response");
    }
    jobs.push(...result.data);
    totalPages = result.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);
  return jobs;
}
