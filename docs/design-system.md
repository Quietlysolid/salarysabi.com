# SalarySabi design system

## Design principles

1. **Practical before decorative.** Every element should help someone understand pay, tax, or a job opportunity.
2. **Square by default.** Cards, buttons, fields, disclosures, notices, and navigation use crisp rectangular geometry.
3. **Trust through clarity.** Show rules, dates, sources, privacy behavior, and calculation limitations near the relevant action.
4. **Plain language.** Prefer familiar terms and short explanations over tax or recruitment jargon.
5. **Accessible interaction.** All actions must work with a keyboard, expose visible focus, use persistent labels, and announce important results.

## Shape

- Global radius token: `--shape-radius: 0`.
- Do not introduce pills, capsules, or softly rounded cards.
- Circles are reserved for meaningful source artwork or brand assets, not general interface containers.
- Use borders and background contrast to group content instead of heavy shadows.

## Color

- `--ink`: primary text.
- `--muted`: secondary text; verify contrast before using it below 14px.
- `--green`: primary action and emphasis.
- `--green-dark`: high-contrast brand and result surfaces.
- `--lime`: accent on dark green, never long-form body text on white.
- `--line`: structural borders and separators.
- `--paper` / `--paper-deep`: primary and secondary surfaces.

Never rely on color alone to communicate selection, errors, or success. Pair it with text, borders, and semantic state.

## Spacing

Use the shared scale:

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px

Prefer generous section spacing and tighter spacing inside related controls.

## Typography

- Use the shared body/display family and existing weight hierarchy.
- Page titles should be direct, sentence case, and usually no longer than two lines on desktop.
- Eyebrows identify context; they do not replace headings.
- Helper copy must remain readable at 200% zoom and should not use low-contrast gray.

## Buttons and links

- Primary: green background, white text, one per decision area.
- Secondary: white background, visible border, equal size when it represents an equally valid path.
- Text links: underline on hover and focus, with a clear focus outline.
- Disabled buttons must remain legible and must not be the only explanation of why an action is unavailable.

## Forms

- Every input has a persistent visible label.
- Use placeholders only as examples.
- Group long forms into numbered sections.
- Put help beside the field it explains.
- Errors explain how to recover; success messages explain what happens next.
- Never clear user input after an unsuccessful submission.

## Results and status

- Move focus to a newly completed result without trapping focus.
- Use `aria-live` or `role="status"` for asynchronous updates.
- Example data is always marked as an example.
- Calculation results display the ruleset, verification date, and methodology link.
- Cached or potentially stale job content is visibly identified.

## Navigation

- The active page uses both visible styling and `aria-current="page"`.
- Provide a skip link before repeated navigation.
- Long guidance pages use an “On this page” index.
- Mobile navigation must fit without horizontal scrolling at 320px CSS width.

## Responsive requirements

- Supported content width: 320px and above.
- At 760px and below, multi-column forms and result panels stack into one column.
- Text may wrap; controls and persistent actions may not be clipped.
- Verify at 320, 375, 390, 768, 1024, and 1440 CSS pixels.
- Verify keyboard focus, 200% zoom, reduced motion, and long-content wrapping before release.

## Exceptions

An exception to square geometry or established tokens requires a functional reason recorded in the component or design review. “Modern,” “friendly,” or “common on other sites” is not sufficient.
