# Privacy page — dumb-proof audit

Audited at 1440 × 1000 on 19 August 2026.

## Verdict

Mostly healthy, but not fully foolproof. The page explains local calculator processing very well. The main gap is that anonymous salary reports are mentioned in the introduction but are missing from both the short summary and the complete activity table.

## Step 1 — Understand the privacy promise

**Health:** Healthy.

The introduction distinguishes personal calculator figures, stored employer payroll records and grouped salary reports. The three quick facts make local processing and cookieless analytics easy to see.

## Step 2 — Read the short version

**Health:** Mostly healthy.

The five numbered points are plain and actionable. The fifth item leaves an empty visual cell, and the summary does not explain anonymous salary reports despite highlighting them above.

## Step 3 — Check a specific activity

**Health:** Needs improvement.

The four-column reference is thorough but dense. Finding one activity requires scanning nine long rows. An anonymous-salary-report row is missing, so users cannot learn what report fields are stored, who reviews them, how grouping works or how reward-contact information is handled.

## Step 4 — Exercise a privacy choice

**Health:** Healthy.

“Request an update or deletion” is prominent, and the table supplies an action for every listed activity. “Return to calculator” is appropriately secondary.

## Highest-impact changes

1. Add “Anonymous salary reports” to the short version and complete reference.
2. State separately how salary-report answers, reward-access email and payout details are processed and retained.
3. Replace the desktop data table with activity accordions or compact cards; show “What happens,” “Who processes it” and “Your choice” after selecting an activity.
4. Keep the current table semantics as a print-friendly fallback if needed.
5. Balance the short-version grid so it does not end with an accidental empty cell.

## Accessibility risks

- The dense four-column table may be difficult at browser zoom and on narrow screens.
- Mobile reflow must preserve the association between each activity and its three explanations.
- Screenshot evidence cannot confirm keyboard access, disclosure states, screen-reader reading order, focus visibility, contrast ratios or deletion-request feedback.

## Evidence limits

This audit reviews the rendered content and layout. It does not verify network requests, database retention, Supabase configuration, actual deletion behaviour or legal compliance.
