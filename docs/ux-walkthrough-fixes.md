# First-visit UX fixes — 24 September 2026

- Calculator results: readable community link with hover and focus states.
- Hiring: signup, sign-in and password recovery stay on `/hiring`.
- Empty jobs: a take-home calculation is offered before the employer link.
- Job posting: role/company/salary review with edit controls that preserve application fields.
- Salary preview: incomplete or invalid ranges display an instruction instead of a candidate-facing range.

Validation: 8 desktop/mobile Playwright checks, 130 unit tests, TypeScript and targeted ESLint passed. Authentication requests were intercepted in browser tests; no real accounts, emails or job submissions were created. The browser checks include password mismatch, successful recovery and expired-link handling. The jobs empty state was inspected in the local browser.

Supabase Auth must allow `/hiring` and `/hiring?recovery=1` as exact email return URLs. These were added and read back on the configured production project for `https://salarysabi.com`, `https://www.salarysabi.com` and `http://localhost:3000`, preserving existing entries. Apply equivalent exact entries to other environments before testing real email links.

This validation covers the implementation locally; it is not a live deployment or a new end-to-end email-delivery verification.
