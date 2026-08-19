# SalarySabi homepage audit

Date: 5 August 2026

## Audit scope

Combined UX and visual accessibility review of the locally rendered homepage at 1440px wide. Evidence is limited to the default desktop state captured in this audit run.

## User goal and accessibility target

A Nigerian salary earner should be able to identify the right tool, understand that the PAYE result is an estimate, enter salary information, and reach a trustworthy next step without hesitation.

## Evidence

- `01-home-top.png`: desktop entry and calculator fold
- `02-home-full.png`: full homepage hierarchy

## Step 1: Homepage entry and default calculator state

Health: Needs structural improvement

### Strengths

- The logo, color palette, typography, thin borders, and rectangular shapes form a distinctive and consistent visual system.
- The plain-language headline identifies both the audience and the broad product promise.
- The four tools are easy to scan and use concise supporting descriptions.
- The calculator separates input and result clearly, labels the default result as an example, and includes ruleset and verification information.
- The page avoids ornamental clutter, gratuitous cards, gradients, and excessive decoration.

### UX risks

1. The homepage does not establish one primary job. The header navigation, four-tool chooser, calculator, guide links, and jobs banner all compete for attention.
2. The most valuable action, calculating PAYE, starts below a large hero and tool chooser. The visitor sees a directory before they can act.
3. The hero promise is broad and generic. It does not explain what makes SalarySabi especially useful or trustworthy, such as current rules, privacy, or salary transparency.
4. The tool chooser duplicates the header navigation without adding enough decision support. It consumes a large amount of vertical space while leaving the visitor to make the same choice twice.
5. The calculator opens with a polished result for a fictional salary. Even with the `EXAMPLE PREVIEW` label, the strong number can look like a result already calculated for the visitor.
6. The form and result panel have nearly equal visual weight before the user enters anything. This makes the output feel more important than the action required to produce it.
7. The salary input appears populated and ready, but the adjacent call to action says `Show my PAYE estimate`. The state is ambiguous: is the value editable sample data, a placeholder, or a submitted input?
8. `Income after PAYE only` can be mistaken for take-home pay, despite the smaller qualifying copy beneath it.
9. Export actions appear in the example state before the user has produced a personal calculation. This introduces secondary actions too early.
10. The trust proof is buried inside the dark result panel. It should reassure the visitor before or beside the first salary entry.
11. The guide section and jobs banner feel like separate destinations appended after the calculator instead of a deliberate continuation of the salary journey.
12. The jobs banner becomes the loudest section near the bottom, but it is disconnected from the calculator result and does not explain why the salary-first job experience is relevant now.
13. The page has excessive vertical whitespace after the footer in the tall capture. Some of this is a capture artifact, but the footer itself still feels visually sparse compared with the denser content above.
14. Footer navigation omits several prominent top-level destinations, which weakens consistency and recovery at the end of the page.

### Accessibility risks

1. Several secondary descriptions and metadata lines use small, low-emphasis text. Contrast and legibility need numeric verification, especially within the dark green result panel.
2. The tool grid relies heavily on the whole rectangle being clickable, but the visible interaction cue is mostly typography and border. Hover and keyboard focus states cannot be confirmed from screenshots.
3. The monthly/yearly segmented control needs semantic and keyboard verification. Its selected state relies mainly on surface color and a subtle border.
4. The expandable deductions row and calculation explanation need checks for button semantics, focus order, `aria-expanded`, and announced state changes.
5. The example-to-personal-result transition needs a live-region or focus-management check so screen-reader users know that values changed.
6. The arrow-only guide affordances may be too subtle and need accessible names and adequate target size.
7. Responsive reflow, 200% zoom, mobile reading order, validation, error recovery, and reduced-motion behavior were not visible in this desktop screenshot audit.

## Opportunity areas

- Make PAYE calculation the unmistakable primary journey and treat the other tools as secondary routes.
- Replace the sample output with either a clearly inert teaching state or an empty result that explains what the visitor will receive.
- Surface trust, privacy, and ruleset freshness before input.
- Connect guide content and salary-transparent jobs to the calculation outcome rather than presenting them as unrelated blocks.
- Simplify duplicated navigation and reduce vertical distance to the first useful action.
- Strengthen footer navigation and ensure the bottom of the page feels intentionally resolved.

## Recommended priority

1. Clarify the primary homepage job and move salary entry higher.
2. Redesign the example state so it cannot be confused with a personal result.
3. Bring ruleset, privacy, and estimate language into the decision moment.
4. Reframe secondary tools and jobs as contextual next steps.
5. Verify interaction semantics, focus states, contrast, reflow, and result announcements in code.

## Evidence limits

This audit confirms only what is visible in the two accepted screenshots. It does not establish WCAG compliance, keyboard behavior, screen-reader output, mobile behavior, validation quality, performance, or analytics-backed user behavior.
