export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://salarysabi.com";

export const rulesetName = "Nigeria Tax Act 2025 and JRB guidance for 2026";
export const rulesVerifiedDate = "29 July 2026";
export const rulesVerifiedIso = "2026-07-29";
export const legalContentUpdatedDate = "8 August 2026";
export const legalContentUpdatedIso = "2026-08-08";
export const siteContentUpdatedIso = "2026-08-12";
export const rulesetVersion = "2026.1";
export const taxActUrl = "https://nass.gov.ng/documents/download/11249";
export const pitGuidelinesUrl = "https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf";
export const pitGuidelinesReleaseUrl = "https://www.jrb.gov.ng/media-center/jrb-releases-pit-guidelines-2026";
export const rulesUpdateLabel = "Updated after the JRB issued the Personal Income Tax Guidelines 2026 on 7 April 2026";
export const taxReviewStatus = "Independent tax-professional review pending";
export const founderLinkedInUrl = "https://www.linkedin.com/in/ozichinwosu";
export const founderGitHubUrl = "https://github.com/Quietlysolid";
export const verificationCadence = "Reviewed monthly and after every relevant JRB, NRS or state revenue-authority notice";

// Kept as an alias for older consumers while trust copy migrates to the named token.
export const lastVerified = rulesVerifiedDate;
