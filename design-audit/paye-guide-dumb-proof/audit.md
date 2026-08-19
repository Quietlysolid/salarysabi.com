# PAYE guide dumb-proof audit

## Audit scope

Desktop review of `/paye-guide` in its collapsed and expanded states on 19 August 2026.

## User goal and accessibility target

Help a person quickly choose one PAYE question, get a plain answer, and reach the calculator when needed. The page should remain understandable when zoomed, keyboard-operated, or read in sequence by assistive technology.

## Strengths

- The four core topics match real user questions.
- The calculator remains easy to find.
- Sources and update information build trust.
- The expanded content separates sources, related guides, and common questions.

## UX risks

1. The hero repeats the proposition in an eyebrow, headline, and supporting sentence before the user can choose a question.
2. Author, review status, update history, and changelog receive primary-page prominence even though most visitors first need an answer.
3. Every guide card repeats a number, category, title, explanation, “Answers” label, question, and CTA.
4. The three-column grid leaves the fourth topic alone on a second row and creates a large visual gap.
5. When expanded, the same subjects recur in the primary cards, the three-step explainer, related guides, FAQs, and closing CTA.
6. “Sources, more guides and common questions” combines three different destinations in one disclosure, so users cannot predict what opening it will reveal.

## Accessibility risks

- The floating “Skip to main content” control appeared persistently in the captured state and overlaps the first guide card. Verify that it is visually hidden until keyboard focus.
- Small uppercase eyebrow and metadata text should be checked at 200% zoom and against contrast requirements.
- Confirm the disclosure exposes `aria-expanded`, has a clear accessible name, and moves through its content in a logical reading order.
- Confirm each guide has one clear link target rather than nested or repeated interactive targets.

## Opportunity areas

- Replace the hero with “Understand your PAYE” and one short supporting sentence.
- Move authorship, update history, and primary sources into a dedicated “Sources and updates” disclosure.
- Present four single-column, fully clickable questions:
  - How is PAYE calculated?
  - What deductions can I enter?
  - Which tax rate applies to me?
  - What is gross pay vs take-home pay?
- Remove card numbers, category labels, “Answers,” descriptions, and separate CTA labels.
- Keep common questions only when they add answers not already represented by the four choices.
- End with one primary action: “Calculate my PAYE.”

## Evidence limits and verification gaps

This review used desktop screenshots of the collapsed and expanded states. Keyboard order, focus visibility, screen-reader output, responsive reflow, link destinations, and contrast were not programmatically verified.

## Recommendation

The page is trustworthy and visually polished, but not yet foolproof. Convert it from a content directory into a four-question decision page, then keep sources and deeper reading secondary.
