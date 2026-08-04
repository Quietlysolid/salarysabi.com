const apiKey = Deno.env.get("CAREERJET_API_KEY");
const allowedCurrencies = new Set(["NGN", "USD", "GBP", "EUR"]);

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") || "";
  const permittedOrigin = /^https:\/\/(www\.)?salarysabi\.com$/.test(origin);
  if (request.method === "OPTIONS") return new Response(null, { status: permittedOrigin ? 204 : 403, headers: { "Access-Control-Allow-Origin": permittedOrigin ? origin : "https://salarysabi.com", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!apiKey) return Response.json({ error: "Careerjet publisher credentials are not configured" }, { status: 503 });
  if (!permittedOrigin) return new Response("Forbidden", { status: 403 });
  const input = await request.json().catch(() => ({})) as Record<string, unknown>;
  const endpoint = new URL("https://search.api.careerjet.net/v4/query");
  endpoint.searchParams.set("locale_code", "en_NG");
  endpoint.searchParams.set("keywords", String(input.keywords || ""));
  endpoint.searchParams.set("location", String(input.location || "Nigeria"));
  endpoint.searchParams.set("page_size", "50");
  endpoint.searchParams.set("sort", "date");
  endpoint.searchParams.set("user_ip", request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1");
  endpoint.searchParams.set("user_agent", request.headers.get("user-agent") || "SalarySabi job search");
  const authorization = btoa(`${apiKey}:`);
  const response = await fetch(endpoint, { headers: { Authorization: `Basic ${authorization}`, Accept: "application/json" } });
  const responseText = await response.text();
  if (!response.ok) return Response.json({ error: `Careerjet returned ${response.status}`, detail: responseText.slice(0, 500) }, { status: 502 });
  const payload = JSON.parse(responseText) as { jobs?: Record<string, unknown>[] };
  const jobs = (payload.jobs || []).flatMap((job) => {
    const currency = String(job.salary_currency_code || "").toUpperCase();
    const minimum = Number(job.salary_min); const maximum = Number(job.salary_max);
    const salaryType = String(job.salary_type || "").toUpperCase();
    if (!allowedCurrencies.has(currency) || minimum <= 0 || maximum < minimum || !["M", "Y"].includes(salaryType)) return [];
    return [{ title: String(job.title || ""), company: String(job.company || ""), location: String(job.locations || "Nigeria"), description: String(job.description || ""), salary_min: minimum, salary_max: maximum, salary_currency: currency, salary_period: salaryType === "M" ? "monthly" : "annual", url: String(job.url || ""), source_name: "Careerjet", verification: "Licensed feed", salary_evidence: "Salary reported by Careerjet" }];
  });
  return Response.json({ jobs, excluded_without_precise_salary: (payload.jobs || []).length - jobs.length }, { headers: { "Access-Control-Allow-Origin": origin, "Cache-Control": "private, max-age=300" } });
});
