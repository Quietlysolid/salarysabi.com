# Product design audit: How PAYE is calculated

Evidence captured 5 August 2026 from the current production page at desktop width:

- `01-top.png`: page opening and calculation steps
- `02-full.png`: complete page and footer

## Journey health

1. **Arrival and orientation: Fair.** The title is clear, the year is explicit, and the introduction corrects a common misconception. The oversized heading pushes the useful method below the fold, while no immediate calculator action connects explanation to the user's own salary.
2. **Page navigation: Fair.** The contents list exposes the four sections, but it looks like metadata instead of obviously interactive navigation. It does not remain available during the long read and gives no location feedback.
3. **Understand the calculation: Weak.** The four steps are accurate and concise, but they are presented as nearly identical text rows. The page does not show values flowing from gross income to deductions, chargeable income, tax bands, annual PAYE, and monthly PAYE.
4. **Understand exceptions: Weak.** Rent relief and minimum-wage exemption are visually detached from the main sequence. The formula callout helps, but the user cannot see where the relief enters the calculation or whether the exemption bypasses later steps.
5. **Verify and continue: Weak.** Source names and one regression example are buried in prose. There are no direct source citations, verification date, compact evidence record, or strong next action back to the calculator.

## What works

- Strong, plain-language title and explicit 2026 scope.
- Restrained SalarySabi visual system: white canvas, dark green type, lime accent, thin rules, and rectangular geometry.
- Clear four-part content hierarchy and useful anchor links.
- The copy directly states that graduated bands do not apply one rate to the whole salary.
- Rent relief is expressed as a compact formula.
- The official JRB example gives the methodology a useful validation point.

## What is not working

### Information design

- The page explains a process without visualizing the process. Users must construct the calculation model in their heads.
- The sequence omits an explicit named checkpoint for chargeable income, which is the key bridge between deductions and bands.
- The tax-band application is described but not demonstrated. This is likely the hardest concept on the page and receives only two sentences.
- The regression example is buried inside the sources paragraph instead of being shown as a worked example.
- Rent relief and the minimum-wage exemption do not visibly connect to the four-step model.
- The page has no summary formula or at-a-glance answer for readers who do not need the full explanation.

### Hierarchy and layout

- The hero consumes disproportionate vertical space relative to the amount of actionable information it contains.
- The page becomes a single narrow stream of text, leaving a large unused right side on desktop.
- The contents block has weak affordance. Its links resemble labels and the two-row wrapping makes scanning less predictable.
- Repeated step rows have too little visual differentiation, so the most important explanation feels like documentation rather than an instructional tool.
- Section spacing is generous but not purposeful. The lower page feels sparse and unfinished rather than calm.
- The footer arrives immediately after sources without a closing action, summary, or transition.

### Content and trust

- “Transparent annual calculation” is asserted, but the page does not expose enough of the arithmetic to earn that promise visually.
- The source organizations are named, but the precise documents are not directly cited from this page.
- The page does not surface a rules verification date near the methodology.
- The phrase “regression fixture” is implementation language and is not meaningful to most salary earners.
- The explanation does not distinguish clearly between values entered by the user, values calculated by SalarySabi, and values supplied by law.
- There is no concise caution that an estimate is not tax advice or proof of remittance, even though that context matters before users rely on the result.

### Conversion and continuity

- There is no prominent “Calculate my PAYE” action at the opening or end.
- The page does not offer a worked-example-to-calculator handoff.
- Related pages are plain inline links, which makes the next step easy to miss.

## Accessibility risks visible from the evidence

- Small uppercase labels, step numbers, contents text, footer links, and body copy may become difficult to read at zoom or for low-vision users.
- Several green-on-white text treatments need contrast verification in code.
- Link recognition leans heavily on color; the contents links have little conventional link affordance.
- The very large heading and dense lower text may produce awkward reflow at 200% zoom.
- The full-page capture cannot prove keyboard focus visibility, skip-link behavior, anchor focus management, semantic list quality, or mobile table/reflow behavior. Those require implementation testing.

## Recommended direction

Turn the page from a static article into a transparent calculation walkthrough. Preserve the rectangular SalarySabi system, but give the arithmetic a visible flow, elevate the official worked example, connect exceptions to the step where they apply, and end with a clear route back to the calculator.
