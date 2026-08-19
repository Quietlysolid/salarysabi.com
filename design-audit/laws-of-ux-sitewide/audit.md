# SalarySabi — sitewide Laws of UX audit

Audit date: 19 August 2026
Viewport evidence: desktop 1440 × 1000; core homepage also checked at 390 × 844.

## Overall verdict

SalarySabi is coherent, restrained and much easier to use than a typical tax product. It performs especially well against Fitts’s Law, Hick’s Law, Jakob’s Law, the Law of Common Region and the Doherty Threshold. The core tasks are obvious, controls are large, results appear quickly and the visual language is consistent.

It is not yet a completely foolproof product. The remaining problems are systemic rather than copy-level: the reward offer competes with primary tasks, short pages are visually dominated by the footer, the Salaries page opens with a clipped global header, unverified jobs still make “Apply” the strongest action, and form errors rely on transient browser validation.

## Audit steps

### 1. Calculate take-home pay — Healthy

Evidence: [desktop start](01-home.png), [desktop result](14-home-result.png), [mobile start](13-home-mobile.png)

- **Fitts’s Law:** salary input, deduction disclosure and calculation button are large and easy to target.
- **Doherty Threshold:** the result appears immediately and the button correctly changes to “Update result.”
- **Common Region:** input and result are clearly separated after calculation.
- Risk: before calculation, the desktop layout leaves a large unused right side. A compact “Your result will appear here” state would preserve the two-column mental model without adding text.
- Risk: “Earn rewards” in the header and the lime reward banner use the strongest contrast on the page. By the Von Restorff Effect, they compete with the calculator’s actual primary task.
- Mobile reflow is strong, but the development-only Next.js indicator overlaps content in the captured build and should not be mistaken for production UI.

### 2. Check payslip PAYE — Healthy

Evidence: [start](02-payslip.png), [result](15-payslip-result.png)

- **Jakob’s Law:** the form follows familiar label, hint, input and submit patterns.
- **Doherty Threshold:** feedback is immediate.
- **Peak-End Rule:** the result ends with a concrete instruction—verify the PAYE figure, then ask payroll—which gives the flow a useful conclusion.
- Risk: the initial desktop screen uses only half the available width and then jumps to two columns after submission. This shift is understandable but visually abrupt.
- Risk: “Check PAYE,” “Check payslip PAYE” and “Check my payslip” name the same task differently across navigation, heading, button and footer.

### 3. Choose between salaries, jobs and sharing — Needs improvement

Evidence: [Salaries & jobs hub](03-salaries-jobs.png), [salary empty state](04-salaries.png)

- **Hick’s Law:** the hub reduces the main decision to two strong choices.
- **Law of Proximity:** compare and find actions are grouped clearly.
- Critical visual bug: the Salaries page’s global header is clipped even at `scrollY = 0`; only part of the navigation is visible. This breaks Jakob’s Law and removes the expected escape/navigation route.
- **Goal-Gradient Effect:** “Results appear after five similar reports” explains the threshold but gives no sense of current progress. If privacy permits, “0 of 5 similar reports” or “More reports needed” would make contribution feel consequential.
- “Share salary” is presented through multiple routes with different emphasis. The reward and non-reward choice is clear here, but the sitewide reward CTA makes the unpaid option feel secondary everywhere else.

### 4. Find and apply for a job — Mostly healthy

Evidence: [jobs listing](05-jobs.png)

- Salary, employer, work mode and source are grouped well; the job card respects the Law of Common Region.
- Large full-width actions satisfy Fitts’s Law.
- Risk: “Apply on Indeed” is the strongest action while the same card says employer confirmation is pending. This encourages action before inspection. For unverified listings, “View details” should be primary and external apply secondary.
- “1 job available” consumes a full-width band without adding navigation or filtering value. It becomes visual weight disproportionate to its information.

### 5. Use employer tools and post a job — Mostly healthy

Evidence: [business hub](06-business.png), [post-job form](07-post-job.png), [validation](16-post-job-errors.png)

