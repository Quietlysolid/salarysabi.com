# Salary benchmarks dumb-proof audit

Date: 2026-08-19

## Scope

Can a first-time visitor understand the available salary data, compare their pay, and complete the anonymous two-step salary report without guessing?

## Evidence

1. [Desktop start](./01-desktop-start.png) — readable, but the promised comparison has no usable data and the empty-state explanation is dense.
2. [Mobile start](./02-mobile-start.png) — clean reflow, but the oversized introduction and empty benchmark panel delay the only available action.
3. [Desktop step 2](./03-desktop-step-2.png) — fields are technically clear, but salary format and the relationship to step-one answers are not confirmed.
4. [Mobile step 2](./04-mobile-step-2.png) — usable layout, but the long page and unexplained fields increase uncertainty before a consequential submission.

## Verdict

Not 100% dumb-proof. The form works and the privacy promise is visible, but the page promises salary comparison while currently offering no actual comparison. The contribution flow also relies on terminology and open text fields that make users guess.

## Strengths

- The page clearly says that individual salaries are never published.
- The form is split into two manageable steps.
- Labels are visible and controls are comfortably sized.
- Desktop and mobile layouts reflow without clipping or horizontal scrolling.
- The final action says exactly what it does: submit an anonymous report.

## Highest-impact issues

1. The headline promises users can know what similar people earn, but the page has no benchmark data. The empty state needs to lead with the honest outcome: `No salary comparisons are available yet.`
2. `Five-report privacy threshold`, `median`, `middle range`, and `sample size` are research terms. Plain copy should explain: `We show a result only after five similar people submit salaries.`
3. The example benchmark can still look like missing or broken data. It should be labelled more plainly or removed until real data exists.
4. Role, industry, and location are unrestricted text inputs with no examples. Variations such as `Product designer`, `Product Design`, and `UI/UX` may split similar reports and users cannot know which wording to use.
5. Step two does not show the role, industry, and location entered in step one. Users cannot verify the complete report before submitting.
6. `Monthly gross salary` lacks a visible naira symbol and a short explanation such as `Before tax and deductions`.
7. `Pay reliability` is not explained. Users may not know whether it means salary timing, amount consistency, or job security.
8. The standard page does not explain whether sharing here earns the advertised reward; users arriving from other site promotions could reasonably expect one.

## Accessibility risks

- Visible contrast, target sizing, and responsive reflow look acceptable in the captured states.
- Native number spinners are visually small and are not the clearest way to enter a Nigerian salary.
- Keyboard order, focus visibility, validation announcements, screen-reader names, and submission error recovery require interactive assistive-technology testing and cannot be certified from screenshots alone.

## Recommended order

1. Show a literal empty result: `No salary comparisons yet.`
2. Explain the five-person rule in one sentence.
3. Offer one clear action: `Add my salary anonymously.`
4. Use suggested or normalized role, industry, and location values.
5. Show a review summary before submission.
6. Label salary as `Monthly salary before tax and deductions` with a visible `₦`.
7. Explain or remove `Pay reliability`.
