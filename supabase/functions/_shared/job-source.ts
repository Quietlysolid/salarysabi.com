import { parseNgnSalary, stripHtml, type SalaryRange } from "./jooble.ts";

export type AtsProvider = "greenhouse" | "lever";

export function normalizeIdentityPart(value: string | undefined) {
  return stripHtml(value).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function jobDedupeKey(title: string, company: string, location: string) {
  return [title, company, location].map(normalizeIdentityPart).join("|");
}

export function canonicalizeJobUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|gh_src|lever-source|source|ref)/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function isNigeriaRelevant(location: string, description = "") {
  const normalizedLocation = stripHtml(location);
  if (/\bnigeria\b|\blagos\b|\babuja\b|\bport harcourt\b|\bibadan\b|\bkano\b|\benugu\b/i.test(normalizedLocation)) return true;

  // Employer boilerplate often mentions Nigeria even when the vacancy is based
  // elsewhere. Only inspect the description when the ATS location itself says
  // the role is remote, and then require an explicit broad remote region.
  if (!/\bremote\b/i.test(normalizedLocation)) return false;
  const remoteScope = `${normalizedLocation}. ${stripHtml(description)}`;
  return /\bremote\b[^.]{0,80}\b(?:africa|emea|worldwide|global)\b|\b(?:africa|emea|worldwide|global)\b[^.]{0,80}\bremote\b/i.test(remoteScope);
}

export function salaryFromText(...values: Array<string | undefined>): SalaryRange | null {
  for (const value of values) {
    const salary = parseNgnSalary(stripHtml(value));
    if (salary) return salary;
  }
  return null;
}

export function atsSlug(provider: AtsProvider, sourceId: string, title: string, company: string) {
  const base = `${title}-${company}`.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 80);
  return `${base}-${provider}-${sourceId.replace(/[^a-zA-Z0-9]/g, "").slice(-12)}`;
}
