# Tax source review — 24 September 2026

Reviewed the current supported calculations against primary sources. This is an implementation check, not an independent professional tax review. No further core rate change was identified in these sources. Calculation version remains 2026.2.

| Source | Findings and implementation |
| --- | --- |
| [National Assembly Nigeria Tax Act 2025](https://nass.gov.ng/documents/download/11249) | Fourth Schedule bands match. Section 30 rent relief matches. Employment minimum-wage exemption citation corrected to section 162(1)(t). Sections 27, 56, 59 and 201 support the selected company-tax bases, rates and size thresholds. Earlier official versions differ; the planner retains its version caveat. |
| [JRB PIT Guidelines 2026](https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf) | Paragraphs 8–9 cover eligible contributions, preceding-assessment-year insurance premiums and rent attribution. Appendix 1 contains bands. Corrected the prior Appendix 4 reference and distinguished personal-calculator inputs from payroll relief inputs. PDF dated 24 February; announcement dated 7 April. |
| [Finance transition announcement](https://finance.gov.ng/ministry/federal-government-issues-transition-guidelines-for-tax-acts-2025/) | Announcement dated 18 June. Accounting periods ending before 1 January 2026 remain under the earlier framework. Added planner guidance; did not implement retrospective company-tax calculations. The announcement, not the full transition instrument, was reviewed. |
| [Presumptive Tax Regulations 2026](https://www.jrb.gov.ng/documents/nigeria-presumptive-tax-regulations-2026.pdf) | Regulations 1–3 and 6 concern income not reliably ascertainable. Proper records enabling ordinary assessment exclude presumptive treatment. The current sole-trader planner assumes records-based profit; explicitly excludes presumptive assessment rather than applying its turnover rules indiscriminately. |
| [NRS/JRB virtual-asset guidance](https://www.jrb.gov.ng/documents/guidelines-on-taxation-of-virtual-assets-jrb.pdf) | Circular 2026/21 dated 31 July. Virtual-asset circumstances require separate assessment and are not implemented by the current planners. Added explicit scope and authority links. |
| [Withholding Regulations 2024](https://www.jrb.gov.ng/documents/withholding-regulations-2024.pdf) | Linked payment-category guidance directly from the investment arithmetic tool. It still requires a user-confirmed rate and does not determine treaty eligibility, exemptions or final liability. |

PDF evidence was downloaded under `supabase/.temp/tax-source-check-20260924`. Scanned presumptive provisions and the Act's schedule, employment exemption and definitions were visually inspected. SHA-256:

```
act          41abf6887bc58a3c97116fd9a048aa91ad49c1cab156f39065a58401c0fce94f
pit          99ec0d0bcc5b1f4e1d592e15d4728715e8758fb3724fab4dcd495f389d5b22a8
presumptive  2b09d56597f416d7cdde56b981386538067b606851d8c2b127db9ff1c6d32f62
virtual      d2ab116aa3e430173d6231501416b73a474558e59d80e3d96fa83bd2b0336ea3
withholding  fe3b865fa5c074f5c9d47621fed1de6ebdc1e8ba3422493212a700cbe760ac86
```

Validation: 130 unit tests passed; TypeScript passed. Browser checks at 1440, 390 and 320 pixels found no horizontal overflow; native coverage disclosures responded to keyboard Enter. Desktop and mobile screenshots inspected. Rate formulas were not changed in this update.

Targeted ESLint passed. All 15 in-page anchors resolve. Desktop/mobile automated accessibility checks passed locally and on the initial live release, with no detected WCAG A/AA violations or browser errors. The user subsequently requested removal of the independent-review paragraph from the update page; the paragraph and its unused style were removed without changing calculation behavior.
