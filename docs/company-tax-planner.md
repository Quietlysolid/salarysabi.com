# Company-tax planning model

Reviewed 24 September 2026.

Source: https://nass.gov.ng/documents/download/11249 (January 2026 text).
Sections 56 and 59 specify 0%/30% company income tax and 4% development levy;
section 201 defines small companies using turnover <= NGN100m and total fixed
assets <= NGN250m. Older NIPC-hosted official copies instead use NGN50m and
exclude professional services. The UI identifies the selected source and this
difference; professional confirmation remains necessary before filing.

This calculator is restricted in its stated scope to ordinary Nigerian-resident
companies. Its simplified option uses revenue minus entered deductible expenses,
floored at zero, as a proxy for both tax bases. The tax-computation option accepts
separate assessable profits for development levy and total profits for company
income tax. Actual assessable and total profits can differ.
Capital allowances, credits, incentives, carried losses, special-sector and
minimum-effective-tax regimes are not implemented. Zero is not an exemption
certificate or verification of all eligibility conditions.

Validation: both thresholds at/above boundaries, zero revenue, losses and
separate income-tax/levy amounts have unit coverage. Desktop/mobile browser
checks covered blank/negative inputs, decimals, zero, omitted expenses, losses,
stale-result clearing and focus after errors/submission.
