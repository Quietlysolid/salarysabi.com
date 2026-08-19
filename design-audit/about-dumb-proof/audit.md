# About page dumb-proof audit

## Scope

Desktop and 390px mobile review of `/about` on 19 August 2026.

## User goal

Quickly understand what SalarySabi does, who built it, why it can be trusted, and its limits.

## Strengths

- The opening statement explains the product's purpose.
- The founder is clearly identified and external credentials are linked.
- The page is transparent about its independence and review status.
- Mobile content reflows without horizontal clipping.

## UX risks

1. The hero sentence is large and followed by another long explanation of the same idea.
2. “On this page” adds navigation for only two sections and makes a short conceptual structure feel more complex.
3. The founder section is a long biography before explaining the product's trust method.
4. “What SalarySabi is not” contains four long disclaimers, including a reviewer recruitment notice that is not part of the normal visitor task.
5. “How we check the numbers” uses five numbered cards plus a separate ruleset panel to communicate a simple three-part trust story.
6. On mobile, the page becomes a very long uninterrupted reading task.

## Accessibility risks

- Long paragraphs and narrow mobile line wrapping increase cognitive and reading effort.
- The decorative initials block may be announced if it is not hidden from assistive technology.
- Verify visible focus, external-link announcements, heading order, and contrast independently; screenshots cannot confirm these.

## Recommended structure

- About SalarySabi
- “Clear pay and tax tools for Nigerians.”
- What it does: Calculate take-home pay · Check PAYE · Compare salaries · Find jobs with salaries
- Built by Ozichi Nwosu, with LinkedIn and GitHub links
- How numbers are checked: Official sources · Automated tests · Published updates
- One short boundary: “SalarySabi is independent and does not replace professional tax advice.”
- One link to detailed methodology and update history

Remove the page index, extended biography, reviewer recruitment copy, repeated disclaimers, numbered process cards, and large ruleset panel from this page.

## Evidence limits

This audit used rendered desktop and mobile screenshots. Keyboard interaction, screen-reader output, focus order, contrast ratios and external-link behavior were not programmatically verified.
