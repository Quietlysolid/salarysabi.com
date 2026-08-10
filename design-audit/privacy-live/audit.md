# SalarySabi privacy page audit

## Audit scope

- Surface: `/privacy` on the local production preview.
- User goal: quickly understand what SalarySabi collects, what stays on-device, what third parties process, and what control the user has.
- Accessibility target: clear reading order, useful headings, scannable disclosure groups, understandable links and responsive reflow.
- Evidence: `01-current.png`, captured at 1440 x 1200 on 5 August 2026.

## Step 1 — Land on the privacy page

Health: needs structural improvement.

### What works

- The headline makes the most reassuring privacy promise immediately.
- The plain-language tone is much better than generic legal boilerplate.
- The existing SalarySabi header, typography and green palette feel consistent with the rest of the product.
- Body copy has comfortable line length and good contrast in the captured desktop state.

### UX risks

1. The hero is too large for a utility/legal page. It consumes roughly the first third of the viewport before the user gets to the actual disclosures.
2. The page repeats a long-document pattern that was just removed from the disclaimer page: oversized title, large gaps, then isolated text sections.
3. The contents navigation names only four destinations even though the page contains seven disclosure sections. “Privacy-friendly analytics,” “Job alerts,” and “Early-access email” are absent, so the navigation is not a reliable map.
4. The grouping is weak. On-device calculator data, technical/hosting data, analytics, and voluntarily submitted contact data are materially different categories, but they all receive the same visual treatment.
5. The page does not answer the fastest user questions at a glance: “Stored where?”, “Shared with whom?”, “How long?”, and “Can I delete it?”
6. The strongest trust claims—no salary upload, no analytics cookies, no browser fingerprinting—are buried in paragraphs instead of being surfaced as scan-friendly proof points.
7. The current layout creates excessive vertical travel. Seven similarly styled sections make the page feel longer and more legalistic than the amount of copy warrants.
8. There is no clear end-state or action. Users are not offered a contact/removal route, a way back to the calculator, or a related policy link at the bottom.
9. “You may ask us” is incomplete without a visible method for making the request.
10. The page does not show an effective date or last-updated date, reducing confidence that the policy reflects the current product.
11. The distinction between SalarySabi’s own processing and infrastructure processing by the hosting provider/Supabase is not easy to compare.
12. “Excel-compatible” is less direct than naming the actual exported format or simply saying spreadsheet export.
13. The malformed smart quotes visible in source around “Do Not Track” risk rendering as mojibake depending on the build/encoding path.

### Accessibility risks

- The contents links are compact and closely grouped; their visible target areas may be too small for comfortable touch use.
- The hierarchy relies heavily on whitespace. Users zooming in or using small screens may face a long, repetitive stream without strong category landmarks.
- Screenshot evidence cannot confirm keyboard focus visibility, semantic heading levels, screen-reader labels, link purpose, or reflow at 200% zoom; those require DOM and interactive testing.
- Any future status icons must not carry meaning by color or icon alone.

## Opportunity areas

- Replace the long document opening with a compact privacy summary.
- Group disclosures by data location: on your device, necessary technical processing, and information you choose to provide.
- Add explicit attributes for each category: data, purpose, location/processor, retention/control.
- Surface the “no salary upload / no analytics cookies / no fingerprinting” claims as a concise trust strip.
- Add last-updated information and a concrete deletion/contact action.
- End with clear rectangular next steps consistent with the new disclaimer page.

## Recommendations

1. Use a concise page title and one-sentence promise rather than a dominant marketing-sized hero.
2. Organize the content into three meaningful groups, not seven visually identical sections.
3. Make the privacy model comparable at a glance using either a matrix, a split summary/details layout, or a numbered ledger.
4. Include every disclosure in navigation or remove the contents navigation altogether.
5. Provide a visible contact/removal path and last-updated date.
6. Preserve the crisp rectangular SalarySabi system and avoid pills, floating cards and excessive rounding.

## Evidence limits

- The accepted screenshot covers the landing state and the first content sections; lower-page copy was verified from the local page source.
- No claim of full WCAG compliance is made from this screenshot audit.
