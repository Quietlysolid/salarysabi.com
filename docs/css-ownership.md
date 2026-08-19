# CSS ownership and regression rules

SalarySabi still has one accumulated global stylesheet. Until route styles are migrated into smaller files or CSS modules, new work must follow these ownership rules.

## Route-owned namespaces

| Surface | Required root or prefix |
| --- | --- |
| Disclaimer ledger | `disclaimer-ledger-` |
| PAYE methodology | `methodology-` |
| Privacy ledger | `privacy-` |
| Guided homepage | `guided-` |
| PAYE guide index and trail | `paye-guide-` |
| Tax-band reference | `tax-bands-` |
| Jobs discovery | `jobs-` or `job-` within the jobs components |
| Payslip checker | `payslip-` |
| Account workspace | `account-` |

Do not introduce generic layout classes such as `evidence-row`, `ledger-row`, `content-row` or `result-row` for route-specific structures. Shared components must use an explicitly documented shared prefix and have the same DOM contract everywhere they are consumed.

## Required checks

- `npm run audit:css` prevents known high-duplication selectors from growing and rejects the generic evidence selectors that caused the disclaimer regression.
- `npm test` verifies source-level ownership of disclaimer, methodology and privacy ledger classes.
- `npm run test:layout` verifies the critical layouts at desktop and mobile widths in a real Chromium browser.
- `npm run build` remains the final compilation and route-generation check.

## Migration policy

When substantially editing an older route, move its route-owned rules behind the appropriate namespace or into a CSS module as part of that change. Do not perform a blind whole-file rewrite. The stylesheet contains several generations of valid production behavior, so each extraction requires route screenshots and layout tests before deletion of the older rules.
