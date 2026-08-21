import { describe, expect, it } from "vitest";
import { canonicalizeContributionUrl, htmlToPlainText, isPrivateHostname, normalizedContributionPayload, salaryEvidenceExcerpt } from "./contribution-security";

describe("contribution security helpers", () => {
  it("canonicalizes public HTTPS evidence URLs", () => {
    expect(canonicalizeContributionUrl("https://Example.com/jobs/1/?utm_source=x#apply")).toBe("https://example.com/jobs/1");
    expect(canonicalizeContributionUrl("http://example.com/jobs/1")).toBe("");
  });
  it("recognizes local and private network targets", () => {
    for (const host of ["localhost", "127.0.0.1", "10.2.3.4", "172.16.0.2", "192.168.1.2", "169.254.1.1", "::1"]) expect(isPrivateHostname(host)).toBe(true);
    expect(isPrivateHostname("careers.example.com")).toBe(false);
  });
  it("extracts visible salary evidence without storing the whole page", () => {
    const text = htmlToPlainText("<title>Role</title><script>bad()</script><p>We pay ₦450,000–₦600,000 per month.</p>");
    expect(text).not.toContain("bad()");
    expect(salaryEvidenceExcerpt(text, "₦450,000–₦600,000 per month").verified).toBe(true);
    expect(salaryEvidenceExcerpt(text, "₦900,000 per month").verified).toBe(false);
  });
  it("normalizes payload keys and whitespace deterministically", () => {
    expect(normalizedContributionPayload({ b: " Lagos  ", a: 4 })).toBe("a:4|b:lagos");
  });
});
