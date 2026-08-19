# SalarySabi whole-app visual product audit

Date: 7 August 2026

## Audit scope

Fresh local captures at 1440 px desktop and 390 px mobile, plus representative interactive states. The review covers the public shell, homepage calculator, payslip comparison, jobs discovery and detail, job submissions, account entry, authenticated workspace fixture, administrator entry, PAYE guide family, privacy and disclaimer.

## User goal and accessibility target

Visitors should be able to calculate PAYE, understand the result, check a payslip, find salary-transparent work, submit jobs and manage a job workspace without hidden actions, broken layout, unclear hierarchy or avoidable mobile friction. The visual target is responsive reflow with visible focus, readable copy, usable touch targets and no content clipping. Screenshot review does not establish WCAG compliance.

## Strengths

- The square, rectangular visual language is distinctive and consistent across most public surfaces.
- The green and lime system provides clear primary-action hierarchy.
- Public pages have strong plain-language headings and visible labels.
- The PAYE guide architecture clearly separates method, inputs and tax bands.
- Jobs load with server-rendered listings in the fresh audit and expose official sources.
- All ordinary public-route captures returned 200, produced one H1 and had no document-level horizontal overflow.
- Mobile forms generally reflow to one column without clipped inputs.

## Confirmed issues

### P1. Mobile disclaimer actions are completely hidden

Evidence: `mobile/disclaimer.png`.

The desktop disclaimer ends with three next steps, but the mobile page ends after the verification dates. All three action links compute to `display: none`. The cause is the unscoped mobile rule `nav a:not(.nav-cta):not(.nav-primary)`, which hides links in every navigation component rather than only the site header.

Impact: mobile visitors lose the primary paths to methodology, recalculation and privacy.

Recommendation: scope the selector to the legacy site header and add a regression assertion that all three disclaimer actions are visible at mobile width.

### P1. Authenticated workspace action leaves the viewport on mobile

Evidence: `mobile/workspace-fixture.png` and `mobile-geometry-report.json`.

The `Sign out` button begins at x=381 and ends at x=446 in a 390 px viewport. The workspace header keeps the long account email and action in one flex row.

Impact: a real signed-in user may be unable to see or activate the full sign-out control.

Recommendation: stack the workspace identity and action below 560 px, allow safe email wrapping and add an authenticated mobile overflow assertion.

### P2. Secondary guide actions collapse into loose text

Evidence: `desktop/eligible-deductions.png` and `desktop/how-paye-is-calculated.png`.

The deductions and methodology pages reproduce the same pattern previously found on the PAYE guide: the primary action is a strong rectangle, while the secondary action becomes an undersized text fragment. On mobile those secondary actions are only 21 px and 17 to 21 px high.

Impact: the relationship between paired actions is unclear, target size is weak and the page-level rectangular design system breaks at a high-value transition.

Recommendation: reuse one shared rectangular action-group contract for all guide endings, with explicit height, border, alignment and mobile stacking.

### P2. Calculator result becomes visually disconnected on desktop

Evidence: `states/02-calculator-result.png`.

Before calculation, the homepage workspace is balanced between calculator and explanation. After calculation, the result continues underneath the form in the left half while the right half ends above it, leaving a large blank region beside the most important output.

Impact: the result feels appended rather than central, the user has to scan down one narrow column and the evidence panel is no longer visually connected to the generated figure.

Recommendation: when a result exists, let the result span the workspace or replace the explainer in the right column, keeping the calculation form available without creating the empty half-page.

### P2. Mobile job-card actions are smaller than robust touch targets

Evidence: `mobile/jobs.png` and `mobile-geometry-report.json`.

Each `View job` and `Official application` action is 32 px high. Several guide-index actions are 39 to 40 px high.

Impact: links remain functional but are easier to miss or mistap, especially for visitors using touch or reduced dexterity.

Recommendation: make row actions at least 44 px high while preserving the compact rectangular list.

### P2. The mobile footer wordmark wraps into two lines everywhere

Evidence: all accepted public mobile screenshots.

`SalarySabi` breaks into `Salary` and `Sabi` next to the mark. The header intentionally uses only the mark, but the footer appears like a squeezed version of the full lockup rather than a deliberate mobile treatment.

Impact: the repeated brand signature looks less resolved than the desktop lockup and recalls the alignment problem previously reported in the wordmark.

Recommendation: reserve enough inline width for the complete wordmark or use the mark-only variant with an accessible name.

### P2. Tax-band mobile reference is technically reflowed but still too dense

Evidence: `mobile/tax-bands.png`.

