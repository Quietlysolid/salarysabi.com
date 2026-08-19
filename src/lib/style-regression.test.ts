import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
const disclaimer = readFileSync(resolve(root, "src/app/disclaimer/page.tsx"), "utf8");
const methodology = readFileSync(resolve(root, "src/app/how-paye-is-calculated/page.tsx"), "utf8");
const privacy = readFileSync(resolve(root, "src/app/privacy/page.tsx"), "utf8");

describe("route-owned style isolation", () => {
  it("keeps underlined links continuous across the site", () => {
    expect(css).toMatch(/a\s*\{[^}]*text-decoration-skip-ink:\s*none;/s);
  });

  it("prevents content-link styles from overriding shared buttons", () => {
    expect(css).toMatch(/a\.primary-button,\s*button\.primary-button\s*\{[^}]*color:\s*var\(--primary-button-text,\s*var\(--white\)\)\s*!important;[^}]*text-decoration-line:\s*none\s*!important;/s);
    expect(css).toMatch(/a\.secondary-button,\s*button\.secondary-button\s*\{[^}]*color:\s*var\(--secondary-button-text,\s*var\(--green-dark\)\)\s*!important;[^}]*text-decoration-line:\s*none\s*!important;/s);
    expect(css).toContain("--secondary-button-text: var(--white)");
    expect(css).toMatch(/a\.primary-button:hover,[^}]*background:\s*var\(--primary-button-hover-bg,\s*var\(--green-dark\)\)\s*!important;/s);
    expect(css).toContain("--primary-button-hover-bg: #d8ff80");
    expect(css).toMatch(/a\.primary-button:focus-visible,[^}]*outline:\s*3px solid var\(--button-focus-ring,\s*var\(--ink\)\);/s);
  });

  it("keeps the disclaimer ledger under a disclaimer namespace", () => {
    expect(disclaimer).toContain('className="disclaimer-summary-grid"');
    expect(disclaimer).not.toMatch(/className="evidence-(page|row|ledger|actions)/);
    expect(css).not.toMatch(/(^|[\s,{])\.evidence-row(?=[\s:{>,.#])/m);
  });

  it("does not reuse critical ledger row classes across routes", () => {
    expect(methodology).toContain('className="methodology-evidence-row"');
    expect(methodology).not.toContain("disclaimer-ledger-row");
    expect(privacy).toContain('className="privacy-ledger-row"');
    expect(privacy).not.toContain("disclaimer-ledger-row");
  });

  it("retains explicit route roots for the critical ledger families", () => {
    expect(css).toContain(".disclaimer-ledger-page");
    expect(css).toContain(".methodology-page");
    expect(css).toContain(".privacy-page");
  });
});

describe("sitewide typography contract", () => {
  it("uses named display, title, body and caption roles", () => {
    for (const token of [
      "--ss-type-display-hero",
      "--ss-type-page-title",
      "--ss-type-section-title",
      "--ss-type-body-large",
      "--ss-type-body",
      "--ss-type-helper",
      "--ss-type-caption",
    ]) {
      expect(css).toContain(token);
    }
  });

  it("keeps the public weight scale intentionally small", () => {
    const weights = [...css.matchAll(/font-weight:\s*(\d+)/g)].map((match) => Number(match[1]));
    expect(new Set(weights)).toEqual(new Set([400, 600, 700, 800]));
  });

  it("uses proportional tracking and tabular operational numbers", () => {
    expect(css).not.toMatch(/letter-spacing:\s*-?[\d.]+px/);
    expect(css).toContain("font-variant-numeric: tabular-nums lining-nums");
  });

  it("gives job and account titles the shared display treatment", () => {
    expect(css).toMatch(/#main-content\s+:is\([\s\S]*\.job-detail-heading,[\s\S]*\.account-preview,[\s\S]*\) h1 \{[\s\S]*font-family:\s*var\(--font-display\);/);
  });

  it("does not duplicate fallback families already owned by font tokens", () => {
    expect(css).not.toMatch(/font-family:\s*var\(--font-(?:display|body)\),\s*sans-serif/);
  });
});
