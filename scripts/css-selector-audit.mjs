import { readFileSync } from "node:fs";

const cssPath = "src/app/globals.css";
const css = readFileSync(cssPath, "utf8");
const selectorPattern = /(^|\})\s*([^@{}][^{}]*)\{/gm;
const counts = new Map();
let match;

while ((match = selectorPattern.exec(css))) {
  for (const rawSelector of match[2].split(",")) {
    const selector = rawSelector.trim().replace(/\s+/g, " ");
    if (selector && !selector.includes(":root")) counts.set(selector, (counts.get(selector) || 0) + 1);
  }
}

const duplicateBudgets = new Map([
  [".site-header", 12],
  [".calculator-shell", 11],
  [".payroll-banner", 10],
  [".tax-band-section", 9],
  [".job-submit", 9],
  [".jobs-hero", 8],
  [".job-search", 6],
]);

const failures = [];
for (const [selector, limit] of duplicateBudgets) {
  const actual = counts.get(selector) || 0;
  if (actual > limit) failures.push(`${selector} occurs ${actual} times; budget is ${limit}.`);
}

const bannedSelectors = [".evidence-row", ".evidence-ledger", ".evidence-page"];
for (const selector of bannedSelectors) {
  if (counts.has(selector)) failures.push(`${selector} is generic and collision-prone; use a route-owned namespace.`);
}

const requiredNamespaces = [".disclaimer-ledger-page", ".methodology-page", ".privacy-page", ".guided-home", ".paye-guide-page", ".tax-bands-page"];
for (const selector of requiredNamespaces) {
  if (!css.includes(selector)) failures.push(`Required route namespace ${selector} is missing.`);
}

const duplicates = [...counts.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]);
console.log(`CSS selector audit: ${css.split(/\r?\n/).length} lines, ${counts.size} normalized selectors, ${duplicates.length} repeated selectors.`);
console.log("Protected duplicate budgets:");
for (const [selector, limit] of duplicateBudgets) console.log(`  ${selector}: ${counts.get(selector) || 0}/${limit}`);

if (failures.length) {
  console.error("CSS ownership failures:");
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Route namespaces and collision budgets pass.");
}
