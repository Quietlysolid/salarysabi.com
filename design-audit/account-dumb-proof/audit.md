# Account flow audit

## Verdict

Not fully foolproof. Sign-in and account creation are clear, but the large sample workspace competes with the actual task, resembles real account data, and creates an unnecessarily long mobile page.

## Steps

1. **Choose sign in or create account — Mostly healthy.** The two choices are visible and the active choice is clear. “Access your job workspace” is repeated by the larger page heading, and “verified email alerts” is unclear.
2. **Enter account details — Mostly healthy.** Email and password labels are direct, password visibility and recovery are available, and create-account guidance appears before submission. The page lacks a short explanation of why an account is required at the decision point.
3. **Recover from missing information — Healthy with limits.** Browser-required validation focuses the empty email field. Screenshot evidence cannot confirm custom error clarity, screen-reader announcements, or server-error recovery.
4. **Understand what the account contains — Needs improvement.** The preview uses realistic job names, companies, counts, and statuses. “Preview only” is visually weak, so users may mistake it for their own data or think the account has already loaded.
5. **Use the page on mobile — Needs improvement.** The sign-in form is sensibly first, but the complete three-section preview and three reassurance blocks make the page excessively long and bury the footer.

## Highest-impact changes

- Replace the full fake dashboard with three small benefit rows: Save jobs, Track applications, Job alerts.
- Remove sample names, companies, counts, dates, and the “Preview only” label.
- Shorten the heading to “Save and track jobs.”
- Change the form heading to “Sign in” or “Create account” so it matches the selected state.
- Keep one privacy sentence and remove the three repeated reassurance blocks.
- Keep “Browse jobs” as the secondary exit.

## Accessibility limits

Screenshots confirm visible labels, large controls, responsive reflow, and a visible native required-field error. Keyboard order, focus visibility across every control, contrast values, screen-reader names, live error announcements, authentication failures, password reset, and successful account creation still require interactive and assistive-technology testing.
