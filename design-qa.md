# Design QA — holistic SalarySabi implementation

## Comparison target

- Source visual truth: `design-audit/homepage-freeze-audit-20260821/` for the locked Option 3 calculator experience, plus `design-audit/holistic-alignment-20260821/` for the previously audited public-route baseline.
- Rendered implementation: `design-audit/holistic-implementation-20260821/`.
- Routes inspected: homepage initial/result, jobs and salaries hub, salary comparison, jobs, payslip checker initial/result, employer hub, payroll, PAYE guide, contributors and About.

## Normalization

- Desktop CSS viewport: 1440 × 1050 at device scale factor 1.
- Mobile CSS viewport: 390 × 844 at device scale factor 1.
- Source homepage full-page captures: 1440 × 1401 pixels for desktop; 390 × 1625 and 390 × 2156 pixels for mobile initial/result.
- Implementation homepage full-page captures: 1440 × 3275 pixels for desktop; 390 × 4385 and 390 × 4887 pixels for mobile initial/result.
- Payslip result captures: 1440 × 1647 and 390 × 2908 pixels.
- The full-page heights differ intentionally because the new homepage now explains all three product paths, the funded contribution model and evidence standards below the preserved calculator workspace. Above-the-fold comparisons use the same 1440- and 390-pixel widths, browser engine, density and calculator state.

## Full-view comparison evidence

- Homepage source: `design-audit/homepage-freeze-audit-20260821/01-desktop-initial.png`, `02-desktop-result.png`, `03-mobile-initial.png`, `05-mobile-result.png`.
- Homepage implementation: `design-audit/holistic-implementation-20260821/01-home-initial.png`, `02-home-result.png`, `12-mobile-home-initial.png`, `13-mobile-home-result.png`.
- Cross-route source baseline: `design-audit/holistic-alignment-20260821/01-salaries-jobs-hub.png` through `13-mobile-paye-guide.png`.
- Cross-route implementation: `design-audit/holistic-implementation-20260821/03-jobs-salaries-hub.png` through `16-mobile-contributors.png`.

The Option 3 calculator remains the homepage peak moment: its two-column desktop composition, mobile stacking, numerical result hierarchy, three next actions, trust date and full-calculation disclosure are visually preserved. The new sections begin only after that complete task. Across the other routes, the implementation now uses one audience taxonomy, one contribution proposition, consistent source-confidence language and repeated next-step patterns.

## Focused comparison evidence

- Calculator result hierarchy and action rows were readable at full resolution in the equal-width source/implementation comparison, so no crop was required.
- Payslip result and next-step treatment were checked separately in `17-payslip-result.png` and `18-mobile-payslip-result.png` because that state did not exist in the earlier baseline.
- Structural route evidence is recorded in `design-audit/holistic-implementation-20260821/route-summary.json`.

## Required fidelity surfaces

- Fonts and typography: passed. Existing SalarySabi display and body families, optical weights, heading wraps and numeric emphasis remain consistent. New sections use the same scale and eyebrow treatment as the established design system.
- Spacing and layout rhythm: passed. The homepage calculator geometry is preserved; new three-path, contribution and evidence sections use consistent tracks and vertical intervals. Mobile sections stack without clipped controls or horizontal overflow.
- Colors and visual tokens: passed. New surfaces reuse the existing paper, ink, muted, green, lime and divider tokens. The payslip next-step eyebrow was corrected from low-contrast lime-on-white to brand green.
- Image quality and asset fidelity: passed. The existing vector SalarySabi mark remains the only prominent brand asset and stays sharp. Interface arrows and the privacy shield use the repository's icon library; no placeholder or approximate visual assets were introduced.
- Copy and content: passed. Navigation, headings and CTAs now explain the connected model: calculate and verify pay, compare and improve pay, and hire and pay people. Reward copy is evidence-first and does not overpower the core answer.

## Interaction and accessibility evidence

- Homepage and payslip initial/result states were exercised with real inputs.
- Every captured public route has one H1, one main landmark and one `#main-content` target.
- No captured desktop or mobile route has horizontal overflow.
- Empty calculator submission, salary result focus, navigation states and core links are covered by Playwright.
- Homepage browser-console errors were checked by the Playwright regression suite; none were reported.
- Payslip result exposes three working next-step links on both desktop and mobile.

## Findings

- P0: none.
- P1: none.
- P2: none remaining.
- P3: the complete mobile homepage is intentionally long because each product path and evidence standard is shown in full. The section order and strong dividers preserve scanability, so this does not block acceptance.

## Comparison history

- Iteration 1 — P2: the jobs and salaries hub mixed centred and left-aligned task-card content, making equal choices feel inconsistent. Fixed by aligning every card to the same left edge. Post-fix evidence: `03-jobs-salaries-hub.png` and `14-mobile-jobs-salaries.png`.
- Iteration 1 — P2: the payslip privacy/freshness cue inherited a legacy bordered-cell treatment, weakening the intended compact reassurance line. Fixed by removing inherited cell borders and normalizing icon/text spacing. Post-fix evidence: `06-payslip.png` and `15-mobile-payslip.png`.
- Iteration 2 — P3: the payslip result's shared eyebrow inherited lime intended for dark surfaces. Fixed with a result-specific green token and recaptured. Post-fix evidence: `17-payslip-result.png` and `18-mobile-payslip-result.png`.

## Verification

- ESLint: passed with 0 errors and 2 pre-existing generated declaration warnings.
- Vitest: 90/90 passed.
- Production build: passed.
- Playwright public-layout and platform-redesign suites: 40/40 passed across desktop and mobile.

## Implementation checklist

- [x] Preserve the selected Option 3 calculator and result state.
- [x] Explain all three product paths on the homepage.
- [x] Replace audience ambiguity with task-based navigation.
- [x] Connect public routes with relevant next actions.
- [x] Make contributions mission-first, funded and evidence-gated.
- [x] Standardize salary-source and verification language.
- [x] Improve useful empty states and payroll sign-in context.
- [x] Remove duplicate main landmarks and verify responsive layouts.

final result: passed
