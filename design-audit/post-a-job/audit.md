# SalarySabi post-a-job audit

## Audit scope

- Surface: `/post-a-job` on the local production preview.
- User goal: submit a credible, salary-transparent job listing quickly and understand what SalarySabi will review.
- Accessibility target: clear field purpose, predictable reading order, visible requirements, useful validation, keyboard operation and resilient mobile reflow.
- Evidence: `01-current.png`, captured at 1440 x 1200 on 5 August 2026; lower-page behavior and fields verified from the local implementation.

## Step 1 — Understand the offer and prepare

Health: fair, but under-explained.

### What works

- “Post a job” is direct and the audience label is clear.
- “Free during the beta” and the salary/application-link requirements appear before the form.
- The preflight note helps employers gather three important items.
- Manual review is stated, which adds trust.

### Problems

1. “Free during the beta” is vague: there is no end date, future price expectation or confirmation that submission does not create a charge.
2. The page does not explain who can post, what industries or locations are accepted, or how quickly review usually takes.
3. It does not say what happens after submission—confirmation, review time, edits, rejection or publication notification.
4. There is no clear privacy reassurance for the contact email before the user enters it.
5. The large empty page margins make the experience feel more like a document than a focused employer tool.

## Step 2 — Enter role information

Health: usable, with avoidable ambiguity.

### What works

- Role, pay and application are sensible high-level groups.
- Recruiter-specific fields appear conditionally instead of burdening direct employers.
- Native controls and explicit labels provide a reasonable semantic base.

### Problems

6. The form is a long single page, but there is no progress overview, sticky section navigation or completion state.
7. Required fields are not visibly marked; users only discover requirements during submission or through browser validation.
8. “Submitting as” leads the form even though job title and company are the employer’s primary mental starting point.
9. Location has only an example, with no guidance for remote jobs, multiple locations or Nigeria-wide roles.
10. “Work arrangement” and “Employment type” are easy to confuse without concise supporting help.
11. The two-column layout creates a scanning zig-zag and can make the intended field order unclear.
12. There is no job preview, so employers cannot see how entered information will appear to candidates.

## Step 3 — Disclose compensation

Health: needs redesign.

### Problems

13. Salary is the product’s key differentiator, but the pay section looks exactly like every other form group.
14. Minimum and maximum salary are visually separated by the grid: minimum appears on the right of one row and maximum on the left of the next, breaking the range relationship.
15. Currency, gross/net, engagement and period precede the actual numbers, creating unnecessary setup before the main task.
16. There is no currency prefix, formatted number preview or example, increasing the chance of entering `500` instead of `500,000`.
17. There is no visible validation that maximum salary must be greater than or equal to minimum salary.
18. “Gross” versus “net” is important but not explained in Nigerian payroll terms.
19. “Engagement: Not confirmed” conflicts with a publication flow that otherwise presents required, verified information.
20. The user cannot see the final candidate-facing salary line before submission.

## Step 4 — Add application details and submit

Health: functional, but low-confidence.

### Problems

21. The date field does not visibly prevent or explain past closing dates.
22. The application URL is required, but there is no inline validation or preview of the destination domain.
23. Contact email is required without saying that it remains private or how SalarySabi will use it.
24. The job-description field offers no prompt, formatting guidance, suggested structure or character counter.
25. An 80-character minimum is enforced but not disclosed until validation occurs.
26. The no-fees confirmation is important but appears late as a dense legal sentence.
27. The primary submit action appears only at the bottom of a long form; there is no sticky action or review step.
28. There is no “Save draft,” which matters for a lengthy employer workflow.
29. Validation relies heavily on native browser behavior and does not provide a page-level error summary.
30. The failure message says to check details but does not identify which details failed.
31. The success state does not provide a submission reference, expected review time, editable copy or clear next action.
32. Resetting the form immediately after success removes the employer’s visible record of what they submitted.
33. There is no explicit anti-scam or publication-quality preview despite SalarySabi manually reviewing listings.

## Accessibility risks

34. The visual section numbers are helpful, but screenshots cannot confirm that errors are programmatically associated with their fields.
35. Required status is not communicated visually before interaction.
36. Placeholder-only examples may disappear once typing begins and should not replace persistent instructions.
37. Dense two-column scanning can become difficult at high zoom; responsive source CSS suggests stacking, but 200% zoom and keyboard order still need testing.
38. Select controls and date behavior depend on browser defaults; screen-reader announcements and error focus were not verified.
39. The submission status uses a live region, which is a strength, but focus does not visibly move to the result or first invalid field.

## Highest-impact recommendations

1. Make the process visibly three steps and show completion/progress.
2. Treat salary as a range composer with adjacent min/max inputs, currency, period and a live candidate-facing preview.
3. Add a review/preview state before final submission.
4. Mark requirements upfront and provide inline validation plus an error summary.
5. Explain contact-email privacy, manual-review timing and the post-submission sequence.
6. Add description guidance and character count.
7. Preserve the rectangular SalarySabi system while reducing the worksheet feeling through stronger grouping and a persistent summary/action area.

## Evidence limits

- The accepted screenshot covers the page entry, role section and most of compensation; remaining controls and state logic were verified from the local source.
- Keyboard, screen-reader, browser validation, success handling and mobile reflow require interactive testing before any WCAG compliance claim.
