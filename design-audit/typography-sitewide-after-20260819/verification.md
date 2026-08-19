# Sitewide typography verification

Verified on 19 August 2026 after the typography-system cleanup.

## Typography contract

- Bricolage Grotesque is the display face for page titles, section titles, cards, and major calculated totals.
- Source Sans 3 is the reading and interface face for body copy, navigation, labels, controls, tables, and helper text.
- Page titles use two intentional tiers: 64px flagship titles and 52px standard titles on desktop, with responsive 46.8px and 42.9px mobile equivalents.
- The weight scale is limited to 400, 600, 700, and 800.
- Public text has a 13px caption floor; helper copy is 14px.
- Financial values use tabular lining numerals.
- Introductory copy is limited to 60 characters per line and long-form copy to 68 characters per line.

## Browser sweep

Thirty route-and-viewport combinations were checked: 26 desktop routes and four priority mobile routes.

- HTTP failures: 0
- Browser console errors: 0
- Horizontal-overflow failures: 0
- Visible text below 12px: 0
- Pages with an incorrect body font: 0
- Pages with an incorrect H1 font: 0

## Automated checks

- Unit and contract tests: 70 passed
- ESLint: 0 errors (two pre-existing warnings in the generated worker configuration declaration)
- CSS selector ownership audit: passed
- Next.js production build: passed

Representative screenshots and computed metrics are stored beside this file.
