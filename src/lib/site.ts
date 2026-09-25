export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://salarysabi.com";

export const rulesetName = "Nigeria Tax Act 2025 and JRB guidance for 2026";
export const rulesVerifiedDate = "24 September 2026";
export const rulesVerifiedIso = "2026-09-24";
export const legalContentUpdatedDate = "21 August 2026";
export const legalContentUpdatedIso = "2026-08-21";
export const siteContentUpdatedIso = "2026-08-12";
export const rulesetVersion = "2026.2";
export const taxActUrl = "https://nass.gov.ng/documents/download/11249";
export const pitGuidelinesUrl = "https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf";
export const pitGuidelinesReleaseUrl = "https://www.jrb.gov.ng/media-center/jrb-releases-pit-guidelines-2026";
export const taxTransitionUrl = "https://finance.gov.ng/ministry/federal-government-issues-transition-guidelines-for-tax-acts-2025/";
export const presumptiveTaxUrl = "https://www.jrb.gov.ng/documents/nigeria-presumptive-tax-regulations-2026.pdf";
export const virtualAssetsTaxUrl = "https://www.jrb.gov.ng/documents/guidelines-on-taxation-of-virtual-assets-jrb.pdf";
export const withholdingRegulationsUrl = "https://www.jrb.gov.ng/documents/withholding-regulations-2024.pdf";
export const rulesUpdateLabel = "Official sources checked on 24 September 2026; see supported scenarios and newer guidance in the tax updates";
export const taxReviewStatus = "Independent tax-professional review has not been completed";
export const founderLinkedInUrl = "https://www.linkedin.com/in/ozichinwosu";
export const founderGitHubUrl = "https://github.com/Quietlysolid";
export const verificationCadence = "See the tax changelog for completed checks and supported calculation scenarios";

// Kept as an alias for older consumers while trust copy migrates to the named token.
export const lastVerified = rulesVerifiedDate;
