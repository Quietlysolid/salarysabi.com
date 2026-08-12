# SalarySabi interface consistency audit

## Scope

Public marketing, calculator, salary, jobs, guide, employer, account and form-flow templates at 1900×920 desktop and 390×844 mobile.

## User goal and accessibility target

Users should recognize every route as the same product, understand the page hierarchy immediately, and complete core tasks without relearning control or layout patterns. The visual pass targets readable hierarchy, predictable reflow and consistently sized controls; screenshots alone do not establish WCAG compliance.

## Findings

1. **Platform and product hubs — needs alignment.** `desktop-home.png`, `desktop-business.png` and `desktop-salaries-and-jobs.png` used competing content widths, hero scales and card density.
2. **Calculators and results — needs alignment.** `desktop-company-tax.png`, `desktop-payslip-checker.png` and the homepage calculator used different title scales, panel padding and field heights for equivalent tasks.
3. **Salary and jobs — generally healthy, with template drift.** `desktop-salaries.png` and `desktop-jobs.png` had strong honest empty/live states, but their outer spacing and hierarchy did not follow the same page system.
4. **Guides and references — healthy content, inconsistent framing.** `desktop-paye-guide.png`, `desktop-how-paye-is-calculated.png`, `desktop-eligible-deductions.png` and `desktop-tax-bands.png` used several widths and heading scales.
5. **Employer and account flows — functionally clear, visually separate.** `desktop-payroll.png`, `desktop-post-a-job.png` and `desktop-account.png` had good task guidance but different panel and control geometry.
6. **Mobile reflow — healthy after normalization.** `after-mobile-home.png`, `after-mobile-business.png`, `after-mobile-payslip-checker.png`, `after-mobile-post-a-job.png` and `after-mobile-account.png` retain readable order, full-width controls and no visible horizontal overflow.

## Implemented system

- One 1120px public content grid and one 1180px dense-workspace grid.
- Shared desktop, tablet and mobile gutters.
- Shared hero and section-title scales.
- Shared page-top, page-bottom and section rhythm.
- 52px form-control and button baseline.
- Shared panel padding and square-corner language.
- Page-family exceptions retained only where the content requires them.

## Evidence limits

Screenshots confirm visual hierarchy and reflow only. Keyboard navigation, focus order, screen-reader names, live-region behavior, contrast calculation and zoom behavior still require automated and hands-on accessibility testing.
