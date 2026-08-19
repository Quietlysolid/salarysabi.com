# Product design audit: methodology versus eligible deductions

Captured 5 August 2026 from the current production pages.

## Verdict

The pages are related but not duplicates. Keep both. The methodology page explains the calculation engine and builds trust. The eligible-deductions page helps a user identify which real-world amounts belong in calculator fields. Their current weakness is not redundant purpose, but insufficiently explicit separation and cross-linking.

## Step 1: Understand the overall method

**Page:** `/how-paye-is-calculated`

**Health:** Fair

- Owns annualization, deductions as one stage, chargeable income logic, graduated bands, annual-to-monthly conversion, minimum-wage exemption, sources, and verification.
- Best audience question: "How did SalarySabi calculate this result?"
- It should not become a detailed catalogue of every deduction.
- Current overlap: it repeats the list of deduction names and explains rent relief.

## Step 2: Identify eligible inputs

**Page:** `/eligible-deductions`

**Health:** Fair

- Owns pension, NHF, NHIS/NHIA, mortgage interest, life assurance, rent relief, where each figure is found, what to enter, what not to enter, and records to keep.
- Best audience question: "Which number from my payslip or statement should I enter?"
- It should not explain the entire PAYE engine or graduated tax bands.
- Current overlap: rent relief appears here and on the methodology page, but this is defensible if one page explains its role and the other explains the input.

## Information architecture recommendation

Keep both routes and establish a parent-child relationship:

- `/how-paye-is-calculated`: primary methodology and trust page.
- `/eligible-deductions`: focused input guide linked from the deductions step and calculator fields.

Make the separation visible in titles, introductions, navigation labels, and calls to action. Use one canonical explanation for the rent-relief formula and link to it from the other page to reduce future maintenance drift.

## Why not merge

- A merged page would combine two different user intents and become longer and harder to scan.
- Calculator users need field-level help without reading the full calculation method.
- Users verifying a result need the method and sources without reading six detailed input definitions.
- Both routes have distinct search intent and distinct entry points in the product.

## Highest-impact changes

1. Add a clear scope sentence to each hero.
2. Make the methodology deduction step link to the deductions guide with a strong rectangular action.
3. Link each calculator deduction field to the matching anchored section.
4. Keep the rent-relief formula authoritative on one page and summarize it on the other.
5. Rename vague links so their destinations are predictable.
6. Add reciprocal next-step actions at the bottom of both pages.
7. Preserve both canonical routes and sitemap entries.

## Evidence limits

Screenshots support the visible hierarchy and content comparison. Source inspection confirms routes and existing internal links. Keyboard behavior, analytics, search traffic, user comprehension, mobile reflow, and assistive-technology behavior were not established by this visual audit.