- **Hick’s Law:** the business hub offers three understandable paths.
- **Tesler’s Law:** the responsibility notice correctly keeps unavoidable payment and filing complexity with the employer instead of pretending the tool handles it.
- **Goal-Gradient Effect:** the three-step Role → Pay → Application indicator makes the posting journey understandable.
- Risk: incomplete submission uses a transient native tooltip on the first invalid field only. There is no persistent error summary, no inline message, and no count of remaining errors. Recovery therefore depends heavily on browser behavior.
- Risk: “All fields are required” is broad; marking required labels or explaining only exceptional optional fields would reduce memory load.

### 6. Earn a salary-report reward — Mostly healthy

Evidence: [reward page](08-rewards.png)

- **Serial Position Effect:** the promise, eligibility action and three-step process appear in a sensible order.
- **Goal-Gradient Effect:** Answer → Review → Get paid is concise and motivating.
- Risk: “Check eligibility” and “Who qualifies and what approval means” are two entrances to the same decision. One expandable eligibility control with a clear “Continue” action would reduce choice friction.
- Risk: the ₦1,000 offer is the most visually distinctive element across the entire product. The Von Restorff Effect is useful for campaigns, but sitewide repetition makes SalarySabi feel reward-led rather than pay-understanding-led.

### 7. Choose a tax tool and learn PAYE — Healthy

Evidence: [tax-tool chooser](09-tax-tools.png), [PAYE guide](10-paye-guide.png)

- **Hick’s Law:** five income categories are understandable and use plain language.
- **Miller’s Law:** the PAYE guide chunks learning into four questions rather than exposing a long article.
- **Progressive Disclosure:** “Sources and updates” keeps proof available without blocking the main learning flow.
- Risk: naming drifts between “Calculate my PAYE,” “Calculate take-home pay” and “Calculate my pay.” Use one canonical task label sitewide.
- Minor polish: the five-card tax grid leaves a visibly empty sixth cell, weakening balance on wide screens.

### 8. Establish trust and understand data handling — Healthy

Evidence: [About](11-about.png), [Privacy](12-privacy.png)

- **Aesthetic-Usability Effect:** restrained typography, green palette and consistent square cards make serious information feel credible.
- **Progressive Disclosure:** privacy details remain available without creating a wall of legal text.
- **Jakob’s Law:** About follows the expected product purpose → maker → verification structure.
- Risk: on short pages, the large footer occupies almost as much visual space as the page’s primary content. This weakens the visual ending and makes every route feel similarly long despite having little content.

## Highest-impact fixes

1. Fix the clipped global header on `/salaries` before further polish.
2. Establish one canonical label for each core task: “Calculate take-home pay,” “Check payslip PAYE,” “Compare salaries,” and “Find jobs.”
3. Reduce the reward CTA’s sitewide dominance. Keep it prominent on contribution surfaces, quieter elsewhere.
4. Make “View details” primary for jobs whose employer confirmation is pending.
5. Add persistent inline errors and an error summary to multi-step forms.
6. Add a compact pre-calculation result placeholder on desktop or collapse the calculator to one centered column until a result exists.
7. Create a compact footer treatment for short utility and hub pages.
8. Add privacy-safe progress language to salary empty states.

## Accessibility risks

- Several muted labels and placeholders appear light; contrast needs measurement rather than visual judgment alone.
- Inline and footer links have relatively small targets compared with the rest of the interface.
- Native form validation may be announced differently across browser and screen-reader combinations; add persistent programmatic error text.
- Keyboard order, focus visibility, screen-reader naming, zoom at 200–400%, and live result announcements were not verified in this screenshot-led audit.

## Evidence limits

This audit inspected captured desktop states, the mobile homepage, calculator and payslip results, and one invalid form submission. It did not authenticate into payroll or account workspaces, complete salary/job submissions, test every mobile route, measure contrast ratios, or run a full assistive-technology/WCAG conformance assessment.
