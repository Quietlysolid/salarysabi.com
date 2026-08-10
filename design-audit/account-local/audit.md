# SalarySabi account entry audit

## Audit scope

- Surface: `/account`, signed-out desktop state.
- User goal: understand why an account is useful and confidently sign in or create one.
- Accessibility target: clear form purpose, unambiguous actions, visible recovery, understandable validation and responsive reflow.
- Evidence: `01-current.png`, captured at 1440 x 1024 on 5 August 2026.

## Step 1 — Arrive at My jobs while signed out

Health: usable, but the authentication decision is ambiguous and the page feels unfinished.

### What works

- The value proposition is plain and specific: saved jobs, application tracking and job alerts.
- The three privacy assurances address credible concerns and reinforce SalarySabi’s privacy position.
- The form uses visible labels and native email/password fields.
- The active My jobs navigation state is clear.
- The rectangular controls and restrained green palette match the updated product language.

### UX and product risks

1. The form has no heading, so the right column does not establish whether its current mode is sign-in, registration, or both.
2. “Sign in” and “Create account” are simultaneous submit buttons for the same fields. That makes account creation feel accidental and creates a high-cost misclick.
3. The tiny note below the buttons carries essential instructions that should be expressed by the interaction model itself.
4. There is no “Forgot password?” path, trapping returning users who cannot remember their password.
5. Account creation does not preview its requirements or confirmation flow. Users are not told that they need at least eight characters or that email confirmation follows until after submission.
6. The password field always advertises `current-password`, even when the user chooses account creation; this can produce the wrong autofill behavior.
7. The left side explains features, but does not show the concrete account outcome: saved jobs, application stages and alerts in one workspace.
8. The privacy assurances and benefits are visually identical. The page does not distinguish product value from privacy reassurance.
9. The green vertical bars look decorative rather than clearly meaningful; they create three floating fragments instead of one scannable benefit group.
10. The page uses only a small portion of the desktop viewport, leaving a large empty lower area and making the experience feel like a placeholder.
11. The form container is visually anonymous: no title, no supporting copy, and no trust/recovery information inside the task area.
12. The primary and secondary buttons are nearly equal in visual weight, despite representing different journeys.
13. No link returns users to browsing jobs if they are not ready to create an account.
14. “My jobs” in navigation implies an existing personal workspace, while the page first asks for authentication; the transition could set expectations more clearly.
15. The page does not explain whether an account is optional for browsing or calculating salary.
16. There is no password visibility control, which increases input errors on mobile and for users with cognitive or motor impairments.
17. Error and success messages appear beneath the instructional note, away from the fields and actions that caused them.
18. Raw authentication-provider error messages may be technical, inconsistent in tone, or reveal whether an email exists.
19. The initial session check has no visible loading state, so the signed-out form can flash before an existing session resolves.
20. The signed-in experience is a separate concern but the source shows likely empty-state weaknesses: three plain sections with text-only emptiness and no clear action to find jobs or create an alert.
21. The source contains malformed middle-dot characters in alert metadata (`Â·`), which can surface as visible encoding damage after sign-in.

### Accessibility risks

- The two submit buttons do not communicate a persistent selected mode to assistive technology.
- There is no password reveal control or recovery link.
- Message feedback uses `role=status`, but screenshot evidence cannot confirm focus movement, error association, announcement timing or whether field-level errors are described.
- The button labels are clear individually, yet their shared-form behavior is not clear as a combined interaction.
- Keyboard focus visibility, 200% zoom, autofill styling, mobile keyboard behavior and contrast in validation states require interactive testing.

## Opportunity areas

- Give sign-in and registration separate, explicit modes with one primary submit action.
- Put the active task heading and its expectations directly above the fields.
- Add password recovery and password visibility.
- Show product benefits as a small preview of the workspace rather than only prose.
- Keep privacy reassurance concise and adjacent to the form.
- Add a clear route back to job browsing.
- Design loading, validation, confirmation and account-empty states as part of the same system.

## Recommendations

1. Default to Sign in and provide a clear mode switch to Create account.
2. Change labels, autocomplete attributes, help text and submit copy with the active mode.
3. Add Forgot password and Show password controls.
4. Explain confirmation requirements before account creation.
5. Use one strong product-value panel and one concise privacy note instead of three equivalent decorative bars.
6. Add “Browse jobs without an account” as the graceful exit.
7. Replace raw provider messages with friendly, field-associated validation and recovery guidance.
8. Correct the alert metadata encoding before redesigning the signed-in state.

## Evidence limits

- The audit capture covers the signed-out state. Signed-in, loading, validation, email-confirmation and password-reset states were inspected in source only and were not treated as screenshot-confirmed behavior.
- No claim of full WCAG compliance is made from screenshot evidence alone.
