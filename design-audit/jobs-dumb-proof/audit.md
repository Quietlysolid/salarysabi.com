# Jobs flow dumb-proof audit

Date: 2026-08-19

## Scope

Can a first-time job seeker understand the available roles, trust the salary and verification claims, and know whether to view details or apply?

## Evidence

1. [Desktop listing](./01-desktop.png) — readable, but overloaded for one result and contains competing job-seeker and employer actions.
2. [Mobile listing](./02-mobile.png) — reflows cleanly, but the listing still presents two unclear actions and repeated employer promotions.
3. [Job detail](./03-job-detail.png) — provides useful caveats, but contradicts the listing page's verification and source claims.

## Verdict

Not 100% dumb-proof. The layout is usable, but the trust language is internally inconsistent. The listing calls the role verified and says it was checked against an employer source, while the detail page says verification is pending, the vacancy has not been confirmed by the employer, and the salary was reported by Indeed.

## Strengths

- Salary, role, employer, location, work arrangement, and employment type are easy to scan.
- Mobile reflow is clean and filters collapse behind a clear control.
- The detail page discloses missing deadline and verification limitations.
- The external application destination is separated from the internal details route.

## Highest-impact issues

1. `Verified job listings` conflicts with `Verification pending` and `The vacancy has not yet been confirmed directly with the employer.` This is a serious trust problem.
2. `checked against the employer's official source` conflicts with `Salary reported by Indeed`. The page must state the actual source plainly.
3. `Official application` is vague beside `View job`. Use `View details` and `Apply on Indeed` so users understand both destinations.
4. A prominent apply button is shown while verification is pending and no deadline exists. The warning should sit directly beside or above the apply action.
5. `80/100 transparency score` requires interpretation and is not actionable. Replace it with a short checklist: salary shown, deadline missing, employer confirmation pending.
6. Search filters, sorting, `1 job found`, and `end of results` create excessive interface for one listing. Hide sorting and keep filters collapsed until more than one result exists.
7. The employer promotion is repeated three times: the large hiring panel, `Share an existing job`, and `Post your own job`. Keep one compact employer action after job-seeker content.
8. `Save or track this job` tells users to sign in but provides no visible sign-in action.

## Accessibility risks

- Visible contrast, touch-target size, and mobile reflow look acceptable in the captured screens.
- Keyboard navigation, filter state announcements, external-link announcements, focus order, screen-reader labels, and zoom behavior still require interactive testing.

## Recommended order

1. Replace the hero with `Jobs with salaries` and a factual source statement.
2. Label this listing `Source reviewed` or `Verification pending`; do not call it verified.
3. Rename actions to `View details` and `Apply on Indeed`.
4. Replace the numeric transparency score with a plain checklist.
5. Remove sorting and reduce filters while only one job exists.
6. Keep one compact employer contribution prompt.
7. Add a visible `Sign in to save` action.
