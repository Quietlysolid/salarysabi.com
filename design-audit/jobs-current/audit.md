# SalarySabi jobs page audit

Date: 5 August 2026

## Audit scope

Combined UX and visual accessibility audit of the locally rendered jobs discovery page at 1440px wide. Evidence comes only from the populated state captured in this audit run.

## User goal and accessibility target

A Nigerian job seeker should be able to identify relevant salary-transparent roles, understand the pay and deadline, narrow the list quickly, judge source credibility, and continue to the official application without confusion.

## Evidence

- `01-jobs-top.png`: entry, filters, and first listings
- `02-jobs-full.png`: complete populated results page

## Step 1: Understand the jobs promise

Health: Clear promise, weak scope

### Strengths

- “See the pay before you apply” is an excellent and differentiated promise.
- The introduction clearly says listings link to original application pages.
- The active navigation state and SalarySabi brand remain consistent.

### Risks

- The page does not explain which jobs are included, how often listings are checked, or whether coverage is comprehensive.
- There is no visible distinction between Nigerian employers, foreign missions, remote employers, and international roles.
- The first screen promises salary transparency but does not explain salary currency, gross versus net pay, or whether figures are normalized.
- The decorative line above the eyebrow has no clear purpose and adds vertical delay before the core task.

## Step 2: Search and filter

Health: Functional but too generic

### Strengths

- Search, work arrangement, and location are available before the listings.
- Filters use familiar native controls and fit in one horizontal row.
- The result count updates the user's sense of scope.

### Risks

- The search field placeholder is broad and visually resembles entered content.
- `Where you'll work` is an unclear label for what appears to be work arrangement.
- `All` and `All locations` provide no sense of the available choices.
- Salary is the product differentiator, but salary range and currency filters are hidden under `More filters`.
- `More filters` looks like plain text rather than a substantial control.
- There is no clear-filter action, applied-filter summary, sorting, or “newest/closing soon/highest pay” control.
- No result explanation says why only six jobs match or whether filters are active.

## Step 3: Scan and compare listings

Health: Information-rich but hard to compare

### Strengths

- Salary is visible on every card.
- Employer, location, arrangement, employment type, source freshness, and closing date are present.
- Links to the detail page and original employer source are both available.
- Source-checked language supports trust.

### Risks

- All six visible roles are from the U.S. Embassy or Consulate, making the page look like a single-employer feed rather than a Nigerian salary-transparent marketplace.
- Salary is displayed in U.S. dollars with no explicit currency label, conversion context, or explanation of why a Nigerian role is denominated that way.
- Annual salary alone makes monthly comparison difficult for Nigerian job seekers.
- Cards are tall and text-heavy, so only one and a half listings fit in the first viewport.
- Job descriptions are truncated inconsistently and add scanning noise without enough decision value.
- Location, on-site status, and full-time status resemble low-contrast badges and compete weakly with the title.
- `Official Source Checked` is visually detached from source-check date and does not explain what was verified.
- Closing dates are buried in the footer. The first listing closes on the current date but has no urgent treatment.
- Source-checked date and closing date use similar low-emphasis typography even though the deadline is more important.
- `View job` and `Apply on company site` have similar emphasis, making the preferred next action unclear.
- External-link behavior is only indicated by a small icon.
- No saved-job affordance appears even though `My jobs` is a primary navigation destination.
- There is no obvious way to compare salaries across listings.
- Repeated card borders create a long document-like stack rather than an efficient results interface.

## Step 4: Reach the end and recover

Health: Incomplete

### Risks

- There is no pagination, load-more control, or explanation that all results are shown.
- No empty, error, offline, or stale-data state is visible in this capture.
- There is no prompt to suggest a missing job, post a role, or explain SalarySabi's listing standards at the end.
- The full capture does not show a resolved footer transition, making the page feel like it ends abruptly after the last card.

## Accessibility risks

- Small muted metadata, badges, and result count require numeric contrast verification.
- Filter labels are visible, but accessible names, keyboard focus, expanded state for more filters, and clear-filter behavior need interaction testing.
- Multiple repeated `View job` and `Apply on company site` links need enough accessible context to identify the associated role.
- Source badge and external-link icon meaning should not depend on visuals alone.
- Closing-soon urgency must not rely only on color if added.
- Mobile reflow, 200% zoom, touch targets, focus order, live result announcements, and loading state communication were not visible in the screenshots.

## Highest-impact opportunities

1. Make salary comparison the organizing principle, including currency and monthly equivalents.
2. Improve result density so users can compare several roles at once.
3. Promote deadline, employer, location, and salary while reducing description noise.
4. Make filters reflect the product promise: salary range, currency, location, arrangement, and closing date.
5. Clarify source verification and connect the badge to its checked date.
6. Establish a clear primary action and a usable save flow.
7. Explain coverage and provide a deliberate end state.

## Evidence limits

This audit does not confirm live filtering, keyboard behavior, screen-reader output, mobile reflow, empty/error states, job-detail quality, source accuracy, application-link safety, or salary-data correctness. Those require interaction testing and additional states.
