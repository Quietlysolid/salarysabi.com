# Salary page final dumb-proof verdict

Date: 2026-08-19

## Evidence

The user-provided desktop screenshot of `/salaries` was reviewed as the current start state. A fresh automated capture was blocked because the local Next.js preview stopped responding during verification.

## Verdict

Not 100% dumb-proof. The fields are clear, but the page still presents two conflicting submission routes and repeats the same privacy and empty-state message several times.

## Remaining issues

1. The user learns that the visible form has no reward only after entering the form area. This is a material choice and must appear before the user starts.
2. `Add my salary anonymously` appears in the empty panel while a second salary form sits beside it. The first action merely jumps to the second, so it is unnecessary on desktop.
3. `Compare salaries`, `Salary comparisons`, and `No salary comparisons yet` repeat the same idea in three consecutive levels.
4. `Individual salaries are never published`, `No name or employer`, `anonymously`, and the final privacy note repeat reassurance instead of stating it once clearly.
5. When no comparison data exists, the two-column layout creates a large empty left side while the form becomes a long right column. A single guided column would be easier to follow.

## Recommended structure

1. Heading: `Compare salaries`.
2. One short empty state: `No comparisons yet. Results appear after five similar reports.`
3. Before any fields, present the choice: `Earn ₦1,000` or `Share without a reward`.
4. Show only the selected submission path.
5. Keep one privacy sentence near the submit action.

## Accessibility limits

The screenshot supports a visual hierarchy and visible-contrast review only. Keyboard flow, validation announcements, focus order, screen-reader wording, zoom, and submission recovery still require interactive testing.