The repaired two-column rows no longer overlap, but four labels and four values are compressed into each narrow row. Several labels are 10 px and the maximum-tax value sits close to the row boundary.

Impact: the table is correct but difficult to scan, particularly for users comparing rates and ranges.

Recommendation: use one band card per row with the band as a full-width heading and a three-item detail grid for range, rate and maximum tax.

### P3. Long reference pages carry high mobile scan cost

Evidence: `mobile/privacy.png` at 4567 px, `mobile/eligible-deductions.png` at 4081 px and `mobile/how-paye-is-calculated.png` at 3855 px.

The content is structurally sound, but returning to the index or moving between related guides requires substantial scrolling.

Recommendation: add a compact `Back to section index` affordance after major groups or a non-obstructive sticky section control.

### P3. Job-detail account action is presented as explanatory text

Evidence: `desktop/job-detail.png` and `mobile/job-detail.png`.

The official application action is clear, but `Sign in or create an account to save and track this job` appears as plain text instead of an explicit rectangular action.

Impact: workspace conversion is easy to overlook after reading a job.

Recommendation: render a clear secondary action linking to `/account` while keeping the official application primary.

### P3. Several supporting labels fall below the documented 12 px floor

Evidence: `mobile-geometry-report.json`.

Examples include 10 px step numbers on deductions and tax bands, 11 px guide numbers, 11.2 px job audience labels and the 11 px calculator privacy note.

Impact: these are supporting rather than core instructions, but they weaken readability at small screens and contradict the audit tracker’s completion claim.

Recommendation: raise meaningful supporting text to at least 12 px and keep purely decorative sequence numbers exempt only when the same information is available in the adjacent label.

## Route-by-route health

1. Homepage and calculator, partial: clear initial state; desktop calculated-result layout needs restructuring.
2. Account gateway, healthy with verification gap: sign-in and create-account states are balanced; real expired-session and recovery states remain unverified.
3. Administrator entry, healthy with verification gap: mobile and desktop entry layouts hold; authenticated failure states require a test administrator.
4. Disclaimer, blocked on mobile: all next-step links are hidden.
5. Eligible deductions, partial: reference content reflows correctly; closing secondary action is visually collapsed and the page is very long.
6. PAYE methodology, partial: ledger and rules are strong; closing secondary action collapses and the result remains generic.
7. Jobs discovery, healthy with touch-target refinement: listings loaded quickly in this run and filters reflow; job-row actions are undersized.
8. Job detail, partial: source and salary trust are strong; workspace conversion is too passive.
9. PAYE guide index, healthy after the latest CTA repair.
10. Payslip checker, healthy in empty and populated states; unusual deduction cases and live announcements still need assistive-technology testing.
11. Post a job, healthy in the first two mobile steps; save-and-return expectations and live server recovery remain unresolved.
12. Privacy, healthy but dense: the short version is useful; mobile full-reference scanning is demanding.
13. Share an existing job, healthy: clear audience distinction and focused form; duplicate/review timing remains light.
14. Tax bands, partial: desktop grid is repaired; mobile reference needs a more legible card structure.
15. Authenticated job workspace fixture, blocked on mobile: sign-out action is clipped.

## Accessibility risks and evidence limits

- Fresh screenshots and DOM geometry confirm reflow, visibility and target-size risks, but not screen-reader output or full keyboard behavior.
- Native browser validation was triggered for both submission forms, but browser tooltip rendering is not reliably captured in headless screenshots.
- Real account, administrator, Supabase failure and email-delivery states were not mutated during this audit.
- The temporary skip-link block seen in one full-page capture was verified as a screenshot artifact; it remains translated above the viewport and is not a live defect.
- The complete Playwright suite could not start its own server because the approved local preview server already held the Next.js development lock. Direct browser checks completed against the active preview instead.

## Recommended order

1. Restore the mobile disclaimer actions by scoping the global navigation selector.
2. Fix authenticated mobile workspace overflow.
3. Consolidate all paired guide CTAs into one rectangular action-group pattern.
4. Recompose the calculated homepage result state.
5. Increase mobile job and guide action targets.
6. Resolve the footer lockup and tax-band mobile density.
7. Address long-page navigation and remaining supporting text sizes.

## Evidence

- Desktop captures: `design-audit/whole-app-current/desktop/`
- Mobile captures: `design-audit/whole-app-current/mobile/`
- Interactive states: `design-audit/whole-app-current/states/`
- Route and console report: `design-audit/whole-app-current/capture-report.json`
- Mobile geometry report: `design-audit/whole-app-current/mobile-geometry-report.json`
