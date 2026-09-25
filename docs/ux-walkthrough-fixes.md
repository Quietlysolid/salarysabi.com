# First-visit UX fixes — 24 September 2026

- Calculator results: readable community link with hover and focus states.
- Hiring: signup, sign-in and password recovery stay on `/hiring`.
- Empty jobs: a take-home calculation is offered before the employer link.
- Job posting: role/company/salary review with edit controls that preserve application fields.
- Salary preview: incomplete or invalid ranges display an instruction instead of a candidate-facing range.

Validation: 8 desktop/mobile Playwright checks, 130 unit tests, TypeScript and targeted ESLint passed. Authentication requests were intercepted in browser tests; no real accounts, emails or job submissions were created. The browser checks include password mismatch, successful recovery and expired-link handling. The jobs empty state was inspected in the local browser.

Supabase Auth must allow `/hiring` and `/hiring?recovery=1` as exact email return URLs. These were added and read back on the configured production project for `https://salarysabi.com`, `https://www.salarysabi.com` and `http://localhost:3000`, preserving existing entries. Apply equivalent exact entries to other environments before testing real email links.

This validation covers the implementation locally; it is not a live deployment or a new end-to-end email-delivery verification.

## Follow-up walkthrough fixes

- Job drafts persist in tab session storage across sign-in navigation, browser Back and reload. Recruiter fields and the current step are restored. Discard and successful submission clear the saved draft; unavailable storage does not block the form.
- Hiring has a return-to-draft link when entered from the job form. Draft storage is disclosed in the privacy notice.
- Homepage, individuals and calculator entry links check public availability. Empty responses show an availability notice; failed requests do not imply no inventory.
- The empty jobs page offers refresh, with the calculator as a secondary option. The salary community explicitly states when comparisons are unavailable.
- Calculator examples are labelled, NHF and other deductions have help, and screen-reader labels remain separate from descriptions. A zero company-tax estimate explains its reason beside the total.

Regression coverage is in `tests/ux-followup.spec.ts`, alongside the existing job-submission and UX suites. These tests intercept write requests; they do not publish jobs or send email. Real job listings and reviewed salary reports still require contributions.
