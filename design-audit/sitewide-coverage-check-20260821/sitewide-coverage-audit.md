# SalarySabi sitewide coverage check

Date: 21 August 2026

## Verdict

The current implementation covers the frozen homepage requirements and the public-site coherence changes identified in the 19 and 21 August audits. It preserves the selected Option 3 calculator and result while making pay tools, jobs and salaries, employer tools, funded contributions and trust evidence legible as one platform.

This is not a claim that every authenticated or operational system has received a fresh end-to-end audit. Authenticated admin, payroll workspace, contributor payout, scheduled import execution, external application handoff, assistive technology and high-zoom behavior remain separate verification scopes.

## Homepage freeze cross-check

- Task-based header: Pay & tax; Jobs & salaries; For employers; Learn — covered.
- Calculator remains the first and dominant task — covered.
- Platform sentence under the H1 — covered.
- Initial result explains what will appear; mobile remains compact — covered.
- Calculated result retains take-home pay, PAYE, effective rate, review date and three numbered next steps — covered.
- Three platform paths below the calculator — covered.
- Funded contributions framed around approved evidence, not clicks — covered.
- Trust section covers official rules, five-report anonymity and original job evidence — covered.
- Grouped footer remains secondary navigation — covered.
- No generic marketing hero, fake data, testimonial block or rewards navigation item was introduced — covered.

## Holistic public-site cross-check

- Shared task-based navigation and terminology — covered.
- Jobs and salaries hub normalized into three equal outcomes — covered.
- Salary comparison empty state previews what five reports unlock — covered.
- Jobs show salary source and confidence before application — covered.
- Payslip checker explains outcome, privacy, freshness and next actions — covered.
- Employer hub uses the promise “Hire transparently and pay people correctly” — covered.
- Contributions lead with public benefit and retain funded rewards inside offer cards — covered.
- About describes the complete employee, jobseeker and employer platform — covered.
- Calculator empty submission, single-main structure and test drift — covered by automated verification.
- Email/reward identity separation is explained before rewarded salary submission — covered in the form and privacy copy.

## Fresh evidence steps

| Step | Surface | Health |
| --- | --- | --- |
| 1 | Homepage initial state | Healthy |
| 2 | Homepage calculated result | Healthy |
| 3 | Jobs and salaries hub | Healthy |
| 4 | Salary comparison empty state | Healthy for the current dataset stage |
| 5 | Jobs with salaries | Healthy; one current listing limits discovery depth |
| 6 | Payslip comparison result | Healthy |
| 7 | Employer hub | Healthy |
| 8 | Contributor programme | Healthy |
| 9 | PAYE guide | Healthy |
| 10 | About and trust | Healthy |
| 11 | Mobile homepage result and continuation | Healthy; long but deliberately structured |
| 12 | Mobile contributor programme | Healthy |

All twelve current captures have one H1, one main landmark, one `#main-content` target, no horizontal overflow and no captured console errors.

## Evidence limits

- Screenshot and DOM evidence cannot certify WCAG compliance or screen-reader output.
- Authenticated admin, payroll, contributor wallet and payout paths were not recaptured in this check.
- Production API keys, schedules, email delivery and external ATS/application availability require operational monitoring rather than visual inspection.
