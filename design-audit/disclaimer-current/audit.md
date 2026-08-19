# SalarySabi current disclaimer audit

## Audit scope

- Surface: `/disclaimer`, current local desktop state.
- User goal: understand the calculator’s limits, what the result can and cannot be used for, and what to do when certainty is required.
- Accessibility target: clear warning hierarchy, non-duplicative reading order, understandable links and robust responsive reflow.
- Evidence: `01-current.png`, captured at 1440 x 1024 on 5 August 2026.

## Step 1 — Read the calculator disclaimer

Health: visually polished and substantially better than the former live page, but the content model still duplicates itself and leaves trust questions unanswered.

### What works

- The page is compact enough to understand in one desktop view.
- The two-column structure creates a clear split between the headline warning and supporting detail.
- The warning panel, section dividers and rectangular next-step strip fit SalarySabi’s current visual system.
- Body text has good contrast, comfortable line length and plain-language phrasing.
- The page now has useful onward paths rather than ending abruptly.
- The independent-tool statement is visible near the top.

### UX and content risks

1. “Confirm your obligations” repeats almost the entire warning panel word for word. This is the most obvious flaw: users read the same caveat twice with no added value.
2. The page mixes two jobs—legal protection for SalarySabi and practical guidance for users—without clearly separating them.
3. The pale-green panel looks like positive or reassuring information even though it contains the highest-risk warning on the page.
4. The title is still disproportionately large for a short legal utility page and forces awkward four-line wrapping.
5. The left column is visually heavier than the right at the top, while the right becomes a sequence of similar paragraphs; the page feels split rather than integrated.
6. “Rules can change” says the site shows when rules were last verified, but this page does not show that date or ruleset.
7. There is no “Last updated” or effective date for the disclaimer itself.
8. The independence statement names the Joint Revenue Board and state authorities but provides no direct source or verification route.
9. The page does not clearly state the core boundary in a quick scan: estimate only; not a tax return; not proof of remittance; not professional advice.
10. “Exports are calculation records” is technically accurate but less direct than “A download is not an official tax record.”
11. The page does not distinguish errors caused by incomplete user inputs from differences caused by employer payroll treatment, benefits, residency or later rule changes.
12. The strongest practical action—consult a qualified Nigerian tax professional or relevant authority—is buried in body copy and is not actionable.
13. The three bottom actions have equal weight even though reviewing methodology is more relevant to the disclaimer than Privacy.
14. “Calculate PAYE” points back into the calculator without reminding the user that the result remains an estimate.
15. The warning icon is generic and visually detached from a heading; the panel lacks a short label such as “Your result may differ.”
16. There is no concise statement about service availability, completeness, or correction of errors. Whether that belongs here is a legal/product decision, but the current page may be read as a complete disclaimer.
17. The page does not explain whether saved/exported results contain sensitive salary data or direct users to the relevant privacy explanation at the point that exports are discussed.
18. The footer arrives close to the action strip, making the ending feel like two competing navigation areas.

### Accessibility risks

- The warning is conveyed partly through pale-green color and an icon but does not have an explicit warning heading.
- Repeated paragraphs create unnecessary verbosity for screen-reader users.
- Three equal related-page links provide weak prioritization and may be tedious when stacked on small screens.
- Screenshot evidence cannot confirm focus order, focus visibility, landmark naming, 200% zoom, or screen-reader announcement of the warning region.
- The icon is correctly decorative in source, but the warning meaning still needs to be fully expressed in text.

## Opportunity areas

- Replace duplicate prose with one sharp “what this means” summary and non-repeating detail.
- Separate “What the estimate is,” “What it is not,” and “What you should do.”
- Surface ruleset/verification and disclaimer update dates.
- Make the professional-authority action concrete and primary.
- Clarify the relationship among disclaimer, methodology and privacy without three equal CTAs.
- Use the rectangular system to create a scannable legal reference rather than another hero-and-paragraph page.

## Recommendations

1. Remove the repeated obligations copy entirely.
2. Turn the four core boundaries into a visible summary: estimate, not advice, not a return, not proof of remittance.
3. Reorganize details by user question rather than legal topic.
4. Add verified-rules and last-updated dates with a link to methodology.
5. Give the qualified-advice action more prominence and demote unrelated onward links.
6. Use an explicit text label for the warning and do not rely on the pale-green treatment alone.
7. Review the final legal scope with qualified Nigerian counsel before treating the page as exhaustive.

## Evidence limits

- The audit covers the default desktop view and current source content. It is a product-design review, not legal advice.
- Full WCAG compliance, keyboard order and assistive-technology behavior cannot be established from screenshot evidence alone.
