# Tax calculation corrections — 24 September 2026

Ruleset 2026.2. This is an implementation/source check, not a professional tax opinion.

## Sources

- [Nigeria Tax Act, January 2026 National Assembly text](https://nass.gov.ng/documents/download/11249): sections 56, 58, 59, 163(1)(t), 201 and Fourth Schedule.
- [JRB 2026 PIT Guidelines](https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf): paragraphs 8–9 on relief eligibility and timing.

## Corrections

- Business profit no longer receives the employment minimum-wage exemption. Annual business profit of 820,000 with no deductions produces tax of 3,000.
- Inputs preserve decimals and reject malformed or negative values. Withholding of 7.5% on 100,000 produces 7,500. Users supply and confirm the applicable rate.
- Monthly payroll payments and annual tax reliefs are separate. Existing monthly mortgage/insurance entries remain cash deductions; they do not establish annual relief eligibility. New annual reliefs default to zero and employers must review them for each payroll year. For 2026 insurance relief, use qualifying amounts paid in 2025.
- Added non-negative annual relief columns in staging and the public-app database. Existing cash values and saved runs were not changed. Old CSVs remain readable with zero new reliefs. Saved runs require the existing amendment workflow for corrections.
- Company tax accepts separate assessable profits for development levy and total profits for income tax. A labelled simplified option retains the revenue-minus-expenses proxy. Special sectors, incentives, capital allowances, loss computations and minimum effective tax remain outside scope.
- Foreign business estimates require confirmation of Nigerian-resident sole-trader status and no other taxable income. Employment, mixed income and foreign-tax credits remain unsupported. Withholding calculations do not determine transaction eligibility, exemptions or treaty rates.
- Removed undocumented professional-review claims and updated source-check metadata and the changelog.

## Verification

Focused regression tests cover business versus employment, decimal parsing, separate company bases, externally paid reliefs and current insurance cash withholding. Browser checks cover the public forms and mobile overflow. TypeScript and targeted ESLint passed. The complete suite also checks existing product flows.

## External work

A qualified Nigerian tax professional still needs to review the supported scenarios and sign off on a dated ruleset. No independent review is claimed. Older official company-size definitions conflict with the January National Assembly text; the selected source and limitation remain disclosed. Deployment of this application build is separate from local implementation.
