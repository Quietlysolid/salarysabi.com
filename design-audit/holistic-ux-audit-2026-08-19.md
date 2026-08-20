# SalarySabi holistic UX and UI audit

Date: 19 August 2026  
Audit type: Combined UX, visual-design, and accessibility review  
Viewports: 1440 × 1100 desktop and 390 × 844 mobile

## Executive verdict

SalarySabi already feels credible, restrained, and distinctly Nigerian. Its strongest asset is not decoration; it is clarity. The calculator is immediately usable, key figures are easy to scan, jobs foreground pay, the visual language is consistent, and trust material is unusually thorough for an early-stage product.

The biggest weakness is product coherence. The site currently feels like a collection of well-made utilities—PAYE calculator, payslip checker, salary data, jobs, payroll, tax tools, and contributor rewards—rather than one connected “understand and improve my pay” journey. The bright reward proposition is also more visually memorable than the calculation outcome, which risks teaching visitors that SalarySabi is a paid data-collection campaign rather than a trusted work-and-pay platform.

Overall health: **strong foundation, incomplete product narrative**.

## Framework

The audit applies Jon Yablonski’s [Laws of UX](https://lawsofux.com/)—especially Jakob’s Law, Hick’s Law, Fitts’s Law, Tesler’s Law, the Peak–End Rule, the Von Restorff Effect, Postel’s Law, proximity, and common region—alongside the practical hierarchy, spacing, typography, color, empty-state, and “use fewer borders” tactics summarized by Adam Wathan and Steve Schoger’s [Refactoring UI](https://refactoringui.com/).

## Scorecard

| Dimension | Health | Summary |
| --- | --- | --- |
| Core task usability | Strong | The calculator, payslip checker, job card, and guide entry points are understandable without instruction. |
| Product coherence | Mixed | Individual tools are clear, but their relationship and intended user journey are not. |
| Visual hierarchy | Strong | Headlines, numeric results, primary actions, and restrained color are handled well. |
| Trust and reassurance | Strong | Sources, methodology, responsibilities, founder identity, and privacy signals are present. Some are hidden at the moment they matter most. |
| Mobile experience | Good | No horizontal overflow and layouts reflow cleanly. Some descriptions disappear and several secondary targets are small. |
| Accessibility baseline | Good with structural defects | Visible focus, a skip link, labels, H1s, alt coverage, reduced-motion support, and sampled color tokens are good. Several pages contain nested main landmarks. |
| Empty/error states | Needs work | The salary-data empty state offers little immediate value, and an empty calculator submission produces a valid-looking ₦0 result. |

## Highest-impact changes

### 1. Turn the result into the product’s peak moment

**Evidence:** Steps 4 and 5.

The successful result is legible, but the page immediately presents three equally weighted destinations and a bright lime reward banner. The result’s source/freshness, exports, founder assurance, and contextual payslip handoff exist in the component but are hidden in the simplified home treatment.

This works against the Peak–End Rule and Von Restorff Effect: the user is likely to remember the incentive strip more strongly than the answer they came for.

Recommended result order:

1. Take-home pay, PAYE, and effective rate.
2. A compact “Based on 2026 JRB guidance · reviewed on [date]” reassurance line.
3. One primary next action: “Check this against my payslip.”
4. Secondary actions: view calculation, download, share.
5. A quieter salary-contribution invitation after the core task is complete.

### 2. Give the whole product one mental model

**Evidence:** Steps 1, 7, 11, and 12.

The current top-level categories are understandable individually, but visitors must infer how take-home pay, payslip checking, salary comparison, jobs, payroll, and rewards fit together. This transfers avoidable complexity to users (Tesler’s Law) and creates decision friction (Hick’s Law).

Organize the consumer journey around a four-stage model:

- **Understand:** calculate take-home pay.
- **Verify:** check a payslip and learn the calculation.
- **Compare:** see salary benchmarks.
- **Act:** find salary-transparent jobs or manage a small team.

Keep “For businesses” as a separate mode. Treat “Earn rewards” as a campaign or contribution action, not a peer product pillar.

### 3. Fix the calculator’s empty submission

**Evidence:** Step 5.

Clicking the primary button with no salary produces a polished ₦0 take-home result. The system is permissive, but not helpful: Postel’s Law does not mean accepting an absent required value as meaningful data.

On submit, require a positive salary, display a short inline message such as “Enter your monthly salary before deductions,” and focus the salary field. Preserve the entered deductions and period.

### 4. Make “Compare salaries” useful before the dataset is mature

**Evidence:** Step 9.

The page promises comparison but currently contains no public comparisons. Its only meaningful action is to contribute data. Refactoring UI explicitly calls out empty states as designed moments, not blank endpoints.

Until enough benchmarks exist, provide immediate value with one or more of:

- reviewed public salary ranges from job listings;
- role-specific “not enough data yet” pages with related paid jobs;
- a transparent explanation of the five-report privacy threshold;
- progress language that does not expose private counts;
- a preview of the comparison users will unlock.

If no comparison can be shown, rename the entry point temporarily to “Build Nigerian salary benchmarks” so the promise matches the state.

### 5. Clarify “anonymous” before requesting email

**Evidence:** Steps 10 and 11.

The campaign says “Anonymous,” then the next screen asks for email access. This may be operationally sound, but the user must resolve the apparent contradiction.

Use exact trust copy at the email field: “Your email is used for sign-in and reward payment. It is stored separately from the salary data shown in benchmarks.” Link directly to the applicable privacy section and explain deletion/retention.

### 6. Reduce flat, bordered sameness

**Evidence:** Steps 3, 7, 8, 11, 13, and 14.

The design system is disciplined, but many screens rely on full-width rectangles, one-pixel borders, and equally weighted panels. This makes structurally different things—navigation, choices, warnings, and content—feel similar. Refactoring UI’s “use fewer borders” tactic is directly applicable.

Keep borders for inputs, disclosures, tables, and important state boundaries. Use spacing, subtle surface shifts, and selective shadow/elevation for major cards. Give the recommended action more weight and de-emphasize secondary paths.

### 7. Preserve information scent on mobile

**Evidence:** Steps 2, 7, 11, and 12.

Mobile reflow is clean, but some hub cards become large title-only blocks. Removing descriptions saves space but makes the decision harder; Hick’s Law is about complexity as well as count.

Keep a one-line outcome under each business and salary/job choice. Increase compact header and legal-link hit areas where practical. The primary controls already use good 44–54px heights; bring secondary controls closer to that standard.

### 8. Correct the main-landmark structure

**Evidence:** DOM inspection for Steps 1, 7, 9, 11, and 12.

The public shell renders a `main` around the header, page content, and footer, while several child pages also render their own `main`. Those pages therefore contain two main landmarks and nest one main inside another.

Render the shell as a fragment or neutral wrapper containing `header`, a single page `main`, and `footer`. Keep exactly one main landmark per page. The existing skip link should target that main element directly.

### 9. Reconcile the browser tests with the current product

The route sweep passed, but three older “platform redesign” tests expect removed headings and an earlier salary-contribution flow. This is not a user-facing defect today, but it reduces confidence that future regressions will be caught. Update or retire those assertions alongside the next UX change.

## What is already working well

- **Feature-first start:** The homepage opens on the calculator instead of making users parse a marketing hero. This matches both Jakob’s Law and Refactoring UI’s “start with a feature” advice.
- **Clear numerical hierarchy:** Take-home pay dominates; PAYE and rate are correctly secondary. Labels are de-emphasized without losing meaning.
- **Strong consistency:** The Bricolage/Source Sans pairing, dark ink, green, lime accent, square geometry, and spacing rhythm create a recognizable personality.
- **Jobs put pay first:** Salary range, employment type, source freshness, employer-confirmation status, and external destination are visible before application.
- **Trust depth:** The guide, methodology, about page, founder identity, source links, legal pages, employer responsibility, and privacy language reduce financial-product anxiety.
- **Responsive foundation:** All 21 audited route/state combinations had no horizontal overflow at 1440px or 390px.
- **Keyboard foundation:** The skip link is first, focus rings are clearly visible, and the primary calculator path is keyboard reachable in a sensible order.
- **Semantic basics:** Every audited state had one H1, visible inputs were labeled, and no rendered image lacked an alt attribute.
- **Sampled contrast:** Key text tokens tested between 5.2:1 and 7.9:1 against their backgrounds, above the 4.5:1 WCAG AA threshold for normal text. This is a sample, not a complete contrast audit.

## Numbered evidence steps

### Step 1 — Homepage entry — Healthy

The main task is immediate and the headline is plain. Desktop exposes the broader product without displacing the calculator; mobile keeps the first action focused.

![Desktop homepage](holistic-ux-2026-08-19/01-home-entry-desktop.png)

![Mobile homepage](holistic-ux-2026-08-19/01-home-entry-mobile.png)

### Step 2 — Mobile navigation — Mostly healthy

The two highest-frequency actions stay visible and the rest are grouped. The open menu obscures content without a backdrop, and “Earn ₦1,000” is more specific and promotional than the peer navigation labels.

![Mobile navigation open](holistic-ux-2026-08-19/02-navigation-open-mobile.png)

### Step 3 — Calculator input and deductions — Healthy

The common path is simple, advanced deductions are progressive, periods are explicit, and rent relief updates in context. On mobile the expanded form becomes long, but its grouping remains understandable.

![Desktop calculator with deductions](holistic-ux-2026-08-19/02-calculator-input-desktop.png)

![Mobile calculator with deductions](holistic-ux-2026-08-19/03-calculator-input-mobile.png)

### Step 4 — Successful calculation — Mixed

The answer is clear and the supporting metrics are correctly ranked. The experience ends too abruptly; reward acquisition becomes the strongest visual element and core trust/export actions are suppressed.

![Desktop calculation result](holistic-ux-2026-08-19/03-calculator-result-desktop.png)

![Mobile calculation result](holistic-ux-2026-08-19/04-calculator-result-mobile.png)

### Step 5 — Empty calculator submission — Needs correction

An empty salary produces a valid-looking ₦0 result rather than a required-field message.

![Empty calculator submission](holistic-ux-2026-08-19/15-empty-calculator-submission-desktop.png)

### Step 6 — Payslip handoff — Healthy

Salary context carries across, the source of that value is explicit, and “Clear” gives control. The form remains concise on both viewports.

![Desktop payslip checker](holistic-ux-2026-08-19/04-payslip-checker-desktop.png)

![Mobile payslip checker](holistic-ux-2026-08-19/05-payslip-checker-mobile.png)

### Step 7 — Salaries and jobs hub — Mixed

The two core choices are easy to distinguish. The large amount of unused space is not inherently bad, but the page provides little evidence, momentum, or explanation of how tracking, sharing, and comparison connect.

![Desktop salaries and jobs hub](holistic-ux-2026-08-19/05-salaries-jobs-hub-desktop.png)

![Mobile salaries and jobs hub](holistic-ux-2026-08-19/06-salaries-jobs-hub-mobile.png)

### Step 8 — Jobs listing — Healthy

The salary range and verification state are prominent. “Review details first” is a responsible default. With only one job, the page needs stronger discovery/empty-growth support, but the card itself is effective.

![Desktop jobs](holistic-ux-2026-08-19/06-jobs-listing-desktop.png)

![Mobile jobs](holistic-ux-2026-08-19/07-jobs-listing-mobile.png)

### Step 9 — Salary benchmarks — Needs work

The privacy threshold is stated, but the promised comparison delivers no current value. The contribution CTA carries the whole page.

![Salary benchmark empty state](holistic-ux-2026-08-19/07-salary-benchmarks-desktop.png)

### Step 10 — Contributor reward proposition — Mixed

The offer, duration, scarcity, and three-step process are clear. Eligibility is hidden behind a disclosure before the user can proceed, adding friction at the most trust-sensitive point.

![Contributor reward page](holistic-ux-2026-08-19/13-contributor-reward-desktop.png)

### Step 11 — Rewarded salary entry — Mixed

The email gate is simple, but “anonymous” needs a precise explanation because email is requested before the salary questions.

![Rewarded salary entry](holistic-ux-2026-08-19/14-rewarded-salary-entry-desktop.png)

### Step 12 — Business hub — Mixed

The three tasks and responsibility boundary are sensible. On mobile the descriptions disappear, leaving large generic panels with reduced information scent.

![Desktop business hub](holistic-ux-2026-08-19/08-business-hub-desktop.png)

![Mobile business hub](holistic-ux-2026-08-19/08-business-hub-mobile.png)

### Step 13 — Payroll access — Mostly healthy

The feature sequence and limits are explicit, and the sign-in panel is familiar. New users see a product workflow beside an authentication wall without a sample or preview of the resulting payroll record.

![Desktop payroll](holistic-ux-2026-08-19/09-payroll-workspace-desktop.png)

![Mobile payroll](holistic-ux-2026-08-19/09-payroll-workspace-mobile.png)

### Step 14 — PAYE guide and methodology — Healthy

Questions match user language, calculation steps are scannable, sources are available, and the calculator remains the next action. This is the strongest expression of SalarySabi’s trust proposition.

![PAYE guide](holistic-ux-2026-08-19/10-paye-guide-desktop.png)

![Calculation methodology](holistic-ux-2026-08-19/11-methodology-desktop.png)

### Step 15 — About and trust — Healthy

The page explains capability, founder accountability, and verification without inflated claims. It materially supports a finance product’s credibility.

![About and trust page](holistic-ux-2026-08-19/12-about-trust-desktop.png)

### Step 16 — Keyboard entry — Healthy

The skip link is the first focus target, is visually prominent, and focus styling remains visible through the public navigation and calculator controls.

![Keyboard skip link](holistic-ux-2026-08-19/16-keyboard-first-focus-desktop.png)

## Verification and limits

- Fresh screenshots were captured from the local site in this audit run and visually inspected.
- A browser sweep successfully navigated **36 unique internal destinations across 31 public pages**.
- The audited route/state set had no horizontal overflow, missing H1s, unlabeled visible inputs, or rendered images without alt attributes.
- Three older platform-redesign browser tests failed because they assert headings and controls that no longer exist; the current public-link audit passed.
- Authenticated payroll/account states, email delivery, reward payout, form submission persistence, external job applications, downloads, production performance, analytics, and back-end error recovery were not fully exercised.
- Screenshots and DOM checks cannot prove screen-reader output, zoom reflow, every color combination, or WCAG compliance. Manual assistive-technology and 200%/400% zoom testing remain necessary.

## Recommended order of work

1. Validate positive salary input and correct the nested main landmarks.
2. Redesign the calculation result and post-result hierarchy.
3. Reframe the site around one connected pay journey and demote rewards from product-level navigation.
4. Replace the salary-data empty state with honest immediate value.
5. Clarify the email/anonymity model and eligibility rules.
6. Reduce border-heavy sameness, restore mobile descriptions, and enlarge small secondary targets.
7. Update stale browser tests and run a dedicated accessibility pass.
