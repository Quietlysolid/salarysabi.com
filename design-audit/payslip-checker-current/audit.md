# SalarySabi payslip checker audit

Date: 5 August 2026

## Audit scope

Combined UX and visual accessibility audit of the default desktop payslip-checker journey at 1440px wide. Evidence comes only from screenshots captured in this audit run.

## User goal and accessibility target

A Nigerian employee should be able to copy the right figures from a payslip, understand which fields are essential, compare payroll PAYE with a SalarySabi estimate, and know what to do when the amounts differ.

## Evidence

- `01-default.png`: initial viewport and empty form
- `02-full.png`: full default page hierarchy

## Step 1: Understand the task

Health: Needs clearer expectations

### Strengths

- The headline is direct and explains the page purpose.
- The supporting line correctly describes a comparison rather than promising absolute payroll accuracy.
- The active navigation state makes the current location clear.
- The restrained rectangular design remains consistent with the wider SalarySabi system.

### Risks

- The hero repeats the form purpose without explaining what the visitor needs before starting, such as a recent payslip and monthly figures.
- There is no short explanation of what SalarySabi can and cannot diagnose before the visitor enters sensitive financial information.
- The page does not establish the likely outcome: close match, higher payroll PAYE, or lower payroll PAYE, plus the next step for each.
- The large empty vertical gap between header and content weakens urgency and pushes the actual task down.

## Step 2: Enter payslip figures

Health: Usable but under-explained

### Strengths

- The form is compact and visible in one view.
- Gross salary and PAYE are required in code, while supporting deductions are optional.
- Grouping fields into two columns makes the desktop form efficient.
- Privacy reassurance sits next to the submit action.

### Risks

- Required and optional fields look identical. The visitor cannot tell which two figures are enough to proceed.
- The form gives no guidance about whether gross salary means basic salary, gross earnings, taxable pay, or total monthly compensation.
- PAYE may appear under different labels on real payslips, but no examples are provided.
- Pension, NHF, NHIS/NHIA, and other deductions lack short definitions or instructions for missing items.
- Every empty field displays `₦ 0`, which visually resembles entered data and makes the form look precompleted.
- There is no example payslip map showing where common figures may be found.
- There is no month or pay-period confirmation, so users could accidentally compare a yearly, weekly, bonus, or arrears-heavy payslip against a monthly estimate.
- `Other deductions` is too broad. Loan repayments, union dues, cooperative deductions, and non-tax deductions affect take-home pay differently from tax reliefs.
- The primary button has a heavy shadow that conflicts with the otherwise flat rectangular system.
- Validation and recovery are not visible. A required numeric field showing zero may create confusing browser-native errors.

## Step 3: Understand the pending result

Health: Visually dominant but not useful enough

### Strengths

- The dark panel clearly separates output from data entry.
- The empty state avoids showing a fictional personal result.
- The language promises a comparison rather than an official tax determination.

### Risks

- Half of the main workspace is reserved for only three lines of empty-state copy.
- “Take-home pay” is emphasized before optional deductions are explained, which can imply a level of completeness the checker may not have.
- The empty state does not preview the exact outputs, difference interpretation, or next step.
- The result area does not show the ruleset or verification date until after submission.
- There is no visible reassurance that a mismatch does not automatically mean payroll is wrong.

## Step 4: Continue or recover

Health: Missing

### Risks

- The page ends immediately after the checker. There is no route to calculation methodology, eligible deductions, payroll questions, or a fresh calculation.
- There is no “What should I do if the numbers differ?” guidance in the default state.
- Footer navigation is sparse and omits the most relevant recovery links.
- The full-page capture exposes a large unresolved empty page area after the footer, making the experience feel unfinished.

## Accessibility risks

- Placeholder-like zero values and required fields need clearer visible instructions that do not depend on browser-native validation.
- Labels exist, but the currency prefix, error association, required state announcement, and input descriptions need screen-reader verification.
- The result update uses a live region and focus movement in code, but announcement quality and focus order require hands-on assistive-technology testing.
- Small muted helper text and lime text on dark green require numeric contrast verification.
- Keyboard focus styles, mobile reflow, 200% zoom, and error recovery were not visible in the captured state.
- The two-column visual order should be checked against DOM reading order on small screens.

## Highest-impact opportunities

1. Show what users need and what the comparison can tell them before the form.
2. Separate the two required figures from optional deductions.
3. Explain each payslip label in plain language and confirm the pay period.
4. Replace zero placeholders with unmistakably empty examples.
5. Make the pending-result panel instructional rather than decorative.
6. Add mismatch guidance and relevant next steps after the checker.
7. Reduce unused vertical space and resolve the footer transition.

## Evidence limits

The audit does not confirm keyboard operation, screen-reader output, contrast ratios, validation behavior, result accuracy, responsive layout, or a completed comparison state. Those require interaction testing and additional captured states.
