# Live disclaimer-page audit

## Evidence

- Screenshot 1: user-provided live desktop capture of the page header, hero, contents navigation, and beginning of the first section.
- Screenshot 2: user-provided live desktop capture of the three disclaimer sections and lower-page whitespace.
- Route: `https://salarysabi.com/disclaimer`
- Approximate viewport: 1886 × 976 desktop browser.

## Overall verdict

The page is technically readable and structurally sound, but it applies the scale and spacing of a marketing landing page to a short legal-information page. The result feels inflated, sparse, and unfinished. The contents navigation adds more visual complexity than navigational value, and the page lacks a clear close or next action.

## Findings

### P1 — Page type and visual treatment do not match

The 72px-class display title and large hero spacing make a three-section disclaimer feel like a campaign landing page. Legal/reference content should be calmer and denser.

### P1 — Excessive vertical whitespace

Large gaps appear between the header and eyebrow, intro and contents box, contents and first section, every content section, and the last section and footer. Visitors must scroll substantially to read very little content.

### P1 — Contents navigation is unnecessary and poorly composed

Three short sections do not justify a table of contents. The 2+1 link wrapping leaves “Rule changes” orphaned on a second row, while the “On this page” label consumes a separate column. The component feels empty and misaligned.

### P2 — Weak reading rhythm

Body copy is relatively small and light while section headings are very heavy. Long 760px lines reduce comfortable scanning, and the large gap between paragraphs makes related legal guidance feel disconnected.

### P2 — No visible current-page state

The primary navigation does not identify Disclaimer as the current page because Disclaimer only appears in the footer. The outlined PAYE guide CTA attracts attention despite not representing the current location.

### P2 — No closing action or route onward

After “Rules can change,” the page ends in whitespace. Useful next steps would be returning to the calculator, reviewing methodology, or viewing privacy information.

### P2 — Link affordance is weak

Contents links resemble static text. They lack a persistent underline, arrow, or boxed row treatment, and their targets are smaller than the more comfortable 44px touch size.

### P2 — Content terminology is inconsistent

“Workbook” does not match the visible “Excel” export label. “Ruleset” is technical language on an otherwise plain-language page. The page should use the same terms visitors see in the calculator.

### P3 — Hero copy is redundant

“Important,” the oversized “not tax advice” title, and the introductory independence statement repeat the warning before the actual limitations begin.

### P3 — Dividers are too faint for the amount of whitespace

The thin rules around the contents area and footer boundary do not provide enough structure to anchor such large blank regions.

## Accessibility risks visible from screenshots

- Small uppercase eyebrow, section numbers, and contents label may be difficult at browser zoom or for low-vision visitors.
- Muted body copy may need contrast measurement against white.
- Contents targets appear smaller than 44 × 44 CSS pixels.
- A visible current-page cue is missing.
- Keyboard order, focus treatment, screen-reader structure, and 200% zoom cannot be confirmed from screenshots alone.

## Recommended fix

1. Use a compact legal/reference-page layout rather than the full marketing hero.
2. Reduce title size, hero padding, and section gaps.
3. Remove the contents box for this three-section page.
4. Narrow body measure and slightly strengthen body color/size.
5. Add a compact closing panel linking to the calculator, methodology, and privacy page.
6. Replace “workbook” with “Excel file” and “ruleset” with “calculation rules.”
7. Keep the square system, but use borders and grouped panels to create structure.

## Step health

1. Header and orientation — Needs refinement.
2. Disclaimer introduction — Needs refinement.
3. Contents navigation — Poor; remove or redesign.
4. Legal sections — Readable but too sparse.
5. Page ending and onward navigation — Poor; missing.
