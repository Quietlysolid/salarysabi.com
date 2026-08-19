# SalarySabi sitewide typography audit

Date: 19 August 2026

## Verdict

SalarySabi has the right font pairing: Bricolage Grotesque gives the product a recognisable Nigerian-fintech/editorial voice, while Source Sans 3 keeps forms, tables, guidance, and legal content clear. The site should keep both fonts.

The system is not fully controlled yet. The main issues are inconsistent page-title sizing, two prominent pages that do not use the display face for their H1, too many near-duplicate font weights, small footer/meta text, and incomplete numeric styling.

## Evidence

- 22 desktop routes and 4 mobile routes captured from the current local build.
- All 26 routes returned HTTP 200.
- No console errors and no horizontal overflow were found in the captured states.
- Body copy consistently resolves to Source Sans 3.
- Most page titles resolve to Bricolage Grotesque.
- H1 sizes currently range from about 49px to 80px on desktop.
- CSS uses 12 distinct numeric font weights from 400 through 950; 800 and 850 alone appear 166 times.
- Only one explicit `font-variant-numeric: tabular-nums` rule exists.

## 1. Font pairing — Healthy

**Keep:**

- Bricolage Grotesque for brand headlines, page titles, section headings, and large result totals.
- Source Sans 3 for paragraphs, labels, controls, navigation, metadata, tables, and legal copy.

Using Bricolage everywhere would make dense forms and calculation details less effortless to read. Using Source Sans everywhere would make SalarySabi feel generic. The contrast between the two is doing useful brand work.

## 2. Page-title consistency — Needs improvement

Most H1s use Bricolage, but the job-detail title and account title use Source Sans 3:

- Job detail: Source Sans 3 at 80px.
- Account: Source Sans 3 at about 49px.

The job-detail H1 is also the largest headline in the audit, which makes the role title overpower the advertised salary. Both pages should use the same Bricolage page-title role as the rest of the product.

## 3. Type scale — Needs improvement

Desktop H1 sizes include roughly 52, 59, 63, 68, 70, 72, and 80px. Some variation is appropriate, but this many close tiers makes page importance feel accidental.

Recommended page-title system:

| Role | Desktop | Mobile | Typeface |
| --- | ---: | ---: | --- |
| Flagship hero | 64px / .98 | 46px / .98 | Bricolage 700 |
| Standard page H1 | 52px / 1.02 | 40–43px / 1.02 | Bricolage 700 |
| Section H2 | 32–38px / 1.08 | 28–32px / 1.1 | Bricolage 700 |
| Card/section H3 | 22–24px / 1.2 | 20–22px / 1.2 | Bricolage 700 |

Use the flagship tier only for the homepage, PAYE guide, and a small number of major landing pages. Legal and support pages such as Security, Accessibility, Terms, Privacy, and Contact should use the standard H1 tier.

## 4. Weight hierarchy — Needs improvement

The stylesheet uses 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, and 950. The visual result is that labels, cards, buttons, links, and headings often compete at nearly the same boldness.

Reduce the public-site system to four deliberate levels:

- 400: paragraphs and supporting copy.
- 600: labels, navigation, controls, and ordinary links.
- 700: headings and strong emphasis.
- 800: rare high-priority emphasis, such as a major result or primary conversion message.

Remove 650, 750, 850, 900, and 950 from ordinary public UI. Variable fonts can render those values, but the distinctions are too subtle to form a reliable hierarchy.

## 5. Body text and measure — Mostly healthy

Source Sans 3 is a good fit for SalarySabi's plain-language goal. Most body copy sits around 15–16px and the denser screens remain readable.

Recommended body roles:

- Intro/body large: 18px, line-height 1.55, max-width 60ch.
- Body: 16px, line-height 1.55–1.65, max-width 68ch.
- Supporting/helper: 14px, line-height 1.45–1.55.
- Caption/meta: 13px minimum, line-height 1.4.

Long article and legal passages should be capped at roughly 65–72 characters per line even when the surrounding panel is wider.

## 6. Small and muted text — Needs improvement

Every audited route contains four visible text elements below 12px, primarily in the shared footer. Some guide and table labels also use 10–11.5px text. This is the weakest part of the otherwise readable system.

- Raise public-facing text to at least 12px; 13px is preferable for footer and metadata.
- Use muted colour for secondary importance, but do not combine very small size, light colour, and regular weight.
- Reserve 11px uppercase text for decorative eyebrows only, never for essential instructions or table meaning.

## 7. Numbers and money — Needs improvement

Large totals look good in Bricolage and should remain part of the brand. Operational numbers need more consistency.

- Use Bricolage 700 for the main take-home amount and other hero totals.
- Use Source Sans 3 600/700 for inputs, tax bands, payroll rows, job metadata, and tables.
- Apply `font-variant-numeric: tabular-nums` to currency inputs, result ledgers, salary ranges, tax tables, payroll tables, and dates.
- Keep the naira sign, amount, and unit in one defined component so spacing is consistent.

## 8. Tracking and casing — Mostly healthy

The tight tracking on large Bricolage headlines gives the brand confidence. Use proportional tracking rather than several fixed pixel values:

- Large display: about `-0.04em`.
- Standard H1/H2: about `-0.025em` to `-0.035em`.
- Body and controls: normal.
- Eyebrows: uppercase with about `0.08em`, used sparingly.

There are enough uppercase eyebrows and micro-labels that they can become visual noise on dense pages. Keep them for navigation or orientation, not decoration.

## 9. Mobile typography — Healthy with one caveat

The audited mobile pages reflow without horizontal overflow. H1 sizes around 40–47px preserve personality without dominating the viewport.

The caveat is density: 12px and smaller helper/meta text becomes harder to scan on a phone. The minimum-size correction is more important on mobile than desktop.

## 10. Font loading and fallbacks — Healthy

Both fonts are loaded through `next/font` with `display: swap`, so the deployment does not depend on a runtime Google Fonts request. The body and display variables have sensible system fallbacks.

Minor cleanup: several rules append `sans-serif` to a variable that already includes its fallback, producing a duplicated computed fallback. It is harmless but should be cleaned up as part of the typography refactor.

## Recommended implementation order

1. Introduce named typography tokens for the roles above.
2. Move job detail and account H1s to the standard Bricolage page-title token.
3. Collapse the weight system to 400/600/700/800.
4. Normalize legal/support page H1s to the standard tier.
5. Raise footer and essential metadata to at least 12–13px.
6. Add tabular numerals to all operational numeric surfaces.
7. Replace fixed pixel tracking with role-based `em` values.
8. Remove duplicate family fallbacks and duplicate global weight overrides.

## Accessibility boundary

The screenshots confirm hierarchy, reflow, and lack of horizontal overflow in the audited states. They do not prove WCAG conformance, contrast compliance in every state, zoom behaviour, font loading under poor network conditions, or screen-reader output. Those need separate automated and manual accessibility testing.

## Files

- `desktop-contact-sheet.png`
- `mobile-contact-sheet.png`
- `metrics.json`
- Individual route screenshots `01-home.png` through `26-mobile-privacy.png`
