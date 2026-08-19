# Homepage usability audit

Overall: issues resolved in the final implementation pass.

## 1. Start state — good

Evidence: `01-start.png`

- The primary task, salary period, salary input, and main action are immediately visible.
- “Add optional deductions” correctly communicates that the extra fields are not required.
- Resolved: the fixed card height was removed and the placeholder now explicitly says `e.g. 500,000`.

## 2. Result state — good with one clarity risk

Evidence: `02-result.png`

- Take-home pay, monthly PAYE, and the effective rate are easy to scan.
- “Full calculation” keeps technical detail optional.
- Resolved: the action changes to “Update result” after the first calculation.

## 3. Optional deductions — needs one more pass

Evidence: `03-deductions.png`

- The shorter rows and monthly/yearly switch are understandable.
- Verified: results update live as inputs change; a pension change updated take-home pay without errors.
- Resolved: the expanded deductions state becomes a single-column layout rather than leaving a blank result column.
- Resolved: repeated Pension and NHF hints were removed.
- Resolved: the secondary disclosure is now “More deductions.”
- Resolved: unused tax bands now say “Not reached” instead of displaying unexplained ₦0 values.

## Accessibility limits

- Screenshots show reasonable visible contrast and large targets, but they cannot prove keyboard order, screen-reader announcements, zoom behavior, validation messaging, or mobile usability.
- Browser console errors: none during this capture.
