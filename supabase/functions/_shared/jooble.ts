export type JoobleJob = {
  id: string | number;
  title?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  source?: string;
  type?: string;
  link?: string;
  company?: string;
  updated?: string;
};

export type SalaryRange = {
  minimum: number;
  maximum: number;
  period: "monthly" | "annual";
};

function expandAmount(raw: string) {
  const normalized = raw.replace(/,/g, "").trim().toLowerCase();
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([km])?$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * (match[2] === "k" ? 1_000 : match[2] === "m" ? 1_000_000 : 1));
}

export function parseNgnSalary(rawSalary: string | undefined): SalaryRange | null {
  if (!rawSalary) return null;
  const salary = rawSalary.replace(/\u00a0/g, " ").trim();
  const amount = String.raw`(\d[\d,]*(?:\.\d+)?(?:\s*[km](?![a-z]))?)`;
  const currency = String.raw`(?:\u20a6|\bNGN\b|\bNaira\b)`;
  const separator = String.raw`(?:-|\u2013|\u2014|to)`;
  const currencyFirst = new RegExp(`${currency}\\s*${amount}(?:\\s*${separator}\\s*(?:${currency}\\s*)?${amount})?`, "i").exec(salary);
  const currencyLast = new RegExp(`${amount}(?:\\s*${separator}\\s*${amount})?\\s*${currency}`, "i").exec(salary);
  const match = currencyFirst || currencyLast;
  if (!match) return null;

  const minimum = expandAmount(match[1]);
  const maximum = expandAmount(match[2] || match[1]);
  if (minimum === null || maximum === null || maximum < minimum) return null;

  const context = salary.slice(Math.max(0, match.index - 80), match.index + match[0].length + 80);
  if (/\b(?:hour|day|week|daily|weekly|hourly)\b/i.test(context)) return null;
  const period = /\b(?:year|annual|annum|yearly)\b/i.test(context) ? "annual" : "monthly";
  return { minimum, maximum, period };
}

export function normalizeEmploymentType(rawType: string | undefined) {
  const type = (rawType || "").toLowerCase();
  if (type.includes("part")) return "Part time" as const;
  if (type.includes("contract") || type.includes("freelance")) return "Contract" as const;
  if (type.includes("intern")) return "Internship" as const;
  return "Full time" as const;
}

export function inferWorkMode(job: Pick<JoobleJob, "title" | "location" | "snippet">) {
  const text = `${job.title || ""} ${job.location || ""} ${job.snippet || ""}`.toLowerCase();
  if (/\bremote\b|work from home/.test(text)) return "remote" as const;
  if (/\bhybrid\b/.test(text)) return "hybrid" as const;
  return "onsite" as const;
}

export function stripHtml(value: string | undefined) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyJob(job: Pick<JoobleJob, "id" | "title" | "company">) {
  const base = `${job.title || "job"}-${job.company || "company"}`
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 90);
  return `${base}-${String(job.id).replace(/[^a-zA-Z0-9]/g, "").slice(-16)}`;
}
