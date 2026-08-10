# SalarySabi interactive accessibility audit

**Audit date:** 7 August 2026  
**Target:** Representative public routes at desktop 1440 × 1100 and mobile 500 × 900  
**Tool:** Playwright Chromium against the local production build

**Figma evidence board:** https://www.figma.com/design/uoMEpErIl15eDu7g0lJxTs

## Overall verdict

The sampled public experience has a sound semantic and responsive foundation. The audit initially confirmed insufficient contrast in repeated helper and footer text, dark-green accents on dark-green panels, narrow mobile job actions, and employer guidance appearing before the active mobile form. Those issues were corrected and the complete evidence set was recaptured.

The final automated pass found no normal-text contrast failures, unlabeled visible controls, duplicate IDs, heading-level skips, or horizontal overflow in the sampled states. Keyboard focus was visible through every sampled sequence. This does not establish complete WCAG conformance or replace testing with assistive-technology users.

## Flow steps and health

1. **Homepage and calculator, healthy.** Clear landmarks, one visible H1, complete accessible names, visible focus and a polite live result region. Evidence: [01-home.png](01-home.png).
2. **Payslip checker, healthy.** Labeled controls, logical focus order and no overflow. Evidence: [02-payslip.png](02-payslip.png).
3. **Jobs discovery, healthy with production verification pending.** Server-rendered listings, reachable filters and actions, honest status, improved action targets. Evidence: [03-jobs.png](03-jobs.png).
4. **Post a job, healthy with submission-state testing remaining.** Required-field validation focuses the first invalid field. Evidence: [04-post-job.png](04-post-job.png).
5. **Account gateway, healthy with authenticated states unverified.** Entry choices and controls are named and keyboard reachable. Evidence: [05-account.png](05-account.png).
6. **PAYE methodology, healthy.** Ledger structure reflows without overflow and corrected lime accents remain readable. Evidence: [06-methodology.png](06-methodology.png).
7. **Eligible deductions, healthy but cognitively dense.** Anchors and actions are reachable, and corrected CTA contrast passes the measured check. Evidence: [07-deductions.png](07-deductions.png).
8. **Tax bands, healthy with content refinement remaining.** Table text contrast now passes the sampled measurement. Evidence: [08-tax-bands.png](08-tax-bands.png).
9. **Privacy, technically healthy but long.** No structural or reflow failure was detected; reading burden remains a product-design concern. Evidence: [09-privacy.png](09-privacy.png).
10. **Disclaimer, healthy.** The repaired ledger retains a logical structure without overlap or overflow. Evidence: [10-disclaimer.png](10-disclaimer.png).
11. **Mobile homepage, healthy.** No horizontal overflow and all primary tasks remain keyboard reachable. Evidence: [11-home-mobile.png](11-home-mobile.png).
12. **Mobile jobs, healthy.** Result status precedes listings and filters are collapsed behind an accessible disclosure. Evidence: [12-jobs-mobile.png](12-jobs-mobile.png).
13. **Mobile jobs filters, healthy.** Expanded filters retain visible labels and a predictable single-column order. Evidence: [13-jobs-mobile-filters.png](13-jobs-mobile-filters.png).
14. **Mobile employer flow, improved and healthy.** The active form now appears before supporting guidance. Evidence: [14-post-job-mobile.png](14-post-job-mobile.png).
15. **Mobile privacy, technically healthy but very long.** The ledger stacks without overflow, though progressive disclosure remains desirable. Evidence: [15-privacy-mobile.png](15-privacy-mobile.png).
16. **Mobile disclaimer, healthy.** The evidence rows stack in a readable order without the earlier CSS collision. Evidence: [16-disclaimer-mobile.png](16-disclaimer-mobile.png).

## Confirmed strengths

- One main landmark and one visible H1 on every sampled route.
- No visible controls without accessible names.
- No duplicate IDs or heading-level skips in the sampled DOM.
- Visible focus indication across every sampled keyboard sequence.
- Keyboard-operated mobile menu with its five destination links exposed.
- Calculator result exposed through `aria-live="polite"`.
- Native employer-form validation focuses the first invalid field.
- No horizontal overflow at the tested desktop and mobile widths.
- Final sampled normal-text contrast measurements meet their applicable thresholds.

## Fixes made from this evidence

- Replaced low-contrast helper, table and footer colors with the shared readable muted token.
- Replaced dark-green-on-green accents with the lime token on active stages, methodology totals and deduction CTAs.
- Increased mobile navigation and job-action target height.
- Moved employer guidance after the active form on mobile.

## Remaining verification gaps

- Real NVDA, JAWS, VoiceOver and TalkBack output.
- Browser-native 200% and 400% zoom, not only narrow viewport reflow.
- Authenticated account and job-workspace states.
- Full employer submission, server rejection and recovery.
- Populated job details, save/apply/report workflows and session expiry.
- Exported PDF and spreadsheet accessibility.

Raw measurements and focus sequences are stored in [report.json](report.json). The repeatable runner is `scripts/accessibility-audit.mjs`.
