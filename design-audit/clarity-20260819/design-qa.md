# Design QA — SalarySabi hybrid

- Result: passed
- Source: `sitewide-directions/selected-hybrid.png`
- Implementation: `http://127.0.0.1:3000`
- Desktop evidence: `local-hybrid/14-home-spacing-final.png` at 1440 × 1024, browser-rendered at 1× density
- Mobile evidence: `local-hybrid/15-home-mobile-final.png` at 390 × 844, browser-rendered at 1× density
- State checked: homepage calculator with the default ₦500,000 monthly salary

## Final checks

- P0: none
- P1: none
- P2: none
- The “Private by default · Current 2026 rules · Built for Nigerians” line is absent.
- The space previously reserved beneath that line has been removed.
- Desktop and mobile retain a clear path from the introduction into the calculator.
- Navigation and calculator controls remain visible without overlap.
- Automated verification: 65 tests passed, focused ESLint passed, and the Next.js production build passed.

## Iteration history

- Replaced the earlier dark result treatment with the selected direction’s light result rows.
- Tightened tool cards and collapsed long PAYE supporting material.
- Removed the assurance line and reduced the adjoining homepage spacing after review feedback.
