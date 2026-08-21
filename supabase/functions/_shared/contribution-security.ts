export function canonicalizeContributionUrl(raw: string) {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|gh_src|source|ref)/i.test(key)) url.searchParams.delete(key);
    }
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return "";
  }
}

export function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "0.0.0.0" || host === "::1") return true;
  const parts = host.split(".").map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
      parts[0] >= 224;
  }
  return host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:") || host === "::";
}

export function htmlToPlainText(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&pound;/gi, "£")
    .replace(/&#8358;/gi, "₦")
    .replace(/\s+/g, " ")
    .trim();
}

export function pageTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? htmlToPlainText(match[1]).slice(0, 240) : "";
}

export function salaryEvidenceExcerpt(text: string, advertisedSalary: string) {
  if (!/(₦|NGN|Naira|USD|GBP|EUR|\$|£|€)/i.test(advertisedSalary)) return { verified: false, excerpt: "" };
  const claimedNumbers = (advertisedSalary.match(/\d[\d,.]*/g) ?? [])
    .map((value) => value.replace(/\D/g, ""))
    .filter((value) => value.length >= 4);
  const compactText = text.replace(/\D/g, "");
  const verified = claimedNumbers.length > 0 && claimedNumbers.every((value) => compactText.includes(value));
  if (!verified) return { verified: false, excerpt: "" };
  const first = claimedNumbers[0];
  const loose = first.split("").join("[\\s,.]*");
  const index = text.search(new RegExp(loose));
  const start = Math.max(0, index - 180);
  return { verified: true, excerpt: text.slice(start, Math.min(text.length, index + 320)).trim() };
}

export function normalizedContributionPayload(value: unknown) {
  if (typeof value === "string") return value.trim().toLowerCase().replace(/\s+/g, " ");
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (Array.isArray(value)) return value.map(normalizedContributionPayload).join("|");
  if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${key}:${normalizedContributionPayload(item)}`)
    .join("|");
  return "";
}
