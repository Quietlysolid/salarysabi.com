# Payroll finalisation and exports

Validated 24 September 2026.

- The current calculation is a draft. CSV and PDF downloads identify it as Draft.
- Finalisation opens a review dialog. Cancel does not submit a request; confirmation saves an immutable run. It does not transfer money or remit tax.
- A second finalisation for the same month is rejected. Corrections use saved-run revisions.
- History exports read saved payroll items and preserve the saved ruleset and revision. Editing the current employee roster does not change those exports.
- Payroll amounts are rounded to two decimals before saving. CSV cells guard against spreadsheet formula injection.

## Evidence

`scripts/verify-payroll-workflow.mjs` passed against staging on port 3002: draft CSV/PDF labels, cancellation without saving, confirmed persistence, duplicate rejection, saved exports, immutable CSV after an employee salary edit, and mobile overflow check. The test restored the employee salary after checking it.

127 unit tests, TypeScript, scoped ESLint, and the isolated PostgreSQL connected-record checks passed. Desktop draft and confirmation screenshots are in `test-results/staging/`.

Production was missing migrations 202609240001 and 202609240004. Applied both transactionally; payroll run/item counts were unchanged. Confirmed authenticated clients cannot insert saved runs directly or execute the internal finalisation function. The authenticated amendment function is available. No production payroll was finalised as a test.

Frontend changes were validated locally against staging; this check does not represent a frontend production deployment.
